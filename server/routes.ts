import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import nodemailer from "nodemailer";
import { pool, upsertContacts, searchNumber, createProfile, createProfileWithPassword, loginWithPassword, setProfilePassword, getProfileByPhone, deleteProfile, removePhoneFromContacts, createOrReplaceOtp, verifyOtp, isPhoneVerified, getCoins, updateCoins, setCoinsExact } from "./storage";
import { z } from "zod";

async function sendSmsOtp(to: string, code: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.log(`[DEV] OTP for ${to}: ${code}`);
    return true;
  }

  const e164 = to.startsWith("+") ? to : `+${to}`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: e164,
          From: from,
          Body: `Your Who Saved Me verification code is: ${code}. Valid for 10 minutes.`,
        }).toString(),
      }
    );
    return res.ok;
  } catch (err) {
    console.error("Twilio SMS error:", err);
    return false;
  }
}

const uploadSchema = z.object({
  uploaderPhone: z.string().min(7).max(20),
  contacts: z.array(
    z.object({
      storedNumber: z.string().min(3).max(20),
      storedName: z.string().min(1).max(255),
      label: z.string().max(100).default("mobile"),
    })
  ).max(50000),
});

const searchSchema = z.object({
  phone: z.string().min(5).max(20),
});


const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long")
    .regex(/^[a-zA-Z\s\-'.\u00C0-\u024F\u0600-\u06FF\u0400-\u04FF]+$/, "Name contains invalid characters"),
  phone: z.string().min(7, "Phone number is too short").max(20, "Phone number is too long"),
  countryCode: z.string().min(1).max(5),
});


const sendOtpSchema = z.object({
  phone: z.string().min(7).max(20),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(7).max(20),
  code: z.string().length(6).regex(/^\d{6}$/),
});

