import "dotenv/config";
import express from "express";
import compression from "compression";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerSpwebRoutes } from "../spweb-routes";

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV !== "development") {
      res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://connect.facebook.net https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.cloudfront.net; font-src 'self' data:; connect-src 'self' https://connect.facebook.net https://www.facebook.com https://graph.facebook.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://*.manus.computer https://*.manuspre.computer https://manus.im https://*.manus.im; upgrade-insecure-requests");
    }
    const proto = String(req.get("x-forwarded-proto") || "").split(",")[0].trim();
    if (req.secure || proto === "https") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
  app.use(compression({ threshold: 1024 }));
  const server = createServer(app);
  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ limit: "16kb", extended: false }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  registerSpwebRoutes(app);
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Visit: http://localhost:${port}`);
  });
}

startServer().catch(error => { console.error(error); process.exit(1); });
