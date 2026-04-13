import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import { pool, upsertContacts, searchNumber, createProfile, createProfileWithPassword, loginWithPassword, setProfilePassword, getProfileByPhone, deleteProfile, removePhoneFromContacts, createOrReplaceOtp, verifyOtp, isPhoneVerified, getCoins, updateCoins, setCoinsExact, generateReferralCode } from "./storage";
import { z } from "zod";

async function getStripeSettings(): Promise<Record<string, string>> {
  const result = await pool.query(
    `SELECT key, value FROM app_settings WHERE key IN (
      'stripe_enabled','stripe_mode','stripe_sk_test','stripe_sk_live',
      'stripe_currency','stripe_webhook_secret',
      'stripe_product_name','stripe_product_desc','stripe_product_image',
      'stripe_checkout_message','stripe_locale',
      'stripe_allow_promo_codes','stripe_collect_billing'
    )`
  );
  const s: Record<string, string> = {};
  for (const row of result.rows) s[row.key] = row.value;
  return s;
}

function buildStripeClient(settings: Record<string, string>): Stripe | null {
  if (settings.stripe_enabled !== "1") return null;
  const key = settings.stripe_mode === "live" ? settings.stripe_sk_live : settings.stripe_sk_test;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" as any });
}

const PAYMENT_SUCCESS_HTML = `<!DOCTYPE html>
<html>
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
  <script>
    var _sid=(new URLSearchParams(window.location.search)).get('session_id')||'';
    function returnToApp(){window.location.href='whosavedme://payment-complete?status=success&session_id='+encodeURIComponent(_sid);}
    setTimeout(returnToApp,1500);
    var T={en:{title:"Payment Successful!",msg:"Your coins have been added to your account. Returning to the app\\u2026",badge:"\\ud83d\\udc8e Coins credited",btn:"Return to App"},ar:{title:"\\u062a\\u0645\\u062a \\u0639\\u0645\\u0644\\u064a\\u0629 \\u0627\\u0644\\u062f\\u0641\\u0639 \\u0628\\u0646\\u062c\\u0627\\u062d!",msg:"\\u062a\\u0645\\u062a \\u0625\\u0636\\u0627\\u0641\\u0629 \\u0627\\u0644\\u0639\\u0645\\u0644\\u0627\\u062a \\u0625\\u0644\\u0649 \\u062d\\u0633\\u0627\\u0628\\u0643. \\u062c\\u0627\\u0631\\u064d \\u0627\\u0644\\u0639\\u0648\\u062f\\u0629 \\u0625\\u0644\\u0649 \\u0627\\u0644\\u062a\\u0637\\u0628\\u064a\\u0642\\u2026",badge:"\\ud83d\\udc8e \\u062a\\u0645 \\u0625\\u0636\\u0627\\u0641\\u0629 \\u0627\\u0644\\u0639\\u0645\\u0644\\u0627\\u062a",btn:"\\u0627\\u0644\\u0639\\u0648\\u062f\\u0629 \\u0625\\u0644\\u0649 \\u0627\\u0644\\u062a\\u0637\\u0628\\u064a\\u0642"},fr:{title:"Paiement r\\u00e9ussi !",msg:"Vos pi\\u00e8ces ont \\u00e9t\\u00e9 ajout\\u00e9es \\u00e0 votre compte. Retour \\u00e0 l\\u2019application\\u2026",badge:"\\ud83d\\udc8e Pi\\u00e8ces cr\\u00e9dit\\u00e9es",btn:"Retour \\u00e0 l\\u2019application"}};
    document.addEventListener("DOMContentLoaded",function(){var p=new URLSearchParams(window.location.search);var l=p.get("lang")||"en";var s=T[l]||T.en;document.getElementById("t").textContent=s.title;document.getElementById("m").textContent=s.msg;document.getElementById("b").textContent=s.badge;document.getElementById("btn").textContent=s.btn;if(l==="ar"){document.documentElement.setAttribute("dir","rtl");document.documentElement.setAttribute("lang","ar");}else if(l==="fr"){document.documentElement.setAttribute("lang","fr");}else{document.documentElement.setAttribute("lang","en");}});
  </script>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="#00C9D4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
    <h1 id="t">Payment Successful!</h1>
    <p id="m">Your coins have been added to your account. Returning to the app\u2026</p>
    <div class="badge" id="b">\ud83d\udc8e Coins credited</div>
    <button class="close-btn" id="btn" onclick="returnToApp()">Return to App</button>
  </div>
</body>
</html>`;

