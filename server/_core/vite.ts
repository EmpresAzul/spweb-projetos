import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getRouteRobots, getRouteStatus, renderDocument } from "../site-render";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = { middlewareMode: true, hmr: { server }, allowedHosts: true as const };
  const vite = await createViteServer({ ...viteConfig, configFile: false, server: serverOptions, appType: "custom" });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const parsedUrl = new URL(url, "http://localhost");
    const pathname = parsedUrl.pathname;
    if (pathname.startsWith("/api/")) { res.status(404).json({ error: "Endpoint não encontrado." }); return; }
    try {
      const { default: App } = await vite.ssrLoadModule("/src/App.tsx");
      const ssrContext: { redirectTo?: string } = {};
      const markup = renderToString(createElement(Router, {
        ssrPath: pathname,
        ssrSearch: parsedUrl.search,
        ssrContext,
        children: createElement(App),
      }));
      if (ssrContext.redirectTo) { res.redirect(302, ssrContext.redirectTo); return; }
      const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = renderDocument(template, pathname, markup);
      const page = await vite.transformIndexHtml(url, template);
      const status = getRouteStatus(pathname);
      res.setHeader("X-Robots-Tag", getRouteRobots(pathname));
      res.setHeader("Cache-Control", pathname === "/admgerencia" || pathname === "/obrigado" ? "private, no-store" : "public, max-age=0, must-revalidate");
      res.status(status).set({ "Content-Type": "text/html; charset=utf-8" }).end(page);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) console.error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  app.use(express.static(distPath, { index: false, setHeaders(res, filePath) {
    if (filePath.includes(`${path.sep}assets${path.sep}`) && /-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2)$/.test(filePath)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    else res.setHeader("Cache-Control", "no-cache");
  } }));
  app.get("*", async (req, res, next) => {
    const parsedUrl = new URL(req.originalUrl, "http://localhost");
    const pathname = parsedUrl.pathname;
    if (pathname.startsWith("/api/")) { res.status(404).json({ error: "Endpoint não encontrado." }); return; }
    try {
      const { renderApp, renderDocument: renderProductionDocument, getRouteRobots: getProductionRobots, getRouteStatus: getProductionStatus } = await import("../site-render");
      const template = await fs.promises.readFile(path.join(distPath, "index.html"), "utf-8");
      const markup = renderApp(pathname, parsedUrl.search);
      const html = renderProductionDocument(template, pathname, markup);
      res.setHeader("X-Robots-Tag", getProductionRobots(pathname));
      res.setHeader("Cache-Control", pathname === "/admgerencia" || pathname === "/obrigado" ? "private, no-store" : "public, max-age=0, must-revalidate");
      res.status(getProductionStatus(pathname)).type("html").send(html);
    } catch (error) { next(error); }
  });
}
