import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, index, unique } from "drizzle-orm/pg-core";
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
