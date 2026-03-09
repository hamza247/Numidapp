import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useColorScheme,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useLanguage } from "@/lib/i18n";
import { legalContent, LegalSection } from "@/lib/legal-content";

type LegalType = "privacy" | "terms" | "about";

function Section({ title, section, isRTL }: { title: string; section: LegalSection; isRTL: boolean }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme !== "light" ? Colors.dark : Colors.light;
  const { fonts } = useLanguage();
  return (
    <View style={sectionStyles.container}>
      <Text style={[
        sectionStyles.title,
        { color: theme.tint, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" },
      ]}>
        {title}
      </Text>
      {section.paragraphs?.map((para, i) => (
        <Text
          key={i}
          style={[
            sectionStyles.para,
            { color: theme.textSecondary, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" },
            i > 0 && { marginTop: 8 },
          ]}
        >
          {para}
        </Text>
      ))}
      {section.bullets?.map((bullet, i) => (
        <View key={i} style={[sectionStyles.bulletRow, isRTL && sectionStyles.bulletRowRTL]}>
          <Text style={[sectionStyles.bulletDot, { color: theme.tint }, isRTL && sectionStyles.bulletDotRTL]}>
            {"\u2022"}
          </Text>
          <Text style={[
            sectionStyles.bulletText,
            { color: theme.textSecondary, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" },
          ]}>
            {bullet}
          </Text>
        </View>
      ))}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 28 },
  title: { fontSize: 15, marginBottom: 10, letterSpacing: 0.2 },
  para: { fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: "row", marginTop: 6, paddingRight: 8 },
  bulletRowRTL: { flexDirection: "row-reverse", paddingRight: 0, paddingLeft: 8 },
  bulletDot: { fontSize: 14, marginRight: 8, lineHeight: 22 },
  bulletDotRTL: { marginRight: 0, marginLeft: 8 },
  bulletText: { fontSize: 14, lineHeight: 22, flex: 1 },
});

export default function LegalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: LegalType }>();
  const { t, language, fonts } = useLanguage();

  const isRTL = language === "ar";
  const legalType: LegalType = (type === "privacy" || type === "terms" || type === "about") ? type : "about";

  const TITLES: Record<LegalType, string> = {
    privacy: t.privacyPolicyTitle,
    terms: t.termsTitle,
    about: t.aboutTitle,
  };
  const title = TITLES[legalType];
  const doc = legalContent[legalType][language];

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + webTop,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={24}
            color={theme.text}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: fonts.semiBold }]}>
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: insets.bottom + 40 + webBottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          {doc.sections.map((section, i) => (
            <Section
              key={i}
              title={section.title}
              section={section}
              isRTL={isRTL}
            />
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 17 },
});
