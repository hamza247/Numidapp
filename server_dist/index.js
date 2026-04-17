"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/index.ts
var import_express = __toESM(require("express"));
var import_http_proxy_middleware = require("http-proxy-middleware");

// server/routes.ts
var import_node_http = require("node:http");
var import_nodemailer = __toESM(require("nodemailer"));
var import_stripe = __toESM(require("stripe"));

// server/storage.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");

// shared/schema.ts
var import_drizzle_orm = require("drizzle-orm");
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_zod = require("drizzle-zod");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  username: (0, import_pg_core.text)("username").notNull().unique(),
  password: (0, import_pg_core.text)("password").notNull()
});
var contacts = (0, import_pg_core.pgTable)(
  "contacts",
  {
    id: (0, import_pg_core.serial)("id").primaryKey(),
    uploaderPhone: (0, import_pg_core.varchar)("uploader_phone", { length: 20 }).notNull(),
    storedNumber: (0, import_pg_core.varchar)("stored_number", { length: 20 }).notNull(),
    storedName: (0, import_pg_core.varchar)("stored_name", { length: 255 }).notNull(),
    label: (0, import_pg_core.varchar)("label", { length: 100 }).default("mobile"),
    isValidInternational: (0, import_pg_core.boolean)("is_valid_international").default(false),
    createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
    updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
  },
  (table) => [
    (0, import_pg_core.index)("idx_stored_number").on(table.storedNumber),
    (0, import_pg_core.unique)("idx_uploader_stored").on(table.uploaderPhone, table.storedNumber)
  ]
);
var insertContactSchema = (0, import_drizzle_zod.createInsertSchema)(contacts).pick({
  uploaderPhone: true,
  storedNumber: true,
  storedName: true,
  label: true
});
var insertUserSchema = (0, import_drizzle_zod.createInsertSchema)(users).pick({
  username: true,
  password: true
});
var profiles = (0, import_pg_core.pgTable)("profiles", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  fullName: (0, import_pg_core.varchar)("full_name", { length: 100 }).notNull(),
  phone: (0, import_pg_core.varchar)("phone", { length: 20 }).notNull().unique(),
  countryCode: (0, import_pg_core.varchar)("country_code", { length: 5 }).notNull(),
  passwordHash: (0, import_pg_core.text)("password_hash"),
  coins: (0, import_pg_core.integer)("coins").notNull().default(5),
  avatarBase64: (0, import_pg_core.text)("avatar_base64"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var insertProfileSchema = (0, import_drizzle_zod.createInsertSchema)(profiles).pick({
  fullName: true,
  phone: true,
  countryCode: true
});
var removedNumbers = (0, import_pg_core.pgTable)("removed_numbers", {
  phone: (0, import_pg_core.varchar)("phone", { length: 20 }).primaryKey(),
  removedAt: (0, import_pg_core.timestamp)("removed_at").defaultNow()
});
var phoneVerifications = (0, import_pg_core.pgTable)("phone_verifications", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  phone: (0, import_pg_core.varchar)("phone", { length: 20 }).notNull(),
  code: (0, import_pg_core.varchar)("code", { length: 6 }).notNull(),
  expiresAt: (0, import_pg_core.timestamp)("expires_at").notNull(),
  attempts: (0, import_pg_core.integer)("attempts").default(0).notNull(),
  verified: (0, import_pg_core.boolean)("verified").default(false).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});

// server/storage.ts
var import_drizzle_orm2 = require("drizzle-orm");
var import_bcryptjs = __toESM(require("bcryptjs"));

// server/phoneUtils.ts
var DIAL_CODES_3 = /* @__PURE__ */ new Set([
  "971",
  "966",
  "965",
  "974",
  "973",
  "968",
  "964",
  "962",
  "961",
  "963",
  "967",
  "970",
  "972",
  "234",
  "233",
  "212",
  "216",
  "213",
  "218",
  "249",
  "251",
  "254",
  "255",
  "256",
  "237",
  "221",
  "225",
  "252",
  "380",
  "351",
  "353",
  "358",
  "359",
  "385",
  "381",
  "420",
  "880",
  "977",
  "852",
  "886",
  "593",
  "502",
  "504",
  "503",
  "506",
  "507"
]);
var DIAL_CODES_2 = /* @__PURE__ */ new Set([
  "44",
  "61",
  "49",
  "33",
  "91",
  "81",
  "86",
  "55",
  "52",
  "82",
  "39",
  "34",
  "20",
  "27",
  "92",
  "90",
  "62",
  "63",
  "84",
  "66",
  "60",
  "65",
  "64",
  "46",
  "47",
  "45",
  "31",
  "32",
  "41",
  "43",
  "48",
  "30",
  "40",
  "36",
  "98",
  "95",
  "94",
  "93",
  "58",
  "56",
  "57",
  "51",
  "54",
  "53"
]);
var DIAL_CODES_1 = /* @__PURE__ */ new Set(["1", "7"]);
var MIN_LOCAL_DIGITS = 6;
function isValidInternationalPhone(digits) {
  if (!digits || digits.length < MIN_LOCAL_DIGITS + 1) return false;
  if (digits.length >= 3 + MIN_LOCAL_DIGITS) {
    const prefix3 = digits.slice(0, 3);
    if (DIAL_CODES_3.has(prefix3)) {
      return digits.length - 3 >= MIN_LOCAL_DIGITS;
    }
  }
  if (digits.length >= 2 + MIN_LOCAL_DIGITS) {
    const prefix2 = digits.slice(0, 2);
    if (DIAL_CODES_2.has(prefix2)) {
      return digits.length - 2 >= MIN_LOCAL_DIGITS;
    }
  }
  if (digits.length >= 1 + MIN_LOCAL_DIGITS) {
    const prefix1 = digits.slice(0, 1);
    if (DIAL_CODES_1.has(prefix1)) {
      return digits.length - 1 >= MIN_LOCAL_DIGITS;
    }
  }
  return false;
}

// server/storage.ts
var pool = new import_pg.Pool({ connectionString: process.env.DATABASE_URL });
var db = (0, import_node_postgres.drizzle)(pool);
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
    const blocked = await db.select({ phone: removedNumbers.phone }).from(removedNumbers).where((0, import_drizzle_orm2.inArray)(removedNumbers.phone, chunk));
    blocked.forEach((r) => blockedSet.add(r.phone));
  }
  deduped = deduped.filter((item) => !blockedSet.has(item.storedNumber));
  if (deduped.length === 0) return 0;
  const insertBatch = 100;
  for (let i = 0; i < deduped.length; i += insertBatch) {
    const batch = deduped.slice(i, i + insertBatch);
    await db.insert(contacts).values(batch.map((item) => ({
      ...item,
      isValidInternational: isValidInternationalPhone(item.storedNumber)
    }))).onConflictDoUpdate({
      target: [contacts.uploaderPhone, contacts.storedNumber],
      set: {
        storedName: import_drizzle_orm2.sql`excluded.stored_name`,
        label: import_drizzle_orm2.sql`excluded.label`,
        isValidInternational: import_drizzle_orm2.sql`excluded.is_valid_international`,
        updatedAt: import_drizzle_orm2.sql`NOW()`
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
  const blockedRow = await db.select({ phone: removedNumbers.phone }).from(removedNumbers).where((0, import_drizzle_orm2.inArray)(removedNumbers.phone, variants));
  if (blockedRow.length > 0) return [];
  for (const variant of variants) {
    const rows = await db.select({
      storedName: contacts.storedName,
      label: contacts.label,
      uploaderPhone: contacts.uploaderPhone,
      uploaderName: profiles.fullName
    }).from(contacts).leftJoin(profiles, (0, import_drizzle_orm2.eq)(contacts.uploaderPhone, profiles.phone)).where((0, import_drizzle_orm2.eq)(contacts.storedNumber, variant));
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
  await db.delete(phoneVerifications).where((0, import_drizzle_orm2.eq)(phoneVerifications.phone, phone));
  await db.insert(phoneVerifications).values({ phone, code, expiresAt });
  return code;
}
async function verifyOtp(phone, code) {
  const [row] = await db.select().from(phoneVerifications).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(phoneVerifications.phone, phone), (0, import_drizzle_orm2.eq)(phoneVerifications.verified, false)));
  if (!row) return { success: false, reason: "No pending verification found. Please request a new code." };
  if (/* @__PURE__ */ new Date() > row.expiresAt) return { success: false, reason: "Code has expired. Please request a new one." };
  if (row.attempts >= 5) return { success: false, reason: "Too many attempts. Please request a new code." };
  await db.update(phoneVerifications).set({ attempts: row.attempts + 1 }).where((0, import_drizzle_orm2.eq)(phoneVerifications.id, row.id));
  if (row.code !== code) return { success: false, reason: "Incorrect code. Please try again." };
  await db.update(phoneVerifications).set({ verified: true }).where((0, import_drizzle_orm2.eq)(phoneVerifications.id, row.id));
  return { success: true };
}
async function isPhoneVerified(phone) {
  const [row] = await db.select().from(phoneVerifications).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(phoneVerifications.phone, phone), (0, import_drizzle_orm2.eq)(phoneVerifications.verified, true)));
  return !!row;
}
async function createProfile(data, initialCoins) {
  const extra = initialCoins !== void 0 ? { coins: initialCoins } : {};
  const [profile] = await db.insert(profiles).values({ ...data, ...extra }).returning();
  return profile;
}
async function createProfileWithPassword(data, password, initialCoins) {
  const passwordHash = await import_bcryptjs.default.hash(password, 10);
  const extra = initialCoins !== void 0 ? { coins: initialCoins } : {};
  const [profile] = await db.insert(profiles).values({ ...data, passwordHash, ...extra }).returning();
  return profile;
}
async function loginWithPassword(phone, password) {
  const [profile] = await db.select().from(profiles).where((0, import_drizzle_orm2.eq)(profiles.phone, phone));
  if (!profile) {
    return { success: false, reason: "No account found with this phone number." };
  }
  if (!profile.passwordHash) {
    return { success: false, reason: "This account does not have a password set." };
  }
  const match = await import_bcryptjs.default.compare(password, profile.passwordHash);
  if (!match) {
    return { success: false, reason: "Incorrect password. Please try again." };
  }
  return { success: true, profile };
}
async function getProfileByPhone(phone) {
  const [profile] = await db.select().from(profiles).where((0, import_drizzle_orm2.eq)(profiles.phone, phone));
  return profile ?? null;
}
async function getCoins(phone) {
  const [row] = await db.select({ coins: profiles.coins }).from(profiles).where((0, import_drizzle_orm2.eq)(profiles.phone, phone));
  return row?.coins ?? 5;
}
async function updateCoins(phone, delta) {
  const [row] = await db.update(profiles).set({ coins: import_drizzle_orm2.sql`GREATEST(0, coins + ${delta})` }).where((0, import_drizzle_orm2.eq)(profiles.phone, phone)).returning({ coins: profiles.coins });
  return row?.coins ?? 0;
}
async function setCoinsExact(phone, amount) {
  const [row] = await db.update(profiles).set({ coins: Math.max(0, amount) }).where((0, import_drizzle_orm2.eq)(profiles.phone, phone)).returning({ coins: profiles.coins });
  return row?.coins ?? 0;
}
async function setProfilePassword(phone, password) {
  const passwordHash = await import_bcryptjs.default.hash(password, 10);
  const [profile] = await db.update(profiles).set({ passwordHash }).where((0, import_drizzle_orm2.eq)(profiles.phone, phone)).returning();
  return profile;
}
async function deleteProfile(phone) {
  await db.delete(contacts).where((0, import_drizzle_orm2.eq)(contacts.uploaderPhone, phone));
  await db.delete(profiles).where((0, import_drizzle_orm2.eq)(profiles.phone, phone));
  await db.delete(phoneVerifications).where((0, import_drizzle_orm2.eq)(phoneVerifications.phone, phone));
}
function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
async function removePhoneFromContacts(phone) {
  const normalized = phone.replace(/\D/g, "");
  await db.insert(removedNumbers).values({ phone: normalized }).onConflictDoNothing();
  const result = await db.delete(contacts).where((0, import_drizzle_orm2.eq)(contacts.storedNumber, normalized));
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
var import_zod = require("zod");
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
  return new import_stripe.default(key, { apiVersion: "2024-12-18.acacia" });
}
var PAYMENT_SUCCESS_HTML = `<!DOCTYPE html>
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
    function returnToApp(){window.location.href='numidapp-caller://payment-complete?status=success&session_id='+encodeURIComponent(_sid);}
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
    <div class="badge" id="b">\u{1F48E} Coins credited</div>
    <button class="close-btn" id="btn" onclick="returnToApp()">Return to App</button>
  </div>
</body>
</html>`;
var PAYMENT_CANCEL_HTML = `<!DOCTYPE html>
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
    function returnToApp(){window.location.href='numidapp-caller://payment-complete?status=cancel';}
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
var uploadSchema = import_zod.z.object({
  uploaderPhone: import_zod.z.string().min(7).max(20),
  contacts: import_zod.z.array(
    import_zod.z.object({
      storedNumber: import_zod.z.string().min(3).max(20),
      storedName: import_zod.z.string().min(1).max(255),
      label: import_zod.z.string().max(100).default("mobile")
    })
  ).max(5e4)
});
var searchSchema = import_zod.z.object({
  phone: import_zod.z.string().min(5).max(20)
});
var profileSchema = import_zod.z.object({
  fullName: import_zod.z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long").regex(/^[a-zA-Z\s\-'.\u00C0-\u024F\u0600-\u06FF\u0400-\u04FF]+$/, "Name contains invalid characters"),
  phone: import_zod.z.string().min(7, "Phone number is too short").max(20, "Phone number is too long"),
  countryCode: import_zod.z.string().min(1).max(5)
});
var sendOtpSchema = import_zod.z.object({
  phone: import_zod.z.string().min(7).max(20)
});
var verifyOtpSchema = import_zod.z.object({
  phone: import_zod.z.string().min(7).max(20),
  code: import_zod.z.string().length(6).regex(/^\d{6}$/)
});
var registerSchema = import_zod.z.object({
  phone: import_zod.z.string().min(7).max(20),
  fullName: import_zod.z.string().min(2).max(100).regex(/^[a-zA-Z\s\-'.\u00C0-\u024F\u0600-\u06FF\u0400-\u04FF]+$/),
  countryCode: import_zod.z.string().min(1).max(5),
  password: import_zod.z.string().min(6, "Password must be at least 6 characters").max(100),
  referralCode: import_zod.z.string().min(4).max(10).optional()
});
var loginSchema = import_zod.z.object({
  phone: import_zod.z.string().min(7).max(20),
  password: import_zod.z.string().min(1).max(100)
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
        const profile2 = await setProfilePassword(phone, password);
        return res.json({ profile: { fullName: profile2.fullName, phone: profile2.phone, countryCode: profile2.countryCode } });
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
            console.log(`[Referral] +${reward} coins \u2192 ${referrerPhone} (referred ${phone})`);
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
      const profile = await createProfile({ fullName, phone, countryCode }, 0);
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
        console.log(`[Contacts] +${coinsEarned} coins \u2192 ${uploaderPhone} (${afterCount} total contacts)`);
      }
      console.log(`Successfully uploaded ${count} contacts`);
      return res.json({ uploaded: count, coinsEarned });
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
  app2.post("/api/coins/rewarded-ad", async (req, res) => {
    const { phone } = req.body;
    if (!phone || typeof phone !== "string" || phone.length < 7) {
      return res.status(400).json({ error: "Invalid phone" });
    }
    try {
      const result = await pool.query("SELECT value FROM app_settings WHERE key = 'rewarded_coin_amount'");
      const earned = result.rows.length ? parseInt(result.rows[0].value, 10) || 3 : 3;
      const coins = await updateCoins(phone, earned);
      return res.json({ coins, earned });
    } catch (err) {
      console.error("Rewarded ad coins error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });
  const DEFAULT_COIN_PACKAGES = [
    { id: "starter", coins: 5, price: 0.99, label: "", popular: false, bestValue: false, enabled: true },
    { id: "basic", coins: 15, price: 1.99, label: "save33", popular: false, bestValue: false, enabled: true },
    { id: "popular", coins: 40, price: 3.99, label: "mostPopular", popular: true, bestValue: false, enabled: true },
    { id: "pro", coins: 100, price: 7.99, label: "save47", popular: false, bestValue: false, enabled: true },
    { id: "mega", coins: 250, price: 14.99, label: "bestValue", popular: false, bestValue: true, enabled: true }
  ];
  app2.get("/api/coin-packages", async (_req, res) => {
    try {
      const result = await pool.query("SELECT value FROM app_settings WHERE key = 'coin_packages'");
      const raw = result.rows[0]?.value;
      if (!raw) return res.json(DEFAULT_COIN_PACKAGES.filter((p) => p.enabled));
      const packages = JSON.parse(raw);
      return res.json(packages.filter((p) => p.enabled !== false));
    } catch (err) {
      console.error("Coin packages error:", err);
      return res.json(DEFAULT_COIN_PACKAGES.filter((p) => p.enabled));
    }
  });
  app2.get("/api/app-settings", async (_req, res) => {
    try {
      const result = await pool.query("SELECT key, value FROM app_settings WHERE key IN ('maintenance_mode', 'ads_enabled', 'ad_provider', 'custom_banner_url', 'custom_banner_link', 'ad_frequency', 'admob_app_id', 'admob_banner_android', 'admob_banner_ios', 'rewarded_coin_amount', 'stripe_enabled', 'stripe_mode', 'stripe_currency', 'stripe_coin_price', 'stripe_coin_amount')");
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
        const transporter = import_nodemailer.default.createTransport({
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
  app2.get("/api/referral/validate/:code", async (req, res) => {
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
  app2.get("/api/referral/my-code", async (req, res) => {
    const phone = req.query.phone;
    if (!phone) return res.status(400).json({ error: "phone required" });
    try {
      const result = await pool.query(
        "SELECT referral_code, (SELECT COUNT(*) FROM profiles WHERE referred_by=$1) AS referral_count FROM profiles WHERE phone=$1",
        [phone]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Profile not found" });
      return res.json({
        referralCode: result.rows[0].referral_code,
        referralCount: parseInt(result.rows[0].referral_count, 10)
      });
    } catch {
      return res.status(500).json({ error: "Server error" });
    }
  });
  app2.get("/api/app-config", async (_req, res) => {
    try {
      const result = await pool.query(
        "SELECT key, value FROM app_settings WHERE key IN ('free_daily_searches','search_cost','reveal_cost','initial_coins','remove_phone_cost','referral_reward_coins')"
      );
      const s = {
        freeDailySearches: 5,
        searchCost: 1,
        revealCost: 1,
        initialCoins: 5,
        removePhoneCost: 3,
        referralRewardCoins: 7
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
  app2.post("/api/stripe/create-checkout", async (req, res) => {
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
        success_url: `${baseUrl}/api/payment/success?session_id={CHECKOUT_SESSION_ID}&lang=${encodeURIComponent(lang || "en")}`,
        cancel_url: `${baseUrl}/api/payment/cancel?lang=${encodeURIComponent(lang || "en")}`,
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
              console.log(`[Stripe webhook] +${coins} coins \u2192 ${phone}`);
            } else {
              console.log(`[Stripe webhook] session ${session.id} already processed, skipping`);
            }
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
  app2.get("/api/payment/success", async (req, res) => {
    const sessionId = req.query.session_id;
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
              console.log(`[Stripe success] +${coins} coins \u2192 ${phone}`);
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
  app2.post("/api/payment/claim", async (req, res) => {
    const { session_id, phone } = req.body;
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
        console.log(`[Payment claim] +${coins} coins \u2192 ${phone}, balance=${newBalance}`);
        return res.json({ success: true, coinsAdded: coins, newBalance });
      } else {
        const currentCoins = await getCoins(phone);
        console.log(`[Payment claim] session ${session_id} already processed`);
        return res.json({ success: true, coinsAdded: 0, newBalance: currentCoins, alreadyProcessed: true });
      }
    } catch (err) {
      console.error("[Payment claim] error:", err?.message);
      return res.status(500).json({ error: err?.message || "Internal error" });
    }
  });
  app2.get("/api/payment/cancel", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(PAYMENT_CANCEL_HTML);
  });
  app2.get("/api/assets/logo", async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT value FROM app_settings WHERE key = 'landing_logo_base64' LIMIT 1`
      );
      if (result.rows.length > 0 && result.rows[0].value) {
        const dataUri = result.rows[0].value;
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
    } catch {
    }
    const { createReadStream, existsSync: existsSync2 } = await import("fs");
    const { resolve: resolve2 } = await import("path");
    const fallback = resolve2(process.cwd(), "assets", "images", "logo.png");
    if (existsSync2(fallback)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return createReadStream(fallback).pipe(res);
    }
    res.status(404).end();
  });
  app2.get("/api/assets/favicon", async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT value FROM app_settings WHERE key = 'landing_favicon_base64' LIMIT 1`
      );
      if (result.rows.length > 0 && result.rows[0].value) {
        const dataUri = result.rows[0].value;
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
    } catch {
    }
    const { createReadStream, existsSync: existsSync2 } = await import("fs");
    const { resolve: resolve2 } = await import("path");
    const fallback = resolve2(process.cwd(), "assets", "images", "icon.png");
    if (existsSync2(fallback)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return createReadStream(fallback).pipe(res);
    }
    res.status(404).end();
  });
  const httpServer = (0, import_node_http.createServer)(app2);
  return httpServer;
}

// server/index.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var app = (0, import_express.default)();
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
    import_express.default.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(import_express.default.urlencoded({ extended: false, limit: "10mb" }));
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
async function getBrandingSettings() {
  const keys = [
    "site_title",
    "meta_description",
    "meta_keywords",
    "og_title",
    "og_description",
    "hero_title",
    "hero_subtitle",
    "ios_app_url",
    "android_app_url",
    "download_note",
    "footer_email",
    "footer_copyright",
    "footer_tagline",
    "app_name"
  ];
  try {
    const result = await pool.query(
      `SELECT key, value FROM app_settings WHERE key = ANY($1)`,
      [keys]
    );
    const settings = {};
    for (const row of result.rows) settings[row.key] = row.value;
    return settings;
  } catch {
    return {};
  }
}
async function serveLandingPage({
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
  const branding = await getBrandingSettings();
  const resolvedAppName = branding.app_name || appName;
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, resolvedAppName).replace(/\{\{SITE_TITLE\}\}/g, branding.site_title || "NUMID \u2014 Who Saved Me?").replace(/\{\{META_DESCRIPTION\}\}/g, branding.meta_description || "Discover who has your phone number saved in their contacts. NUMID lets you search any number and find out \u2014 privately and securely.").replace(/\{\{META_KEYWORDS\}\}/g, branding.meta_keywords || "who saved my number, phone number lookup, contact search, NUMID").replace(/\{\{OG_TITLE\}\}/g, branding.og_title || "NUMID \u2014 Who Saved Me?").replace(/\{\{OG_DESCRIPTION\}\}/g, branding.og_description || "Discover who has your phone number saved in their contacts.").replace(/\{\{APP_NAME\}\}/g, resolvedAppName).replace(/\{\{HERO_TITLE\}\}/g, branding.hero_title || 'Find out <span class="accent">who saved</span> your number').replace(/\{\{HERO_SUBTITLE\}\}/g, branding.hero_subtitle || "NUMID lets you search any phone number and instantly see who has it saved in their contacts \u2014 privately, securely, in seconds.").replace(/\{\{IOS_APP_URL\}\}/g, branding.ios_app_url || "#").replace(/\{\{ANDROID_APP_URL\}\}/g, branding.android_app_url || "#").replace(/\{\{DOWNLOAD_NOTE\}\}/g, branding.download_note || "Coming soon to both stores \xB7 Currently in beta").replace(/\{\{FOOTER_EMAIL\}\}/g, branding.footer_email || "hamzamassaoui@gmail.com").replace(/\{\{FOOTER_COPYRIGHT\}\}/g, branding.footer_copyright || "\xA9 2025 NUMID \xB7 Who Saved Me. All rights reserved.").replace(/\{\{FOOTER_TAGLINE\}\}/g, branding.footer_tagline || "Discover who has your phone number saved in their contacts. Fast, private, and available in English, Arabic, and French.");
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
  app2.use("/assets", import_express.default.static(path.resolve(process.cwd(), "assets")));
  app2.use(import_express.default.static(path.resolve(process.cwd(), "static-build")));
  const legalPages = {
    "/privacy": "privacy.html",
    "/terms": "terms.html",
    "/refund": "refund.html",
    "/cookies": "cookies.html",
    "/delete-account": "delete-account.html"
  };
  for (const [route, file] of Object.entries(legalPages)) {
    const filePath = path.resolve(process.cwd(), "server", "templates", file);
    const html = fs.readFileSync(filePath, "utf-8");
    app2.get(route, (_req, res) => {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
    });
  }
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
  app.use(
    (0, import_http_proxy_middleware.createProxyMiddleware)({
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
  setupBodyParsing(app);
  setupRequestLogging(app);
  app.get("/app-ads.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send("google.com, pub-9253457742224170, DIRECT, f08c47fec0942fa0\n");
  });
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
