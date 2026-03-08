import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { contacts, profiles, phoneVerifications, type InsertContact, type InsertProfile, type Profile } from "../shared/schema";
import { eq, sql, and, gt } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export async function upsertContacts(items: InsertContact[]): Promise<number> {
  if (items.length === 0) return 0;

  const seen = new Map<string, InsertContact>();
  for (const item of items) {
    const key = `${item.uploaderPhone}__${item.storedNumber}`;
    seen.set(key, item);
  }
  const deduped = Array.from(seen.values());

  const batchSize = 100;

  for (let i = 0; i < deduped.length; i += batchSize) {
    const batch = deduped.slice(i, i + batchSize);
    await db
      .insert(contacts)
      .values(batch)
      .onConflictDoUpdate({
        target: [contacts.uploaderPhone, contacts.storedNumber],
        set: {
          storedName: sql`excluded.stored_name`,
          label: sql`excluded.label`,
          updatedAt: sql`NOW()`,
        },
      });
  }

  return deduped.length;
}

export async function searchNumber(
  phoneNumber: string
): Promise<Array<{ storedName: string; label: string; uploaderName: string }>> {
  const normalized = normalizePhone(phoneNumber);
  const variants = getPhoneVariants(normalized);

  const results: Array<{ storedName: string; label: string; uploaderName: string }> = [];
  const seen = new Set<string>();

  for (const variant of variants) {
    const rows = await db
      .select({
        storedName: contacts.storedName,
        label: contacts.label,
        uploaderPhone: contacts.uploaderPhone,
        uploaderName: profiles.fullName,
      })
      .from(contacts)
      .leftJoin(profiles, eq(contacts.uploaderPhone, profiles.phone))
      .where(eq(contacts.storedNumber, variant));

    for (const row of rows) {
      const key = `${row.uploaderPhone}__${row.storedName}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          storedName: row.storedName,
          label: row.label ?? "mobile",
          uploaderName: row.uploaderName ?? "Unknown User",
        });
      }
    }
  }

  return results;
}

export async function createOrReplaceOtp(phone: string): Promise<string> {
  const code = "112233";
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.delete(phoneVerifications).where(eq(phoneVerifications.phone, phone));
  await db.insert(phoneVerifications).values({ phone, code, expiresAt });

  return code;
}

export async function verifyOtp(phone: string, code: string): Promise<{ success: boolean; reason?: string }> {
  const [row] = await db
    .select()
    .from(phoneVerifications)
    .where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.verified, false)));

  if (!row) return { success: false, reason: "No pending verification found. Please request a new code." };
  if (new Date() > row.expiresAt) return { success: false, reason: "Code has expired. Please request a new one." };
  if (row.attempts >= 5) return { success: false, reason: "Too many attempts. Please request a new code." };

  await db
    .update(phoneVerifications)
    .set({ attempts: row.attempts + 1 })
    .where(eq(phoneVerifications.id, row.id));

  if (row.code !== code) return { success: false, reason: "Incorrect code. Please try again." };

  await db
    .update(phoneVerifications)
    .set({ verified: true })
    .where(eq(phoneVerifications.id, row.id));

  return { success: true };
}

export async function isPhoneVerified(phone: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(phoneVerifications)
    .where(and(eq(phoneVerifications.phone, phone), eq(phoneVerifications.verified, true)));
  return !!row;
}

export async function createProfile(data: InsertProfile): Promise<Profile> {
  const [profile] = await db.insert(profiles).values(data).returning();
  return profile;
}

export async function getProfileByPhone(phone: string): Promise<Profile | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.phone, phone));
  return profile ?? null;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function getPhoneVariants(digits: string): string[] {
  const variants = new Set<string>();
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
