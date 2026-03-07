import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { upsertContacts, searchNumber } from "./storage";
import { z } from "zod";

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

const revealSchema = z.object({
  uploaderPhone: z.string().min(7).max(20),
});

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  const last4 = digits.slice(-4);
  const masked = digits.slice(0, -4).replace(/./g, "*");
  return masked + last4;
}

export async function registerRoutes(app: Express): Promise<Server> {
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
    const masked = results.map((r) => ({
      storedName: r.storedName,
      label: r.label,
      uploaderPhone: maskPhone(r.uploaderPhone),
      uploaderId: Buffer.from(r.uploaderPhone).toString("base64"),
    }));
    return res.json({ results: masked, count: masked.length });
  });

  app.post("/api/contacts/reveal", async (req: Request, res: Response) => {
    const parsed = revealSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const decoded = Buffer.from(parsed.data.uploaderPhone, "base64").toString("utf-8");
    const digits = decoded.replace(/\D/g, "");
    if (digits.length < 7) {
      return res.status(400).json({ error: "Invalid uploader reference" });
    }

    return res.json({ uploaderPhone: decoded });
  });

  const httpServer = createServer(app);
  return httpServer;
}