const PAYMENT_CANCEL_HTML = `<!DOCTYPE html>
<html>
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
  <script>
    function returnToApp(){window.location.href='whosavedme://payment-complete?status=cancel';}
    setTimeout(returnToApp,1500);
    var T={en:{title:"Payment Cancelled",msg:"No charges were made. Returning to the app\\u2026",btn:"Return to App"},ar:{title:"\\u062a\\u0645 \\u0625\\u0644\\u063a\\u0627\\u0621 \\u0627\\u0644\\u062f\\u0641\\u0639",msg:"\\u0644\\u0645 \\u064a\\u062a\\u0645 \\u062e\\u0635\\u0645 \\u0623\\u064a \\u0645\\u0628\\u0644\\u063a. \\u062c\\u0627\\u0631\\u064d \\u0627\\u0644\\u0639\\u0648\\u062f\\u0629 \\u0625\\u0644\\u0649 \\u0627\\u0644\\u062a\\u0637\\u0628\\u064a\\u0642\\u2026",btn:"\\u0627\\u0644\\u0639\\u0648\\u062f\\u0629 \\u0625\\u0644\\u0649 \\u0627\\u0644\\u062a\\u0637\\u0628\\u064a\\u0642"},fr:{title:"Paiement annul\\u00e9",msg:"Aucun frais n\\u2019a \\u00e9t\\u00e9 pr\\u00e9lev\\u00e9. Retour \\u00e0 l\\u2019application\\u2026",btn:"Retour \\u00e0 l\\u2019application"}};
    document.addEventListener("DOMContentLoaded",function(){var p=new URLSearchParams(window.location.search);var l=p.get("lang")||"en";var s=T[l]||T.en;document.getElementById("t").textContent=s.title;document.getElementById("m").textContent=s.msg;document.getElementById("btn").textContent=s.btn;if(l==="ar"){document.documentElement.setAttribute("dir","rtl");document.documentElement.setAttribute("lang","ar");}else if(l==="fr"){document.documentElement.setAttribute("lang","fr");}else{document.documentElement.setAttribute("lang","en");}});
  </script>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </div>
    <h1 id="t">Payment Cancelled</h1>
    <p id="m">No charges were made. Returning to the app\u2026</p>
    <button class="close-btn" id="btn" onclick="returnToApp()">Return to App</button>
  </div>
</body>
</html>`;

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
  referralCode: z.string().min(4).max(10).optional(),
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
    const { phone, fullName, countryCode, password, referralCode } = parsed.data;

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

      const profile = await createProfileWithPassword({ fullName, phone, countryCode }, password, 0);

      let generatedCode = generateReferralCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await pool.query("UPDATE profiles SET referral_code=$1 WHERE phone=$2", [generatedCode, phone]);
          break;
        } catch {
          generatedCode = generateReferralCode();
        }
      }

      if (referralCode) {
        try {
          const referrerResult = await pool.query(
            "SELECT phone FROM profiles WHERE UPPER(referral_code)=UPPER($1) AND phone<>$2",
            [referralCode, phone]
          );
          if (referrerResult.rows.length > 0) {
            const referrerPhone = referrerResult.rows[0].phone;
            const rewardResult = await pool.query("SELECT value FROM app_settings WHERE key='referral_reward_coins'");
            const reward = rewardResult.rows.length ? parseInt(rewardResult.rows[0].value, 10) || 7 : 7;
            await updateCoins(referrerPhone, reward);
            await pool.query("UPDATE profiles SET referred_by=$1 WHERE phone=$2", [referrerPhone, phone]);
            console.log(`[Referral] +${reward} coins → ${referrerPhone} (referred ${phone})`);
          }
        } catch (refErr) {
          console.error("[Referral] error processing referral:", refErr);
        }
      }

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
      const profile = await createProfile({ fullName, phone, countryCode }, 0);
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

      const beforeResult = await pool.query(
        "SELECT COUNT(*) FROM contacts WHERE uploader_phone = $1 AND is_valid_international = true",
        [uploaderPhone]
      );
      const beforeCount = parseInt(beforeResult.rows[0].count, 10) || 0;

      const count = await upsertContacts(items);

      const afterResult = await pool.query(
        "SELECT COUNT(*) FROM contacts WHERE uploader_phone = $1 AND is_valid_international = true",
        [uploaderPhone]
      );
      const afterCount = parseInt(afterResult.rows[0].count, 10) || 0;

      const coinsEarned = Math.floor(afterCount / 10) - Math.floor(beforeCount / 10);
      if (coinsEarned > 0) {
        await updateCoins(uploaderPhone, coinsEarned);
        console.log(`[Contacts] +${coinsEarned} coins → ${uploaderPhone} (${afterCount} total contacts)`);
      }

      console.log(`Successfully uploaded ${count} contacts`);
      return res.json({ uploaded: count, coinsEarned });
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

  const DEFAULT_COIN_PACKAGES = [
    { id: "starter",  coins: 5,   price: 0.99,  label: "",            popular: false, bestValue: false, enabled: true },
    { id: "basic",    coins: 15,  price: 1.99,  label: "save33",      popular: false, bestValue: false, enabled: true },
    { id: "popular",  coins: 40,  price: 3.99,  label: "mostPopular", popular: true,  bestValue: false, enabled: true },
    { id: "pro",      coins: 100, price: 7.99,  label: "save47",      popular: false, bestValue: false, enabled: true },
    { id: "mega",     coins: 250, price: 14.99, label: "bestValue",   popular: false, bestValue: true,  enabled: true },
  ];

  app.get("/api/coin-packages", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT value FROM app_settings WHERE key = 'coin_packages'");
      const raw = result.rows[0]?.value;
      if (!raw) return res.json(DEFAULT_COIN_PACKAGES.filter(p => p.enabled));
      const packages = JSON.parse(raw);
      return res.json(packages.filter((p: any) => p.enabled !== false));
    } catch (err) {
      console.error("Coin packages error:", err);
      return res.json(DEFAULT_COIN_PACKAGES.filter(p => p.enabled));
    }
  });

  app.get("/api/app-settings", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT key, value FROM app_settings WHERE key IN ('maintenance_mode', 'ads_enabled', 'ad_provider', 'custom_banner_url', 'custom_banner_link', 'ad_frequency', 'admob_app_id', 'admob_banner_android', 'admob_banner_ios', 'rewarded_coin_amount', 'stripe_enabled', 'stripe_mode', 'stripe_currency', 'stripe_coin_price', 'stripe_coin_amount')");
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

  app.get("/api/referral/validate/:code", async (req: Request, res: Response) => {
    const { code } = req.params;
    try {
      const result = await pool.query(
        "SELECT full_name FROM profiles WHERE UPPER(referral_code)=UPPER($1)",
        [code]
      );
      if (result.rows.length > 0) {
        return res.json({ valid: true, name: result.rows[0].full_name });
      }
      return res.json({ valid: false });
    } catch {
      return res.json({ valid: false });
    }
  });

  app.get("/api/referral/my-code", async (req: Request, res: Response) => {
    const phone = req.query.phone as string;
    if (!phone) return res.status(400).json({ error: "phone required" });
    try {
      const result = await pool.query(
        "SELECT referral_code, (SELECT COUNT(*) FROM profiles WHERE referred_by=$1) AS referral_count FROM profiles WHERE phone=$1",
        [phone]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Profile not found" });
      return res.json({
        referralCode: result.rows[0].referral_code,
        referralCount: parseInt(result.rows[0].referral_count, 10),
      });
    } catch {
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/app-config", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        "SELECT key, value FROM app_settings WHERE key IN ('free_daily_searches','search_cost','reveal_cost','initial_coins','remove_phone_cost','referral_reward_coins')"
      );
      const s: Record<string, number> = {
        freeDailySearches: 5,
        searchCost: 1,
        revealCost: 1,
        initialCoins: 5,
        removePhoneCost: 3,
        referralRewardCoins: 7,
      };
      for (const row of result.rows) {
        const v = parseInt(row.value, 10);
        if (!isNaN(v)) {
          if (row.key === "free_daily_searches") s.freeDailySearches = v;
          if (row.key === "search_cost") s.searchCost = v;
          if (row.key === "reveal_cost") s.revealCost = v;
          if (row.key === "initial_coins") s.initialCoins = v;
          if (row.key === "remove_phone_cost") s.removePhoneCost = v;
          if (row.key === "referral_reward_coins") s.referralRewardCoins = v;
        }
      }
      return res.json(s);
    } catch (err) {
      return res.json({ freeDailySearches: 5, searchCost: 1, revealCost: 1, initialCoins: 5, removePhoneCost: 3, referralRewardCoins: 7 });
    }
  });

  app.post("/api/stripe/create-checkout", async (req: Request, res: Response) => {
    const { phone, coins, priceInCents, packageId, lang } = req.body;
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
      const productName = (settings.stripe_product_name || "{coins} Coins — Who Saved Me").replace("{coins}", coinsStr);
      const productDesc = (settings.stripe_product_desc || "Add {coins} coins to your Who Saved Me account instantly.").replace("{coins}", coinsStr);
      const productImage = settings.stripe_product_image?.trim();
      const checkoutMsg  = settings.stripe_checkout_message?.trim();
      const locale       = (settings.stripe_locale || "auto") as any;
      const allowPromo   = settings.stripe_allow_promo_codes === "1";
      const collectBill  = settings.stripe_collect_billing === "1";

      const sessionParams: any = {
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency,
            product_data: {
              name: productName,
              description: productDesc || undefined,
              ...(productImage ? { images: [productImage] } : {}),
            },
            unit_amount: Math.round(Number(priceInCents)),
          },
          quantity: 1,
        }],
        mode: "payment",
        locale,
        allow_promotion_codes: allowPromo,
        billing_address_collection: collectBill ? "required" : "auto",
        success_url: `${baseUrl}/api/payment/success?session_id={CHECKOUT_SESSION_ID}&lang=${encodeURIComponent(lang || "en")}`,
        cancel_url: `${baseUrl}/api/payment/cancel?lang=${encodeURIComponent(lang || "en")}`,
        metadata: {
          phone: String(phone),
          coins: coinsStr,
          packageId: String(packageId),
        },
      };

      if (checkoutMsg) {
        sessionParams.custom_text = {
          submit: { message: checkoutMsg.slice(0, 500) },
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return res.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      return res.status(500).json({ error: err.message || "Failed to create checkout session" });
    }
  });

  app.get("/api/stripe/webhook", (_req: Request, res: Response) => {
    res.json({ ok: true, message: "Stripe webhook endpoint is active. Send POST requests from Stripe Dashboard." });
  });

  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      const settings = await getStripeSettings();
      const stripe = buildStripeClient(settings);
      if (!stripe) return res.status(503).send("Stripe not configured");

      const webhookSecret = settings.stripe_webhook_secret;
      const rawBody = (req as any).rawBody as Buffer | string | undefined;
      let event: Stripe.Event;

      if (webhookSecret && rawBody) {
        const sig = req.headers["stripe-signature"] as string;
        try {
          event = stripe.webhooks.constructEvent(rawBody as Buffer, sig, webhookSecret);
        } catch (err: any) {
          console.error("Webhook signature error:", err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else {
        event = req.body as Stripe.Event;
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const phone = session.metadata?.phone;
        const coins = parseInt(session.metadata?.coins || "0", 10);
        if (phone && coins > 0) {
          try {
            const already = await pool.query(
              "SELECT 1 FROM stripe_sessions WHERE session_id=$1",
              [session.id]
            );
            if (already.rowCount === 0) {
              await pool.query(
                "INSERT INTO stripe_sessions(session_id,phone,coins) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
                [session.id, phone, coins]
              );
              await updateCoins(phone, coins);
              console.log(`[Stripe webhook] +${coins} coins → ${phone}`);
            } else {
              console.log(`[Stripe webhook] session ${session.id} already processed, skipping`);
            }
          } catch (err) {
            console.error("[Stripe] Failed to credit coins:", err);
          }
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("Stripe webhook error:", err);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.get("/api/payment/success", async (req: Request, res: Response) => {
    const sessionId = req.query.session_id as string | undefined;
    if (sessionId) {
      try {
        const settings = await getStripeSettings();
        const stripe = buildStripeClient(settings);
        if (stripe) {
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          const phone = session.metadata?.phone;
          const coins = parseInt(session.metadata?.coins || "0", 10);
          if (phone && coins > 0 && session.payment_status === "paid") {
            const already = await pool.query(
              "SELECT 1 FROM stripe_sessions WHERE session_id=$1",
              [sessionId]
            );
            if (already.rowCount === 0) {
              await pool.query(
                "INSERT INTO stripe_sessions(session_id,phone,coins) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
                [sessionId, phone, coins]
              );
              await updateCoins(phone, coins);
              console.log(`[Stripe success] +${coins} coins → ${phone}`);
            } else {
              console.log(`[Stripe success] session ${sessionId} already processed`);
            }
          }
        }
      } catch (err) {
        console.error("[Stripe success] error crediting coins:", err);
      }
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(PAYMENT_SUCCESS_HTML);
  });

  app.post("/api/payment/claim", async (req: Request, res: Response) => {
    const { session_id, phone } = req.body as { session_id?: string; phone?: string };
    if (!session_id || !phone) {
      return res.status(400).json({ error: "Missing session_id or phone" });
    }
    try {
      const settings = await getStripeSettings();
      const stripe = buildStripeClient(settings);
      if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status !== "paid") {
        return res.status(402).json({ error: "Payment not completed", status: session.payment_status });
      }

      const sessionPhone = session.metadata?.phone;
      const coins = parseInt(session.metadata?.coins || "0", 10);

      if (!sessionPhone || sessionPhone !== phone) {
        return res.status(403).json({ error: "Phone mismatch" });
      }
      if (coins <= 0) {
        return res.status(400).json({ error: "Invalid coins in session" });
      }

      const already = await pool.query(
        "SELECT 1 FROM stripe_sessions WHERE session_id=$1",
        [session_id]
      );
      if (already.rowCount === 0) {
        await pool.query(
          "INSERT INTO stripe_sessions(session_id,phone,coins) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
          [session_id, phone, coins]
        );
        const newBalance = await updateCoins(phone, coins);
        console.log(`[Payment claim] +${coins} coins → ${phone}, balance=${newBalance}`);
        return res.json({ success: true, coinsAdded: coins, newBalance });
      } else {
        const currentCoins = await getCoins(phone);
        console.log(`[Payment claim] session ${session_id} already processed`);
        return res.json({ success: true, coinsAdded: 0, newBalance: currentCoins, alreadyProcessed: true });
      }
    } catch (err: any) {
      console.error("[Payment claim] error:", err?.message);
      return res.status(500).json({ error: err?.message || "Internal error" });
    }
  });

  app.get("/api/payment/cancel", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(PAYMENT_CANCEL_HTML);
  });

  app.get("/api/assets/logo", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT value FROM app_settings WHERE key = 'landing_logo_base64' LIMIT 1`
      );
      if (result.rows.length > 0 && result.rows[0].value) {
        const dataUri = result.rows[0].value as string;
        const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");
          res.setHeader("Content-Type", mimeType);
          res.setHeader("Cache-Control", "public, max-age=3600");
          return res.send(buffer);
        }
      }
    } catch {}
    const { createReadStream, existsSync } = await import("fs");
    const { resolve } = await import("path");
    const fallback = resolve(process.cwd(), "assets", "images", "logo.png");
    if (existsSync(fallback)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return createReadStream(fallback).pipe(res);
    }
    res.status(404).end();
  });

  app.get("/api/assets/favicon", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT value FROM app_settings WHERE key = 'landing_favicon_base64' LIMIT 1`
      );
      if (result.rows.length > 0 && result.rows[0].value) {
        const dataUri = result.rows[0].value as string;
        const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");
          res.setHeader("Content-Type", mimeType);
          res.setHeader("Cache-Control", "public, max-age=3600");
          return res.send(buffer);
        }
      }
    } catch {}
    const { createReadStream, existsSync } = await import("fs");
    const { resolve } = await import("path");
    const fallback = resolve(process.cwd(), "assets", "images", "icon.png");
    if (existsSync(fallback)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return createReadStream(fallback).pipe(res);
    }
    res.status(404).end();
  });

  const httpServer = createServer(app);
  return httpServer;
}
