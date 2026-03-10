import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useLanguage } from "@/lib/i18n";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

export default function ContactScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { t, fonts, isRTL } = useLanguage();

  const rowDir = isRTL ? "row-reverse" : ("row" as const);
  const textAlign = isRTL ? "right" : ("left" as const);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim() || !message.trim()) return;
    setSending(true);
    try {
      const base = getApiUrl();
      const res = await fetch(new URL("/api/contact", base).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderEmail: email.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setSent(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", t.contactFailed);
      }
    } catch {
      Alert.alert("Error", t.contactFailed);
    } finally {
      setSending(false);
    }
  }

  const canSend = email.trim().length > 0 && message.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        entering={FadeIn.duration(250)}
        style={[styles.header, { paddingTop: insets.top + 12 + webTop, flexDirection: rowDir }]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={22}
            color={theme.text}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: fonts.bold }]}>
          {t.contactUs}
        </Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 40 + webBottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {sent ? (
            <Animated.View entering={FadeInDown.duration(400)} style={[styles.successCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.successIconWrap, { backgroundColor: theme.tint + "20" }]}>
                <Ionicons name="checkmark-circle" size={40} color={theme.tint} />
              </View>
              <Text style={[styles.successTitle, { color: theme.text, fontFamily: fonts.bold, textAlign }]}>
                {t.contactSent}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.backToProfileBtn, { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 }]}
                onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
              >
                <Text style={[styles.backToProfileText, { fontFamily: fonts.semiBold }]}>
                  {isRTL ? "العودة" : "Go back"}
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.delay(60).duration(400)}>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted, fontFamily: fonts.medium, textAlign }]}>
                      {t.contactEmail}
                    </Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, fontFamily: fonts.regular, textAlign }]}
                      placeholder="you@example.com"
                      placeholderTextColor={theme.textMuted}
                      value={email}
                      onChangeText={(v) => setEmail(v)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!sending}
                    />
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted, fontFamily: fonts.medium, textAlign }]}>
                      {t.contactMessage}
                    </Text>
                    <TextInput
                      style={[styles.textArea, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, fontFamily: fonts.regular, textAlign }]}
                      placeholder={isRTL ? "اكتب رسالتك هنا..." : "Write your message here..."}
                      placeholderTextColor={theme.textMuted}
                      value={message}
                      onChangeText={(v) => setMessage(v)}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      editable={!sending}
                    />
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(120).duration(400)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.sendBtn,
                    {
                      backgroundColor: canSend ? theme.tint : theme.card,
                      borderColor: canSend ? theme.tint : theme.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  onPress={handleSend}
                  disabled={sending || !canSend}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={canSend ? "#000" : theme.textMuted} />
                  ) : (
                    <View style={[styles.sendBtnInner, { flexDirection: rowDir }]}>
                      <Ionicons
                        name="send"
                        size={18}
                        color={canSend ? "#000" : theme.textMuted}
                      />
                      <Text style={[styles.sendBtnText, { color: canSend ? "#000" : theme.textMuted, fontFamily: fonts.semiBold }]}>
                        {t.contactSend}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    textAlign: "center",
  },
  headerSpacer: { width: 40 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  fieldWrap: {
    padding: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 130,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  sendBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  sendBtnInner: {
    alignItems: "center",
    gap: 8,
  },
  sendBtnText: {
    fontSize: 16,
  },
  successCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 32,
    alignItems: "center",
    gap: 16,
    marginTop: 40,
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  backToProfileBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backToProfileText: {
    fontSize: 15,
    color: "#000",
  },
});
