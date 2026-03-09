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

type LegalType = "privacy" | "terms" | "about";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme !== "light" ? Colors.dark : Colors.light;
  return (
    <View style={sectionStyles.container}>
      <Text style={[sectionStyles.title, { color: theme.tint, fontFamily: "Inter_700Bold" }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Para({ children, style }: { children: React.ReactNode; style?: object }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme !== "light" ? Colors.dark : Colors.light;
  return (
    <Text style={[sectionStyles.para, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }, style]}>
      {children}
    </Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme !== "light" ? Colors.dark : Colors.light;
  return (
    <View style={sectionStyles.bulletRow}>
      <Text style={[sectionStyles.bulletDot, { color: theme.tint }]}>{"\u2022"}</Text>
      <Text style={[sectionStyles.bulletText, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
        {children}
      </Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 28 },
  title: { fontSize: 15, marginBottom: 10, letterSpacing: 0.2 },
  para: { fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: "row", marginTop: 6, paddingRight: 8 },
  bulletDot: { fontSize: 14, marginRight: 8, lineHeight: 22 },
  bulletText: { fontSize: 14, lineHeight: 22, flex: 1 },
});

function PrivacyContent() {
  return (
    <>
      <Section title="What We Collect">
        <Para>
          When you create an account, we collect your full name, phone number, and country code. When you upload your contacts, we store the phone numbers and names from your address book to power the search feature.
        </Para>
      </Section>

      <Section title="How We Use Your Data">
        <Bullet>Your contacts are stored to let other users search whether their number is saved by someone in our network.</Bullet>
        <Bullet>We never sell your data or contacts to third parties.</Bullet>
        <Bullet>We do not use your data for advertising or profiling.</Bullet>
        <Bullet>Your password is stored as a one-way hash and cannot be recovered by us.</Bullet>
      </Section>

      <Section title="Third-Party Phone Numbers">
        <Para>
          When you upload contacts, phone numbers of people who are not registered users may be stored. These numbers are only used to answer search queries — they are never surfaced or shared in any other way.
        </Para>
      </Section>

      <Section title="Your Rights">
        <Bullet>You can remove your phone number from all search results at any time from your profile page.</Bullet>
        <Bullet>You can delete your account and all associated data at any time from your profile page.</Bullet>
        <Bullet>EU residents have the right to request access, correction, or erasure of their personal data under GDPR.</Bullet>
        <Bullet>California residents have rights under CCPA, including the right to know what data is collected and to request deletion.</Bullet>
      </Section>

      <Section title="Data Security">
        <Para>
          We use industry-standard security practices to protect your data. All communication between the app and our servers is encrypted. We do not store passwords in plain text.
        </Para>
      </Section>

      <Section title="Contact">
        <Para>
          For privacy inquiries or data deletion requests, please contact us through the app's support channel. Non-registered users who wish to opt out can use the Remove My Number feature after creating a free account.
        </Para>
      </Section>

      <Section title="Last Updated">
        <Para>March 2026</Para>
      </Section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <Section title="Acceptance">
        <Para>
          By using Who Saved Me, you agree to these Terms. If you do not agree, please do not use the app.
        </Para>
      </Section>

      <Section title="What the App Does">
        <Para>
          Who Saved Me lets users discover who has saved their phone number in others' contact lists. Users contribute by uploading their own contacts, which builds the shared index that makes searches possible.
        </Para>
      </Section>

      <Section title="Your Responsibilities">
        <Bullet>You must be at least 13 years old to use this app.</Bullet>
        <Bullet>You must only upload contacts that you legitimately have access to (your own address book).</Bullet>
        <Bullet>You must not attempt to scrape, reverse-engineer, or misuse the search feature.</Bullet>
        <Bullet>You must not use the app to harass, stalk, or harm others.</Bullet>
        <Bullet>You are responsible for keeping your account credentials secure.</Bullet>
      </Section>

      <Section title="Coin System">
        <Bullet>New accounts receive 5 free coins upon registration.</Bullet>
        <Bullet>5 free searches are available each day at no coin cost.</Bullet>
        <Bullet>Additional searches beyond the daily limit cost 1 coin each.</Bullet>
        <Bullet>Coins purchased are non-refundable unless required by applicable law.</Bullet>
        <Bullet>We reserve the right to adjust coin prices and free search limits with notice.</Bullet>
      </Section>

      <Section title="Data Accuracy">
        <Para>
          Search results depend entirely on data uploaded by our users. We make no guarantees about the completeness or accuracy of results. A person may be saved in more contacts than shown, or in none at all.
        </Para>
      </Section>

      <Section title="Account Termination">
        <Para>
          We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time from your profile page, which will permanently remove all your data from our system.
        </Para>
      </Section>

      <Section title="Limitation of Liability">
        <Para>
          The app is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the app or reliance on its results.
        </Para>
      </Section>

      <Section title="Last Updated">
        <Para>March 2026</Para>
      </Section>
    </>
  );
}

function AboutContent() {
  return (
    <>
      <Section title="Who Saved Me">
        <Para>
          Who Saved Me is a social discovery app that answers a simple question: who has my number saved in their contacts?
        </Para>
        <Para style={{ marginTop: 8 }}>
          By sharing your own contact list, you gain the ability to search the shared network and see how others have saved your number — the name they know you by, and the label they assigned.
        </Para>
      </Section>

      <Section title="How It Works">
        <Bullet>Create an account with your phone number and verify via OTP.</Bullet>
        <Bullet>Upload your contacts once to join the network.</Bullet>
        <Bullet>Search any phone number to see who has it saved and under what name.</Bullet>
        <Bullet>5 free searches per day — additional searches use coins.</Bullet>
      </Section>

      <Section title="Your Privacy">
        <Para>
          You are always in control. You can remove your number from search results at any time from this profile page, or delete your account entirely. Removed numbers are permanently blocked from re-appearing even if others re-upload their contacts.
        </Para>
      </Section>

      <Section title="Version">
        <Para>1.0.0</Para>
      </Section>

      <Section title="Support">
        <Para>
          For questions, support, or data requests, please reach out through the app store listing or contact the developer directly.
        </Para>
      </Section>
    </>
  );
}

export default function LegalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: LegalType }>();
  const { t } = useLanguage();

  const legalType: LegalType = (type === "privacy" || type === "terms" || type === "about") ? type : "about";
  const TITLES: Record<LegalType, string> = {
    privacy: t.privacyPolicyTitle,
    terms: t.termsTitle,
    about: t.aboutTitle,
  };
  const title = TITLES[legalType];

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
        },
      ]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
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
          {legalType === "privacy" && <PrivacyContent />}
          {legalType === "terms" && <TermsContent />}
          {legalType === "about" && <AboutContent />}
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
