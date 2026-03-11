import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useLanguage } from "@/lib/i18n";

const RING_SIZE = 120;

interface Props {
  onDone: () => void;
}

export function SplashIntro({ onDone }: Props) {
  const { t, fonts } = useLanguage();

  const logoScale = useSharedValue(0.35);
  const logoOpacity = useSharedValue(0);

  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0);

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(18);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(22);

  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 11, stiffness: 75 });
    logoOpacity.value = withTiming(1, { duration: 550 });

    ring1Scale.value = withDelay(
      280,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 50 }),
          withTiming(2.6, { duration: 1500, easing: Easing.out(Easing.quad) })
        ),
        3,
        false
      )
    );
    ring1Opacity.value = withDelay(
      280,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 50 }),
          withTiming(0, { duration: 1500 })
        ),
        3,
        false
      )
    );

    ring2Scale.value = withDelay(
      980,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 50 }),
          withTiming(2.6, { duration: 1500, easing: Easing.out(Easing.quad) })
        ),
        2,
        false
      )
    );
    ring2Opacity.value = withDelay(
      980,
      withRepeat(
        withSequence(
          withTiming(0.35, { duration: 50 }),
          withTiming(0, { duration: 1500 })
        ),
        2,
        false
      )
    );

    titleOpacity.value = withDelay(480, withTiming(1, { duration: 520 }));
    titleY.value = withDelay(
      480,
      withTiming(0, { duration: 520, easing: Easing.out(Easing.quad) })
    );

    taglineOpacity.value = withDelay(720, withTiming(1, { duration: 600 }));
    taglineY.value = withDelay(
      720,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) })
    );

    const exitTimer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 520 }, (done) => {
        if (done) runOnJS(onDone)();
      });
    }, 2800);

    return () => clearTimeout(exitTimer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.logoArea}>
        <Animated.View style={[styles.ring, ring1Style]} />
        <Animated.View style={[styles.ring, ring2Style]} />
        <Animated.View style={logoStyle}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <Animated.Text style={[styles.title, { fontFamily: fonts.bold }, titleStyle]}>
        NUMID
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { fontFamily: fonts.medium }, taglineStyle]}>
        {t.appTagline}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#080C14",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logoArea: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  ring: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "#00C9D4",
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    fontSize: 28,
    color: "#00C9D4",
    letterSpacing: 6,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 15,
    color: "#6B7FA3",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
