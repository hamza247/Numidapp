import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  Linking,
  I18nManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/lib/i18n";
import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";

interface Props {
  visible: boolean;
  onAllow: () => void;
  onDecline: () => void;
  privacyPolicyUrl?: string;
}

interface Bullet {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  titleKey: "contactConsentBullet1Title" | "contactConsentBullet2Title" | "contactConsentBullet3Title" | "contactConsentBullet4Title";
  bodyKey: "contactConsentBullet1Body" | "contactConsentBullet2Body" | "contactConsentBullet3Body" | "contactConsentBullet4Body";
}

const BULLETS: Bullet[] = [
  { icon: "phone-portrait-outline", color: "#00C9D4", titleKey: "contactConsentBullet1Title", bodyKey: "contactConsentBullet1Body" },
  { icon: "people-outline",         color: "#C49A2A", titleKey: "contactConsentBullet2Title", bodyKey: "contactConsentBullet2Body" },
  { icon: "shield-checkmark-outline", color: "#4CAF50", titleKey: "contactConsentBullet3Title", bodyKey: "contactConsentBullet3Body" },
  { icon: "hand-left-outline",      color: "#9C88FF", titleKey: "contactConsentBullet4Title", bodyKey: "contactConsentBullet4Body" },
];

export default function ContactConsentSheet({ visible, onAllow, onDecline, privacyPolicyUrl }: Props) {
  const { t, fonts } = useLanguage();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const isRtl = I18nManager.isRTL;

  const slideAnim = useRef(new Animated.Value(600)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDecline} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.card,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Grabber */}
        <View style={styles.grabber} />

        {/* Header icon */}
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: "#00C9D4" + "18", borderColor: "#00C9D4" + "30" }]}>
            <Ionicons name="shield-checkmark" size={36} color="#00C9D4" />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text, fontFamily: fonts.bold, textAlign: isRtl ? "right" : "center" }]}>
          {t.contactConsentTitle}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: fonts.regular, textAlign: isRtl ? "right" : "center" }]}>
          {t.contactConsentSubtitle}
        </Text>

        {/* Bullets */}
        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {BULLETS.map((b) => (
            <View
              key={b.titleKey}
              style={[
                styles.bullet,
                { backgroundColor: theme.background, flexDirection: isRtl ? "row-reverse" : "row" },
              ]}
            >
              <View style={[styles.bulletIcon, { backgroundColor: b.color + "18", borderColor: b.color + "30" }]}>
                <Ionicons name={b.icon} size={18} color={b.color} />
              </View>
              <View style={[styles.bulletText, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.bulletTitle, { color: theme.text, fontFamily: fonts.semiBold, textAlign: isRtl ? "right" : "left" }]}>
                  {t[b.titleKey]}
                </Text>
                <Text style={[styles.bulletBody, { color: theme.textSecondary, fontFamily: fonts.regular, textAlign: isRtl ? "right" : "left" }]}>
                  {t[b.bodyKey]}
                </Text>
              </View>
            </View>
          ))}

          {/* Privacy policy link */}
          <Pressable
            onPress={() => {
              const url = privacyPolicyUrl || "https://numidapp.co/privacy";
              Linking.openURL(url).catch(() => {});
            }}
            style={({ pressed }) => [styles.privacyLink, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="open-outline" size={13} color="#00C9D4" />
            <Text style={[styles.privacyLinkText, { fontFamily: fonts.medium }]}>
              {t.contactConsentPrivacyLink}
            </Text>
          </Pressable>
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={onDecline}
            style={({ pressed }) => [
              styles.declineBtn,
              { borderColor: theme.textSecondary + "40", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.declineBtnText, { color: theme.textSecondary, fontFamily: fonts.medium }]}>
              {t.contactConsentDecline}
            </Text>
          </Pressable>

          <Pressable
            onPress={onAllow}
            style={({ pressed }) => [
              styles.allowBtn,
              { backgroundColor: "#00C9D4", opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#000" />
            <Text style={[styles.allowBtnText, { fontFamily: fonts.semiBold }]}>
              {t.contactConsentAllow}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 24,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 20,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 4,
  },
  bullet: {
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: "flex-start",
  },
  bulletIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    gap: 3,
  },
  bulletTitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  bulletBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  privacyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
  },
  privacyLinkText: {
    fontSize: 12,
    color: "#00C9D4",
    textDecorationLine: "underline",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
  },
  declineBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtnText: {
    fontSize: 14,
  },
  allowBtn: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  allowBtnText: {
    fontSize: 15,
    color: "#000",
  },
});
