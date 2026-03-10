// server/index.ts
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

// server/routes.ts
import { createServer } from "node:http";
import nodemailer from "nodemailer";
import Stripe from "stripe";

// server/storage.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    uploaderPhone: varchar("uploader_phone", { length: 20 }).notNull(),
    storedNumber: varchar("stored_number", { length: 20 }).notNull(),
    storedName: varchar("stored_name", { length: 255 }).notNull(),
    label: varchar("label", { length: 100 }).default("mobile"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
  },
  (table) => [
    index("idx_stored_number").on(table.storedNumber),
    unique("idx_uploader_stored").on(table.uploaderPhone, table.storedNumber)
  ]
);
var insertContactSchema = createInsertSchema(contacts).pick({
  uploaderPhone: true,
  storedNumber: true,
  storedName: true,
  label: true
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  countryCode: varchar("country_code", { length: 5 }).notNull(),
  passwordHash: text("password_hash"),
  coins: integer("coins").notNull().default(5),
  avatarBase64: text("avatar_base64"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertProfileSchema = createInsertSchema(profiles).pick({
  fullName: true,
  phone: true,
  countryCode: true
});
var removedNumbers = pgTable("removed_numbers", {
  phone: varchar("phone", { length: 20 }).primaryKey(),
  removedAt: timestamp("removed_at").defaultNow()
});
var phoneVerifications = pgTable("phone_verifications", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// server/storage.ts
import { eq, sql as sql2, and, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool);
async function upsertContacts(items) {
  if (items.length === 0) return 0;
  const seen = /* @__PURE__ */ new Map();
  for (const item of items) {
    const key = `${item.uploaderPhone}__${item.storedNumber}`;
    seen.set(key, item);
  }
  let deduped = Array.from(seen.values());
  const allNumbers = [...new Set(deduped.map((i) => i.storedNumber))];
  const batchSize = 500;
  const blockedSet = /* @__PURE__ */ new Set();
  for (let i = 0; i < allNumbers.length; i += batchSize) {
    const chunk = allNumbers.slice(i, i + batchSize);
    const blocked = await db.select({ phone: removedNumbers.phone }).from(removedNumbers).where(inArray(removedNumbers.phone, chunk));
    blocked.forEach((r) => blockedSet.add(r.phone));
  }
  deduped = deduped.filter((item) => !blockedSet.has(item.storedNumber));
  if (deduped.length === 0) return 0;
  const insertBatch = 100;
  for (let i = 0; i < deduped.length; i += insertBatch) {
    const batch = deduped.slice(i, i + insertBatch);
    await db.insert(contacts).values(batch).onConflictDoUpdate({
      target: [contacts.uploaderPhone, contacts.storedNumber],
      set: {
        storedName: sql2`excluded.stored_name`,
        label: sql2`excluded.label`,
        updatedAt: sql2`NOW()`
      }
    });
  }
  return deduped.length;
}
async function searchNumber(phoneNumber) {
  const normalized = normalizePhone(phoneNumber);
  const variants = getPhoneVariants(normalized);
  const results = [];
  const seen = /* @__PURE__ */ new Set();
  const blockedRow = await db.select({ phone: removedNumbers.phone }).from(removedNumbers).where(inArray(removedNumbers.phone, variants));
  if (blockedRow.length > 0) return [];
  for (const variant of variants) {
    const rows = await db.select({
      storedName: contacts.storedName,
      label: contacts.label,
      uploaderPhone: contacts.uploaderPhone,
      uploaderName: profiles.fullName
    }).from(contacts).leftJoin(profiles, eq(contacts.uploaderPhone, profiles.phone)).where(eq(contacts.storedNumber, variant));
    for (const row of rows) {
      const key = `${row.uploaderPhone}__${row.storedName}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          storedName: row.storedName,
          label: row.label ?? "mobile",
          uploaderName: row.uploaderName ?? "Unknown User"
        });
      }
    }
  }
  return results;
}
async function createOrReplaceOtp(phone) {
  const code = "112233";
  const expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
  await db.delete(phoneVerifications).where(eq(phoneVerifications.phone, phone));
  await db.insert(phoneVerifications).values({ phone, code, expiresAt });
  return code;
}
async function verifyOtp(phone, code) {
  const [row] = await db.select().from(phoneVerifications).where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.verified, false)));
  if (!row) return { success: false, reason: "No pending verification found. Please request a new code." };
  if (/* @__PURE__ */ new Date() > row.expiresAt) return { success: false, reason: "Code has expired. Please request a new one." };
  if (row.attempts >= 5) return { success: false, reason: "Too many attempts. Please request a new code." };
  await db.update(phoneVerifications).set({ attempts: row.attempts + 1 }).where(eq(phoneVerifications.id, row.id));
  if (row.code !== code) return { success: false, reason: "Incorrect code. Please try again." };
  await db.update(phoneVerifications).set({ verified: true }).where(eq(phoneVerifications.id, row.id));
  return { success: true };
}
async function isPhoneVerified(phone) {
  const [row] = await db.select().from(phoneVerifications).where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.verified, true)));
  return !!row;
}
async function createProfile(data, initialCoins) {
  const extra = initialCoins !== void 0 ? { coins: initialCoins } : {};
  const [profile] = await db.insert(profiles).values({ ...data, ...extra }).returning();
  return profile;
}
async function createProfileWithPassword(data, password, initialCoins) {
  const passwordHash = await bcrypt.hash(password, 10);
  const extra = initialCoins !== void 0 ? { coins: initialCoins } : {};
  const [profile] = await db.insert(profiles).values({ ...data, passwordHash, ...extra }).returning();
  return profile;
}
async function loginWithPassword(phone, password) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.phone, phone));
  if (!profile) {
    return { success: false, reason: "No account found with this phone number." };
  }
  if (!profile.passwordHash) {
    return { success: false, reason: "This account does not have a password set." };
  }
  const match = await bcrypt.compare(password, profile.passwordHash);
  if (!match) {
    return { success: false, reason: "Incorrect password. Please try again." };
  }
  return { success: true, profile };
}
async function getProfileByPhone(phone) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.phone, phone));
  return profile ?? null;
}
async function getCoins(phone) {
  const [row] = await db.select({ coins: profiles.coins }).from(profiles).where(eq(profiles.phone, phone));
  return row?.coins ?? 5;
}
async function updateCoins(phone, delta) {
  const [row] = await db.update(profiles).set({ coins: sql2`GREATEST(0, coins + ${delta})` }).where(eq(profiles.phone, phone)).returning({ coins: profiles.coins });
  return row?.coins ?? 0;
}
async function setCoinsExact(phone, amount) {
  const [row] = await db.update(profiles).set({ coins: Math.max(0, amount) }).where(eq(profiles.phone, phone)).returning({ coins: profiles.coins });
  return row?.coins ?? 0;
}
async function setProfilePassword(phone, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [profile] = await db.update(profiles).set({ passwordHash }).where(eq(profiles.phone, phone)).returning();
  return profile;
}
async function deleteProfile(phone) {
  await db.delete(contacts).where(eq(contacts.uploaderPhone, phone));
  await db.delete(profiles).where(eq(profiles.phone, phone));
  await db.delete(phoneVerifications).where(eq(phoneVerifications.phone, phone));
}
async function removePhoneFromContacts(phone) {
  const normalized = phone.replace(/\D/g, "");
  await db.insert(removedNumbers).values({ phone: normalized }).onConflictDoNothing();
  const result = await db.delete(contacts).where(eq(contacts.storedNumber, normalized));
  return result.rowCount ?? 0;
}
function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}
function getPhoneVariants(digits) {
  const variants = /* @__PURE__ */ new Set();
  variants.add(digits);
  if (digits.startsWith("1") && digits.length === 11) {
    variants.add(digits.slice(1));
  }
  if (digits.length === 10) {
    variants.add("1" + digits);
  }
  if (!digits.startsWith("+")) {
    variants.add("+" + digits);
  }
  if (digits.startsWith("1")) {
    variants.add("+" + digits);
  }
  return Array.from(variants);
}

// server/routes.ts
import { z } from "zod";
async function getStripeSettings() {
  const result = await pool.query(
    `SELECT key, value FROM app_settings WHERE key IN (
      'stripe_enabled','stripe_mode','stripe_sk_test','stripe_sk_live',
      'stripe_currency','stripe_webhook_secret',
      'stripe_product_name','stripe_product_desc','stripe_product_image',
      'stripe_checkout_message','stripe_locale',
      'stripe_allow_promo_codes','stripe_collect_billing'
    )`
  );
  const s = {};
  for (const row of result.rows) s[row.key] = row.value;
  return s;
}
function buildStripeClient(settings) {
  if (settings.stripe_enabled !== "1") return null;
  const key = settings.stripe_mode === "live" ? settings.stripe_sk_live : settings.stripe_sk_test;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" });
}
var PAYMENT_SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Payment Successful</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#080C14;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#0F1623;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:40px 32px;max-width:380px;width:100%;text-align:center}
    .icon{width:72px;height:72px;background:rgba(0,201,212,0.12);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
    .icon svg{width:36px;height:36px}
    h1{font-size:22px;font-weight:700;margin-bottom:10px}
    p{font-size:14px;color:#8892a4;line-height:1.6;margin-bottom:24px}
    .badge{display:inline-block;background:rgba(196,154,42,0.15);border:1px solid rgba(196,154,42,0.3);color:#C49A2A;border-radius:20px;padding:6px 16px;font-size:13px;font-weight:600;margin-bottom:24px}
    .close-btn{background:#00C9D4;color:#000;border:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:600;cursor:pointer;width:100%}
    .close-btn:hover{background:#00b5bf}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="#00C9D4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
    <h1>Payment Successful!</h1>
    <p>Your coins have been added to your account. You can close this page and return to the app.</p>
    <div class="badge">\u{1F48E} Coins credited</div>
    <button class="close-btn" onclick="window.close()">Return to App</button>
  </div>
</body>
</html>`;
var PAYMENT_CANCEL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Payment Cancelled</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#080C14;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#0F1623;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:40px 32px;max-width:380px;width:100%;text-align:center}
    .icon{width:72px;height:72px;background:rgba(239,68,68,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
    .icon svg{width:36px;height:36px}
    h1{font-size:22px;font-weight:700;margin-bottom:10px}
    p{font-size:14px;color:#8892a4;line-height:1.6;margin-bottom:24px}
    .close-btn{background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px 32px;font-size:15px;font-weight:600;cursor:pointer;width:100%}
    .close-btn:hover{background:rgba(255,255,255,0.12)}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </div>
    <h1>Payment Cancelled</h1>
    <p>No charges were made. You can close this page and try again whenever you're ready.</p>
    <button class="close-btn" onclick="window.close()">Close</button>
  </div>
</body>
</html>`;
async function sendSmsOtp(to, code) {
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
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          To: e164,
          From: from,
          Body: `Your Who Saved Me verification code is: ${code}. Valid for 10 minutes.`
        }).toString()
      }
    );
    return res.ok;
  } catch (err) {
    console.error("Twilio SMS error:", err);
    return false;
  }
}
var uploadSchema = z.object({
  uploaderPhone: z.string().min(7).max(20),
  contacts: z.array(
    z.object({
      storedNumber: z.string().min(3).max(20),
      storedName: z.string().min(1).max(255),
      label: z.string().max(100).default("mobile")
    })
  ).max(5e4)
});
var searchSchema = z.object({
  phone: z.string().min(5).max(20)
});
var profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long").regex(/^[a-zA-Z\s\-'.\u00C0-\u024F\u0600-\u06FF\u0400-\u04FF]+$/, "Name contains invalid characters"),
  phone: z.string().min(7, "Phone number is too short").max(20, "Phone number is too long"),
  countryCode: z.string().min(1).max(5)
});
var sendOtpSchema = z.object({
  phone: z.string().min(7).max(20)
});
var verifyOtpSchema = z.object({
  phone: z.string().min(7).max(20),
  code: z.string().length(6).regex(/^\d{6}$/)
});
var registerSchema = z.object({
  phone: z.string().min(7).max(20),
  fullName: z.string().min(2).max(100).regex(/^[a-zA-Z\s\-'.\u00C0-\u024F\u0600-\u06FF\u0400-\u04FF]+$/),
  countryCode: z.string().min(1).max(5),
  password: z.string().min(6, "Password must be at least 6 characters").max(100)
});
var loginSchema = z.object({
  phone: z.string().min(7).max(20),
  password: z.string().min(1).max(100)
});
async function registerRoutes(app2) {
  await pool.query("CREATE TABLE IF NOT EXISTS app_settings (key VARCHAR(255) PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT NOW())");
  app2.use("/api", async (req, res, next) => {
    if (req.path === "/app-settings") return next();
    try {
      const result = await pool.query("SELECT value FROM app_settings WHERE key = 'maintenance_mode'");
      if (result.rows.length > 0 && result.rows[0].value === "1") {
        return res.status(503).json({ error: "App is under maintenance. Please try again later." });
      }
    } catch {
    }
    next();
  });
  app2.post("/api/auth/send-otp", async (req, res) => {
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
  app2.post("/api/auth/verify-otp", async (req, res) => {
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
  app2.post("/api/auth/register", async (req, res) => {
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
        const profile2 = await setProfilePassword(phone, password);
        return res.json({ profile: { fullName: profile2.fullName, phone: profile2.phone, countryCode: profile2.countryCode } });
      }
      const icResult = await pool.query("SELECT value FROM app_settings WHERE key = 'initial_coins'");
      const initialCoins = icResult.rows.length ? parseInt(icResult.rows[0].value, 10) || 5 : 5;
      const profile = await createProfileWithPassword({ fullName, phone, countryCode }, password, initialCoins);
      return res.json({ profile: { fullName: profile.fullName, phone: profile.phone, countryCode: profile.countryCode } });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
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
  app2.delete("/api/profile", async (req, res) => {
    const phone = req.query.phone;
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
  app2.get("/api/contacts/number/status", async (req, res) => {
    const phone = req.query.phone;
    if (!phone || phone.length < 7) return res.status(400).json({ error: "Invalid phone" });
    try {
      const normalized = phone.replace(/\D/g, "");
      const result = await pool.query("SELECT 1 FROM removed_numbers WHERE phone = $1 LIMIT 1", [normalized]);
      return res.json({ removed: result.rows.length > 0 });
    } catch (err) {
      return res.json({ removed: false });
    }
  });
  app2.delete("/api/contacts/number", async (req, res) => {
    const phone = req.query.phone;
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
  app2.post("/api/profile", async (req, res) => {
    try {
      const parsed = profileSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.flatten();
        return res.status(400).json({ error: "Invalid profile data", details: errors.fieldErrors });
      }
      const { fullName, phone, countryCode } = parsed.data;
      const icResult2 = await pool.query("SELECT value FROM app_settings WHERE key = 'initial_coins'");
      const initialCoins2 = icResult2.rows.length ? parseInt(icResult2.rows[0].value, 10) || 5 : 5;
      const profile = await createProfile({ fullName, phone, countryCode }, initialCoins2);
      return res.json({ profile });
    } catch (err) {
      if (err?.code === "23505") {
        return res.status(409).json({ error: "A profile with this phone number already exists" });
      }
      console.error("Profile creation error:", err);
      return res.status(500).json({ error: "Server error creating profile" });
    }
  });
  app2.get("/api/profile", async (req, res) => {
    const phone = req.query.phone;
    if (!phone || phone.length < 7) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    const profile = await getProfileByPhone(phone);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.json({ profile });
  });
  app2.put("/api/profile/avatar", async (req, res) => {
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
  app2.post("/api/contacts/upload", async (req, res) => {
    try {
      const parsed = uploadSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("Upload validation error:", JSON.stringify(parsed.error.flatten()));
        return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      }
      const { uploaderPhone, contacts: contacts2 } = parsed.data;
      console.log(`Uploading ${contacts2.length} contacts from ${uploaderPhone}`);
      const items = contacts2.map((c) => ({
        uploaderPhone,
        storedNumber: c.storedNumber.replace(/\D/g, ""),
        storedName: c.storedName,
        label: c.label
      })).filter((c) => c.storedNumber.length >= 5);
      const count = await upsertContacts(items);
      console.log(`Successfully uploaded ${count} contacts`);
      return res.json({ uploaded: count });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Server error during upload" });
    }
  });
  app2.get("/api/contacts/search", async (req, res) => {
    const parsed = searchSchema.safeParse({ phone: req.query.phone });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    const results = await searchNumber(parsed.data.phone);
    const mapped = results.map((r) => ({
      storedName: r.storedName,
      label: r.label,
      uploaderName: r.uploaderName
    }));
    return res.json({ results: mapped, count: mapped.length });
  });
  app2.get("/api/coins", async (req, res) => {
    const phone = req.query.phone;
    if (!phone || phone.length < 7) return res.status(400).json({ error: "Invalid phone" });
    try {
      const coins = await getCoins(phone);
      return res.json({ coins });
    } catch (err) {
      console.error("Get coins error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });
  app2.post("/api/coins/update", async (req, res) => {
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
  app2.get("/api/app-settings", async (_req, res) => {
    try {
      const result = await pool.query("SELECT key, value FROM app_settings WHERE key IN ('maintenance_mode', 'ads_enabled', 'ad_provider', 'custom_banner_url', 'custom_banner_link', 'ad_frequency', 'rewarded_coin_amount', 'stripe_enabled', 'stripe_mode', 'stripe_currency', 'stripe_coin_price', 'stripe_coin_amount')");
      const settings = {};
      for (const row of result.rows) {
        settings[row.key] = row.value;
      }
      return res.json(settings);
    } catch (err) {
      console.error("App settings error:", err);
      return res.json({});
    }
  });
  app2.post("/api/coins/set", async (req, res) => {
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
  app2.post("/api/contact", async (req, res) => {
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
          auth: { user: smtpUser, pass: smtpPass }
        });
        await transporter.sendMail({
          from: `"Who Saved Me" <${smtpUser}>`,
          to: toEmail,
          subject: `Contact message from ${senderEmail}`,
          text: `From: ${senderEmail}

${message}`,
          html: `<p><strong>From:</strong> ${senderEmail}</p><p>${message.replace(/\n/g, "<br>")}</p>`
        });
        console.log(`[contact] Email sent from ${senderEmail}`);
      } catch (err) {
        console.error("[contact] Email send failed:", err);
      }
    } else {
      console.log(`[contact] No SMTP config \u2014 message stored in DB. From: ${senderEmail}
${message}`);
    }
    return res.json({ ok: true });
  });
  app2.get("/api/app-config", async (_req, res) => {
    try {
      const result = await pool.query(
        "SELECT key, value FROM app_settings WHERE key IN ('free_daily_searches','search_cost','reveal_cost','initial_coins','remove_phone_cost')"
      );
      const s = {
        freeDailySearches: 5,
        searchCost: 1,
        revealCost: 1,
        initialCoins: 5,
        removePhoneCost: 3
      };
      for (const row of result.rows) {
        const v = parseInt(row.value, 10);
        if (!isNaN(v)) {
          if (row.key === "free_daily_searches") s.freeDailySearches = v;
          if (row.key === "search_cost") s.searchCost = v;
          if (row.key === "reveal_cost") s.revealCost = v;
          if (row.key === "initial_coins") s.initialCoins = v;
          if (row.key === "remove_phone_cost") s.removePhoneCost = v;
        }
      }
      return res.json(s);
    } catch (err) {
      return res.json({ freeDailySearches: 5, searchCost: 1, revealCost: 1, initialCoins: 5, removePhoneCost: 3 });
    }
  });
  app2.post("/api/stripe/create-checkout", async (req, res) => {
    const { phone, coins, priceInCents, packageId } = req.body;
    if (!phone || !coins || !priceInCents || !packageId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const settings = await getStripeSettings();
      const stripe = buildStripeClient(settings);
      if (!stripe) {
        return res.status(503).json({ error: "Payments are not configured. Please contact support." });
      }
      const proto = req.header("x-forwarded-proto") || req.protocol || "https";
      const host = req.header("x-forwarded-host") || req.get("host");
      const baseUrl = `${proto}://${host}`;
      const currency = settings.stripe_currency || "usd";
      const coinsStr = String(coins);
      const productName = (settings.stripe_product_name || "{coins} Coins \u2014 Who Saved Me").replace("{coins}", coinsStr);
      const productDesc = (settings.stripe_product_desc || "Add {coins} coins to your Who Saved Me account instantly.").replace("{coins}", coinsStr);
      const productImage = settings.stripe_product_image?.trim();
      const checkoutMsg = settings.stripe_checkout_message?.trim();
      const locale = settings.stripe_locale || "auto";
      const allowPromo = settings.stripe_allow_promo_codes === "1";
      const collectBill = settings.stripe_collect_billing === "1";
      const sessionParams = {
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency,
            product_data: {
              name: productName,
              description: productDesc || void 0,
              ...productImage ? { images: [productImage] } : {}
            },
            unit_amount: Math.round(Number(priceInCents))
          },
          quantity: 1
        }],
        mode: "payment",
        locale,
        allow_promotion_codes: allowPromo,
        billing_address_collection: collectBill ? "required" : "auto",
        success_url: `${baseUrl}/api/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/api/payment/cancel`,
        metadata: {
          phone: String(phone),
          coins: coinsStr,
          packageId: String(packageId)
        }
      };
      if (checkoutMsg) {
        sessionParams.custom_text = {
          submit: { message: checkoutMsg.slice(0, 500) }
        };
      }
      const session = await stripe.checkout.sessions.create(sessionParams);
      return res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      console.error("Stripe checkout error:", err);
      return res.status(500).json({ error: err.message || "Failed to create checkout session" });
    }
  });
  app2.get("/api/stripe/webhook", (_req, res) => {
    res.json({ ok: true, message: "Stripe webhook endpoint is active. Send POST requests from Stripe Dashboard." });
  });
  app2.post("/api/stripe/webhook", async (req, res) => {
    try {
      const settings = await getStripeSettings();
      const stripe = buildStripeClient(settings);
      if (!stripe) return res.status(503).send("Stripe not configured");
      const webhookSecret = settings.stripe_webhook_secret;
      const rawBody = req.rawBody;
      let event;
      if (webhookSecret && rawBody) {
        const sig = req.headers["stripe-signature"];
        try {
          event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } catch (err) {
          console.error("Webhook signature error:", err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else {
        event = req.body;
      }
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const phone = session.metadata?.phone;
        const coins = parseInt(session.metadata?.coins || "0", 10);
        if (phone && coins > 0) {
          try {
            await updateCoins(phone, coins);
            console.log(`[Stripe] +${coins} coins \u2192 ${phone}`);
          } catch (err) {
            console.error("[Stripe] Failed to credit coins:", err);
          }
        }
      }
      return res.json({ received: true });
    } catch (err) {
      console.error("Stripe webhook error:", err);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.get("/api/payment/success", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(PAYMENT_SUCCESS_HTML);
  });
  app2.get("/api/payment/cancel", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(PAYMENT_CANCEL_HTML);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false, limit: "10mb" }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return serveLandingPage({ req, res, landingPageTemplate, appName });
  });
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  if (process.env.NODE_ENV !== "production") {
    app.use(
      createProxyMiddleware({
        pathFilter: "/admin",
        target: "http://localhost:8000",
        changeOrigin: true,
        on: {
          error: (_err, _req, res) => {
            res.status(503).send(
              "<h2>Admin panel is not running</h2><p>Start the Admin Panel workflow in Replit.</p>"
            );
          }
        }
      })
    );
  }
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
