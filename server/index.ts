import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { registerRoutes } from "./routes";
import { pool } from "./storage";
import * as fs from "fs";
import * as path from "path";

const app = express();
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    const origin = req.header("origin");

    // Allow localhost origins for Expo web development (any port)
    const isLocalhost =
      origin?.startsWith("http://localhost:") ||
      origin?.startsWith("http://127.0.0.1:");

    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
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

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false, limit: "10mb" }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

async function getBrandingSettings(): Promise<Record<string, string>> {
  const keys = [
    "site_title", "meta_description", "meta_keywords",
    "og_title", "og_description",
    "hero_title", "hero_subtitle",
    "ios_app_url", "android_app_url", "download_note",
    "footer_email", "footer_copyright", "footer_tagline",
    "app_name",
  ];
  try {
    const result = await pool.query(
      `SELECT key, value FROM app_settings WHERE key = ANY($1)`,
      [keys]
    );
    const settings: Record<string, string> = {};
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
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
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

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, resolvedAppName)
    .replace(/\{\{SITE_TITLE\}\}/g, branding.site_title || "NUMID — Who Saved Me?")
    .replace(/\{\{META_DESCRIPTION\}\}/g, branding.meta_description || "Discover who has your phone number saved in their contacts. NUMID lets you search any number and find out — privately and securely.")
    .replace(/\{\{META_KEYWORDS\}\}/g, branding.meta_keywords || "who saved my number, phone number lookup, contact search, NUMID")
    .replace(/\{\{OG_TITLE\}\}/g, branding.og_title || "NUMID — Who Saved Me?")
    .replace(/\{\{OG_DESCRIPTION\}\}/g, branding.og_description || "Discover who has your phone number saved in their contacts.")
    .replace(/\{\{APP_NAME\}\}/g, resolvedAppName)
    .replace(/\{\{HERO_TITLE\}\}/g, branding.hero_title || 'Find out <span class="accent">who saved</span> your number')
    .replace(/\{\{HERO_SUBTITLE\}\}/g, branding.hero_subtitle || "NUMID lets you search any phone number and instantly see who has it saved in their contacts — privately, securely, in seconds.")
    .replace(/\{\{IOS_APP_URL\}\}/g, branding.ios_app_url || "#")
    .replace(/\{\{ANDROID_APP_URL\}\}/g, branding.android_app_url || "#")
    .replace(/\{\{DOWNLOAD_NOTE\}\}/g, branding.download_note || "Coming soon to both stores · Currently in beta")
    .replace(/\{\{FOOTER_EMAIL\}\}/g, branding.footer_email || "hamzamassaoui@gmail.com")
    .replace(/\{\{FOOTER_COPYRIGHT\}\}/g, branding.footer_copyright || "© 2025 NUMID · Who Saved Me. All rights reserved.")
    .replace(/\{\{FOOTER_TAGLINE\}\}/g, branding.footer_tagline || "Discover who has your phone number saved in their contacts. Fast, private, and available in English, Arabic, and French.");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  log("Serving static Expo files with dynamic manifest routing");

  app.use((req: Request, res: Response, next: NextFunction) => {
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
        appName,
      });
    }

    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  // Catch-all: redirect any unrecognised non-API path to the landing page
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) return next();
    return serveLandingPage({ req, res, landingPageTemplate, appName });
  });

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

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

  // Proxy /admin/* to the PHP admin panel — must be before body parsing
  app.use(
    createProxyMiddleware({
      pathFilter: "/admin",
      target: "http://localhost:8000",
      changeOrigin: true,
      on: {
        error: (_err, _req, res) => {
          (res as Response)
            .status(503)
            .send(
              "<h2>Admin panel is not running</h2><p>Start the Admin Panel workflow in Replit.</p>",
            );
        },
      },
    }),
  );

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
      reusePort: true,
    },
    () => {
      log(`express server serving on port ${port}`);
    },
  );
})();
