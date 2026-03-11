import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
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

interface Props {
  onDone: () => void;
}

export function SplashIntro({ onDone }: Props) {
  const { t, fonts } = useLanguage();

  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);

  const glow1Scale = useSharedValue(0.8);
  const glow1Opacity = useSharedValue(0);
  const glow2Scale = useSharedValue(0.8);
  const glow2Opacity = useSharedValue(0);

  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);

  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 10, stiffness: 70 });
    logoOpacity.value = withTiming(1, { duration: 600 });

    glow1Opacity.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(0.18, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.06, { duration: 900, easing: Easing.inOut(Easing.quad) })
        ),
        4,
        true
      )
    );
    glow1Scale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.95, { duration: 900, easing: Easing.inOut(Easing.quad) })
        ),
        4,
        true
      )
    );

    glow2Opacity.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(0.1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.03, { duration: 1100, easing: Easing.inOut(Easing.quad) })
        ),
        3,
        true
      )
    );
    glow2Scale.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1.25, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.05, { duration: 1100, easing: Easing.inOut(Easing.quad) })
        ),
        3,
        true
      )
    );

    taglineOpacity.value = withDelay(650, withTiming(1, { duration: 600 }));
    taglineY.value = withDelay(
      650,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) })
    );

    const exitTimer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 500 }, (done) => {
        if (done) runOnJS(onDone)();
      });
    }, 2900);

    return () => clearTimeout(exitTimer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const glow1Style = useAnimatedStyle(() => ({
    transform: [{ scale: glow1Scale.value }],
    opacity: glow1Opacity.value,
  }));

  const glow2Style = useAnimatedStyle(() => ({
    transform: [{ scale: glow2Scale.value }],
    opacity: glow2Opacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.center}>
        <Animated.View style={[styles.glow2, glow2Style]} />
        <Animated.View style={[styles.glow1, glow1Style]} />

        <Animated.View style={logoStyle}>
          <Image
            source={require("../assets/images/logo-numid.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text
          style={[
            styles.tagline,
            { fontFamily: fonts.medium },
            taglineStyle,
          ]}
        >
          {t.appTagline}
        </Animated.Text>
      </View>
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow1: {
    position: "absolute",
    width: 320,
    height: 200,
    borderRadius: 160,
    backgroundColor: "#00C9D4",
  },
  glow2: {
    position: "absolute",
    width: 420,
    height: 280,
    borderRadius: 210,
    backgroundColor: "#0066FF",
  },
  logo: {
    width: 300,
    height: 110,
  },
  tagline: {
    marginTop: 20,
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
