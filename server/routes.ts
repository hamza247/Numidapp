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
  ).max(5000),
});

const searchSchema = z.object({
  phone: z.string().min(5).max(20),
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/contacts/upload", async (req: Request, res: Response) => {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
    }

    const { uploaderPhone, contacts } = parsed.data;

    const items = contacts.map((c) => ({
      uploaderPhone,
      storedNumber: c.storedNumber.replace(/\D/g, ""),
      storedName: c.storedName,
      label: c.label,
    })).filter((c) => c.storedNumber.length >= 5);

    const count = await upsertContacts(items);
    return res.json({ uploaded: count });
  });

  app.get("/api/contacts/search", async (req: Request, res: Response) => {
    const parsed = searchSchema.safeParse({ phone: req.query.phone });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const results = await searchNumber(parsed.data.phone);
    return res.json({ results, count: results.length });
  });

  const httpServer = createServer(app);
  return httpServer;
}
