import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { contacts, profiles, type InsertContact, type InsertProfile, type Profile } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

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
): Promise<Array<{ storedName: string; label: string; uploaderPhone: string }>> {
  const normalized = normalizePhone(phoneNumber);
  const variants = getPhoneVariants(normalized);

  const results: Array<{ storedName: string; label: string; uploaderPhone: string }> = [];
  const seen = new Set<string>();

  for (const variant of variants) {
    const rows = await db
      .select({
        storedName: contacts.storedName,
        label: contacts.label,
        uploaderPhone: contacts.uploaderPhone,
      })
      .from(contacts)
      .where(eq(contacts.storedNumber, variant));

    for (const row of rows) {
      const key = `${row.uploaderPhone}__${row.storedName}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          storedName: row.storedName,
          label: row.label ?? "mobile",
          uploaderPhone: row.uploaderPhone,
        });
      }
    }
  }

  return results;
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