const registerSchema = z.object({
  phone: z.string().min(7).max(20),
  fullName: z.string().min(2).max(100).regex(/^[a-zA-Z\s\-'.\u00C0-\u024F\u0600-\u06FF\u0400-\u04FF]+$/),
  countryCode: z.string().min(1).max(5),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

const loginSchema = z.object({
  phone: z.string().min(7).max(20),
  password: z.string().min(1).max(100),
});

export async function registerRoutes(app: Express): Promise<Server> {
  await pool.query("CREATE TABLE IF NOT EXISTS app_settings (key VARCHAR(255) PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT NOW())");

  app.use("/api", async (req: Request, res: Response, next) => {
    if (req.path === "/app-settings") return next();
    try {
      const result = await pool.query("SELECT value FROM app_settings WHERE key = 'maintenance_mode'");
      if (result.rows.length > 0 && result.rows[0].value === '1') {
        return res.status(503).json({ error: "App is under maintenance. Please try again later." });
      }
    } catch {}
    next();
  });

  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    const { phone } = parsed.data;

    try {
      const code = await createOrReplaceOtp(phone);
      const sent = await sendSmsOtp(phone, code);
      if (!sent) {
        return res.status(500).json({ error: "Failed to send SMS. Please try again." });
      }
      return res.json({ success: true });
    } catch (err) {
      console.error("send-otp error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }
    const { phone, code } = parsed.data;

    try {
      const result = await verifyOtp(phone, code);
      if (!result.success) {
        return res.status(400).json({ error: result.reason });
      }
      return res.json({ success: true });
    } catch (err) {
      console.error("verify-otp error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
    }
    const { phone, fullName, countryCode, password } = parsed.data;

    try {
      const verified = await isPhoneVerified(phone);
      if (!verified) {
        return res.status(403).json({ error: "Phone number not verified. Please complete OTP verification first." });
      }

      const existing = await getProfileByPhone(phone);
      if (existing) {
        if (existing.passwordHash) {
          return res.status(409).json({ error: "An account with this phone number already exists. Please log in instead." });
        }
        const profile = await setProfilePassword(phone, password);
        return res.json({ profile: { fullName: profile.fullName, phone: profile.phone, countryCode: profile.countryCode } });
      }

      const profile = await createProfileWithPassword({ fullName, phone, countryCode }, password);
      return res.json({ profile: { fullName: profile.fullName, phone: profile.phone, countryCode: profile.countryCode } });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }
    const { phone, password } = parsed.data;

    try {
      const result = await loginWithPassword(phone, password);
      if (!result.success || !result.profile) {
        return res.status(401).json({ error: result.reason || "Login failed" });
      }
      const p = result.profile;
      return res.json({ profile: { fullName: p.fullName, phone: p.phone, countryCode: p.countryCode } });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/profile", async (req: Request, res: Response) => {
    const phone = req.query.phone as string;
    if (!phone || phone.length < 7) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    try {
      await deleteProfile(phone);
      return res.json({ success: true });
    } catch (err) {
      console.error("Delete profile error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/contacts/number/status", async (req: Request, res: Response) => {
    const phone = req.query.phone as string;
    if (!phone || phone.length < 7) return res.status(400).json({ error: "Invalid phone" });
    try {
      const normalized = phone.replace(/\D/g, "");
      const result = await pool.query("SELECT 1 FROM removed_numbers WHERE phone = $1 LIMIT 1", [normalized]);
      return res.json({ removed: result.rows.length > 0 });
    } catch (err) {
      return res.json({ removed: false });
    }
  });

  app.delete("/api/contacts/number", async (req: Request, res: Response) => {
    const phone = req.query.phone as string;
    if (!phone || phone.length < 7) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    try {
      const removed = await removePhoneFromContacts(phone);
      return res.json({ success: true, removed });
    } catch (err) {
      console.error("Remove phone error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/profile", async (req: Request, res: Response) => {
    try {
      const parsed = profileSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.flatten();
        return res.status(400).json({ error: "Invalid profile data", details: errors.fieldErrors });
      }

      const { fullName, phone, countryCode } = parsed.data;
      const profile = await createProfile({ fullName, phone, countryCode });
      return res.json({ profile });
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({ error: "A profile with this phone number already exists" });
      }
      console.error("Profile creation error:", err);
      return res.status(500).json({ error: "Server error creating profile" });
    }
  });

  app.get("/api/profile", async (req: Request, res: Response) => {
    const phone = req.query.phone as string;
    if (!phone || phone.length < 7) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    const profile = await getProfileByPhone(phone);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.json({ profile });
  });

  app.put("/api/profile/avatar", async (req: Request, res: Response) => {
    const { phone, avatarBase64 } = req.body;
    if (!phone || phone.length < 7) return res.status(400).json({ error: "Invalid phone" });
    try {
      await pool.query(
        "UPDATE profiles SET avatar_base64 = $1 WHERE phone = $2",
        [avatarBase64 || null, phone.replace(/\D/g, "")]
      );
      return res.json({ ok: true });
    } catch (err) {
      console.error("Avatar update error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/contacts/upload", async (req: Request, res: Response) => {
    try {
      const parsed = uploadSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("Upload validation error:", JSON.stringify(parsed.error.flatten()));
        return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      }

      const { uploaderPhone, contacts } = parsed.data;
      console.log(`Uploading ${contacts.length} contacts from ${uploaderPhone}`);

      const items = contacts.map((c) => ({
        uploaderPhone,
        storedNumber: c.storedNumber.replace(/\D/g, ""),
        storedName: c.storedName,
        label: c.label,
      })).filter((c) => c.storedNumber.length >= 5);

      const count = await upsertContacts(items);
      console.log(`Successfully uploaded ${count} contacts`);
      return res.json({ uploaded: count });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Server error during upload" });
    }
  });

  app.get("/api/contacts/search", async (req: Request, res: Response) => {
    const parsed = searchSchema.safeParse({ phone: req.query.phone });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const results = await searchNumber(parsed.data.phone);
    const mapped = results.map((r) => ({
      storedName: r.storedName,
      label: r.label,
      uploaderName: r.uploaderName,
    }));
    return res.json({ results: mapped, count: mapped.length });
  });

  app.get("/api/coins", async (req: Request, res: Response) => {
    const phone = req.query.phone as string;
    if (!phone || phone.length < 7) return res.status(400).json({ error: "Invalid phone" });
    try {
      const coins = await getCoins(phone);
      return res.json({ coins });
    } catch (err) {
      console.error("Get coins error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/coins/update", async (req: Request, res: Response) => {
    const { phone, delta } = req.body;
    if (!phone || typeof delta !== "number") return res.status(400).json({ error: "Invalid request" });
    try {
      const coins = await updateCoins(phone, delta);
      return res.json({ coins });
    } catch (err) {
      console.error("Update coins error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/app-settings", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT key, value FROM app_settings WHERE key IN ('maintenance_mode', 'ads_enabled', 'ad_provider', 'custom_banner_url', 'custom_banner_link', 'ad_frequency', 'rewarded_coin_amount', 'stripe_enabled', 'stripe_mode', 'stripe_currency', 'stripe_coin_price', 'stripe_coin_amount')");
      const settings: Record<string, string> = {};
      for (const row of result.rows) {
        settings[row.key] = row.value;
      }
      return res.json(settings);
    } catch (err) {
      console.error("App settings error:", err);
      return res.json({});
    }
  });

  app.post("/api/coins/set", async (req: Request, res: Response) => {
    const { phone, amount } = req.body;
    if (!phone || typeof amount !== "number") return res.status(400).json({ error: "Invalid request" });
    try {
      const coins = await setCoinsExact(phone, amount);
      return res.json({ coins });
    } catch (err) {
      console.error("Set coins error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/contact", async (req: Request, res: Response) => {
    const { senderEmail, message } = req.body;
    if (!senderEmail || !message || typeof senderEmail !== "string" || typeof message !== "string") {
      return res.status(400).json({ error: "senderEmail and message are required" });
    }
    if (message.trim().length < 5) {
      return res.status(400).json({ error: "Message too short" });
    }

    try {
      await pool.query(
        "INSERT INTO contact_messages (sender_email, message) VALUES ($1, $2)",
        [senderEmail.trim(), message.trim()]
      );
    } catch (err) {
      console.error("Failed to store contact message:", err);
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const toEmail = "hamzamassaoui@gmail.com";

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: smtpUser, pass: smtpPass },
        });
        await transporter.sendMail({
          from: `"Who Saved Me" <${smtpUser}>`,
          to: toEmail,
          subject: `Contact message from ${senderEmail}`,
          text: `From: ${senderEmail}\n\n${message}`,
          html: `<p><strong>From:</strong> ${senderEmail}</p><p>${message.replace(/\n/g, "<br>")}</p>`,
        });
        console.log(`[contact] Email sent from ${senderEmail}`);
      } catch (err) {
        console.error("[contact] Email send failed:", err);
      }
    } else {
      console.log(`[contact] No SMTP config — message stored in DB. From: ${senderEmail}\n${message}`);
    }

    return res.json({ ok: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
