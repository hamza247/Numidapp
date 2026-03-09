import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    uploaderPhone: varchar("uploader_phone", { length: 20 }).notNull(),
    storedNumber: varchar("stored_number", { length: 20 }).notNull(),
    storedName: varchar("stored_name", { length: 255 }).notNull(),
    label: varchar("label", { length: 100 }).default("mobile"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_stored_number").on(table.storedNumber),
    unique("idx_uploader_stored").on(table.uploaderPhone, table.storedNumber),
  ]
);

export const insertContactSchema = createInsertSchema(contacts).pick({
  uploaderPhone: true,
  storedNumber: true,
  storedName: true,
  label: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  countryCode: varchar("country_code", { length: 5 }).notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).pick({
  fullName: true,
  phone: true,
  countryCode: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

export const removedNumbers = pgTable("removed_numbers", {
  phone: varchar("phone", { length: 20 }).primaryKey(),
  removedAt: timestamp("removed_at").defaultNow(),
});

export type RemovedNumber = typeof removedNumbers.$inferSelect;

export const phoneVerifications = pgTable("phone_verifications", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
