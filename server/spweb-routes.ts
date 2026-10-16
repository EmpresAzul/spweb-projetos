import { createHmac, createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { allLeads, consumeRateLimitSlot, countLeads, createLead, deleteExpiredRateLimitBuckets, deleteLeadsByIds, findAdminSession, removeAdminSession, searchLeads, storeAdminSession } from "./db";
import type { NewLead } from "../drizzle/schema";
import { siteConfig } from "../client/src/lib/config";
import { leadFormSchema } from "../client/src/lib/leadSchema";

const signingKey: string = process.env.SPW_SESSION_SECRET || process.env.MANUS_JWT_SECRET || "";
if (!signingKey) throw new Error("A stable session signing secret is required.");
const ipHashKey = process.env.IP_HASH_SECRET || signingKey;
const THANKS_COOKIE = "spweb_thanks";
const FORM_COOKIE = "spweb_form_started";
const ADMIN_COOKIE = "spweb_admin";
const CSRF_COOKIE = "spweb_admin_csrf";
const formSchema = leadFormSchema.extend({ website: z.string().optional().default("") });
const adminLoginSchema = z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(300) });
let rateLimitCleanupStarted = false;
let fallbackPasswordHash: Promise<string> | null = null;
function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }
function hmac(value: string) { return createHmac("sha256", signingKey).update(value).digest("hex"); }
function safeEqual(a: string, b: string) {
  const aa = createHash("sha256").update(a).digest();
  const bb = createHash("sha256").update(b).digest();
  return timingSafeEqual(aa, bb);
}
function secureRequest(req: Request) { return req.secure || String(req.get("x-forwarded-proto") || "").split(",")[0].trim() === "https"; }
function previewRequest(req: Request) {
  const host = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim().toLowerCase();
  return host.endsWith(".manus.computer") || host.endsWith(".manuspre.computer");
}
function cookieSameSite(req: Request): "strict" | "none" { return previewRequest(req) ? "none" : "strict"; }
function getCookies(req: Request) { return parseCookie(req.headers.cookie || ""); }
function clientAddressHash(req: Request) {
  const address = req.ip || req.socket.remoteAddress || "unknown";
  return createHmac("sha256", ipHashKey).update(address).digest("hex");
}
function takeRateSlot(scope: "lead" | "admin-login", ipHash: string, windowMs: number, max: number) {
  const bucketKey = createHmac("sha256", ipHashKey).update(`${scope}:${ipHash}`).digest("hex");
  return consumeRateLimitSlot(bucketKey, windowMs, max);
}
function startRateLimitCleanup() {
  if (rateLimitCleanupStarted) return;
  rateLimitCleanupStarted = true;
  const cleanup = () => { void deleteExpiredRateLimitBuckets().catch(() => console.error("[SPWeb] Rate limit cleanup failed.")); };
  cleanup();
  const timer = setInterval(cleanup, 6 * 60 * 60 * 1000);
  timer.unref();
}
function signedTimestamp(value: string) { return `${value}.${hmac(value)}`; }
function validSignedTimestamp(value: string | undefined, maxAgeMs: number, minAgeMs = 0) {
  if (!value) return false;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return false;
  const timestamp = value.slice(0, dot); const signature = value.slice(dot + 1);
  if (!/^\d{13}$/.test(timestamp) || !safeEqual(hmac(timestamp), signature)) return false;
  const age = Date.now() - Number(timestamp);
  return age >= minAgeMs && age <= maxAgeMs;
}
export function hasValidThankYouCookie(req: Request) { return validSignedTimestamp(getCookies(req)[THANKS_COOKIE], 10 * 60 * 1000); }
export function setFormStartedCookie(req: Request, res: Response) {
  const preview = previewRequest(req);
  res.cookie(FORM_COOKIE, signedTimestamp(String(Date.now())), { httpOnly: true, secure: secureRequest(req) || preview, sameSite: preview ? "none" : "lax", maxAge: 4 * 60 * 60 * 1000, path: "/" });
}
function summarizedUserAgent(raw: string) {
  const browser = /Edg\//.test(raw) ? "Edge" : /Firefox\//.test(raw) ? "Firefox" : /Chrome\//.test(raw) ? "Chrome" : /Safari\//.test(raw) ? "Safari" : "Other";
  const platform = /Android/.test(raw) ? "Android" : /iPhone|iPad/.test(raw) ? "iOS" : /Windows/.test(raw) ? "Windows" : /Mac OS/.test(raw) ? "macOS" : /Linux/.test(raw) ? "Linux" : "Other";
  return `${browser}/${platform}`.slice(0, 180);
}
async function configuredPasswordHash() {
  const storedHash = process.env.ADMIN_PASSWORD_HASH || "";
  try {
    const rounds = bcrypt.getRounds(storedHash);
    if (Number.isInteger(rounds) && rounds >= 12) {
      if (process.env.ADMIN_PASSWORD) delete process.env.ADMIN_PASSWORD;
      return storedHash;
    }
  }
  catch { /* fall through to the protected password secret */ }
  const plainSecret = process.env.ADMIN_PASSWORD || "";
  if (!plainSecret) return "";
  fallbackPasswordHash ??= bcrypt.hash(plainSecret, 12).then(hash => {
    if (process.env.ADMIN_PASSWORD === plainSecret) delete process.env.ADMIN_PASSWORD;
    return hash;
  });
  return fallbackPasswordHash;
}
function parseDateOnly(value: string | undefined, exclusiveEnd = false): Date | null | undefined {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return null;
  const result = new Date(`${value}T00:00:00-03:00`);
  if (exclusiveEnd) result.setUTCDate(result.getUTCDate() + 1);
  return result;
}
function setAdminCookies(req: Request, res: Response, token: string, csrf: string) {
  const sameSite = cookieSameSite(req);
  const secure = secureRequest(req) || sameSite === "none";
  res.cookie(ADMIN_COOKIE, token, { httpOnly: true, secure, sameSite, maxAge: 8 * 60 * 60 * 1000, path: "/" });
  res.cookie(CSRF_COOKIE, csrf, { httpOnly: false, secure, sameSite, maxAge: 8 * 60 * 60 * 1000, path: "/" });
}
async function sessionFor(req: Request) {
  const raw = getCookies(req)[ADMIN_COOKIE];
  if (!raw || raw.length > 180) return undefined;
  const separator = raw.lastIndexOf(".");
  if (separator < 1) return undefined;
  const token = raw.slice(0, separator);
  if (!safeEqual(hmac(token), raw.slice(separator + 1))) return undefined;
  return findAdminSession(sha256(token));
}
function csrfValid(req: Request, expectedHash: string) {
  const header = req.get("x-csrf-token") || "";
  const cookieValue = getCookies(req)[CSRF_COOKIE] || "";
  return Boolean(header && cookieValue && safeEqual(header, cookieValue) && safeEqual(sha256(header), expectedHash));
}
function adminNoIndex(res: Response) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Cache-Control", "private, no-store");
}

function configuredPublicOrigin() {
  try {
    const url = new URL((process.env.PUBLIC_SITE_URL || siteConfig.publicOrigin).trim());
    return url.protocol === "https:" && url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password ? url.origin : "";
  } catch { return ""; }
}

export function registerSpwebRoutes(app: Express) {
  startRateLimitCleanup();
  app.get("/robots.txt", (_req, res) => {
    const lines = ["User-agent: *", "Allow: /", "Disallow: /admgerencia", "Disallow: /obrigado", "Disallow: /api/"];
    for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) lines.push("", `User-agent: ${bot}`, "Allow: /", "Disallow: /admgerencia", "Disallow: /obrigado", "Disallow: /api/");
    const origin = configuredPublicOrigin();
    if (origin) lines.push("", `Sitemap: ${origin}/sitemap.xml`);
    res.type("text/plain; charset=utf-8").send(lines.join("\n") + "\n");
  });
  app.get("/sitemap.xml", (_req, res) => {
    const origin = configuredPublicOrigin();
    res.type("application/xml; charset=utf-8");
    if (!origin) {
      res.status(503).send("Configure PUBLIC_SITE_URL com a origem HTTPS oficial antes de habilitar o sitemap.");
      return;
    }
    const paths = ["/", "/politica-de-privacidade", "/termos-de-uso", "/politica-de-cookies"];
    const urls = paths.map(route => `<url><loc>${origin}${route}</loc></url>`).join("");
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  });
  app.get("/", (req, res, next) => { setFormStartedCookie(req, res); next(); });
  app.get("/obrigado", (req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    if (!hasValidThankYouCookie(req)) { res.redirect(302, "/"); return; }
    next();
  });
  app.use("/admgerencia", (_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.setHeader("Cache-Control", "private, no-store");
    next();
  });

  app.post("/api/lead", async (req, res) => {
    const parsed = formSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).type("text/plain; charset=utf-8").send(`Não foi possível enviar. ${parsed.error.issues.map(issue => issue.message).join(" ")}`);
      return;
    }
    const input = parsed.data;
    if (input.website) { res.redirect(303, "/"); return; }
    if (!validSignedTimestamp(getCookies(req)[FORM_COOKIE], 4 * 60 * 60 * 1000, 2500)) {
      res.status(400).type("text/plain; charset=utf-8").send("Aguarde alguns segundos e tente enviar novamente.");
      return;
    }
    const ipHash = clientAddressHash(req);
    try {
      if (!(await takeRateSlot("lead", ipHash, 60 * 60 * 1000, 5))) {
        res.status(429).type("text/plain; charset=utf-8").send("Limite de solicitações atingido. Tente novamente mais tarde.");
        return;
      }
      const now = new Date();
      let source = "direct"; let utmSource: string | null = null; let utmMedium: string | null = null; let utmCampaign: string | null = null;
      const referrer = req.get("referer");
      if (referrer) {
        try {
          const parsedUrl = new URL(referrer);
          source = parsedUrl.hostname.slice(0, 100);
          utmSource = parsedUrl.searchParams.get("utm_source")?.slice(0, 255) || null;
          utmMedium = parsedUrl.searchParams.get("utm_medium")?.slice(0, 255) || null;
          utmCampaign = parsedUrl.searchParams.get("utm_campaign")?.slice(0, 255) || null;
        } catch { /* ignore malformed referrer */ }
      }
      const lead: NewLead = {
        id: randomUUID(), name: input.name, company: input.company,
        whatsapp: input.whatsapp, email: input.email, city: input.city, revenueBand: input.revenueBand,
        businessModel: input.businessModel, investmentCapability: input.investmentCapability,
        message: input.message || null, consent: 1, consentAt: now,
        source, utmSource, utmMedium, utmCampaign,
        ipHash, userAgentSummary: summarizedUserAgent(req.get("user-agent") || ""), createdAt: now,
      };
      await createLead(lead);
      const preview = previewRequest(req);
      const secure = secureRequest(req) || preview;
      res.clearCookie(FORM_COOKIE, { path: "/" });
      res.cookie(THANKS_COOKIE, signedTimestamp(String(Date.now())), { httpOnly: true, secure, sameSite: preview ? "none" : "lax", maxAge: 10 * 60 * 1000, path: "/" });
      res.redirect(303, "/obrigado");
    } catch (error) {
      console.error("[SPWeb] Lead submission failed.");
      res.status(503).type("text/plain; charset=utf-8").send("Não foi possível registrar sua solicitação agora. Tente novamente em alguns minutos.");
    }
  });

  app.get("/api/admin/session", async (req, res) => {
    adminNoIndex(res);
    try {
      const session = await sessionFor(req);
      if (!session) { res.status(401).json({ error: "Sessão expirada." }); return; }
      res.json({ authenticated: true, expiresAt: session.expiresAt, csrf: getCookies(req)[CSRF_COOKIE] || "" });
    } catch { res.status(503).json({ error: "Painel temporariamente indisponível." }); }
  });

  app.post("/api/admin/login", async (req, res) => {
    adminNoIndex(res);
    const ipHash = clientAddressHash(req);
    try {
      if (!(await takeRateSlot("admin-login", ipHash, 15 * 60 * 1000, 5))) { res.status(429).json({ error: "Muitas tentativas. Aguarde 15 minutos." }); return; }
    } catch { res.status(503).json({ error: "Painel temporariamente indisponível." }); return; }
    const parsed = adminLoginSchema.safeParse(req.body);
    const email = parsed.success ? parsed.data.email.trim().toLowerCase() : "";
    const inputPassword = parsed.success ? parsed.data.password : "";
    const configuredEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!configuredEmail) { res.status(503).json({ error: "Credenciais administrativas ainda não configuradas." }); return; }
    try {
      const configuredHash = await configuredPasswordHash();
      if (!configuredHash) { res.status(503).json({ error: "Credenciais administrativas ainda não configuradas." }); return; }
      const emailOk = safeEqual(email, configuredEmail);
      const passwordOk = parsed.success && await bcrypt.compare(inputPassword, configuredHash);
      if (!parsed.success || !emailOk || !passwordOk) { res.status(401).json({ error: "E-mail ou senha inválidos." }); return; }
      const token = randomBytes(32).toString("base64url");
      const csrf = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
      await storeAdminSession({ tokenHash: sha256(token), csrfHash: sha256(csrf), adminEmail: configuredEmail, expiresAt });
      setAdminCookies(req, res, `${token}.${hmac(token)}`, csrf);
      res.json({ authenticated: true, csrf });
    } catch (error) {
      console.error("[SPWeb] Admin login failed.");
      res.status(503).json({ error: "Painel temporariamente indisponível." });
    }
  });

  app.use("/api/admin", async (req, res, next) => {
    adminNoIndex(res);
    try {
      const session = await sessionFor(req);
      if (!session) { res.status(401).json({ error: "Sessão expirada." }); return; }
      if (req.method !== "GET" && !csrfValid(req, session.csrfHash)) { res.status(403).json({ error: "Token de segurança inválido." }); return; }
      (req as Request & { spwebSession?: typeof session }).spwebSession = session;
      next();
    } catch { res.status(503).json({ error: "Painel temporariamente indisponível." }); }
  });

  app.post("/api/admin/logout", async (req, res) => {
    adminNoIndex(res);
    try { const raw = getCookies(req)[ADMIN_COOKIE]; if (raw) { const separator = raw.lastIndexOf("."); const token = raw.slice(0, separator); if (separator > 0 && safeEqual(hmac(token), raw.slice(separator + 1))) await removeAdminSession(sha256(token)); } } catch { /* logout remains idempotent */ }
    res.clearCookie(ADMIN_COOKIE, { path: "/" }); res.clearCookie(CSRF_COOKIE, { path: "/" });
    res.status(204).end();
  });

  app.get("/api/admin/leads", async (req, res) => {
    adminNoIndex(res);
    try {
      const page = Math.max(1, Math.min(10000, Number(req.query.page) || 1));
      const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 160) : "";
      const revenueBand = typeof req.query.band === "string" ? req.query.band.slice(0, 40) : "";
      const from = parseDateOnly(typeof req.query.from === "string" ? req.query.from : undefined);
      const toExclusive = parseDateOnly(typeof req.query.to === "string" ? req.query.to : undefined, true);
      if (from === null || toExclusive === null || (from && toExclusive && from >= toExclusive)) { res.status(400).json({ error: "Período inválido." }); return; }
      const result = await searchLeads({ page, pageSize: 25, query, revenueBand, from, toExclusive });
      res.json(result);
    } catch { res.status(503).json({ error: "Não foi possível carregar os leads." }); }
  });

  app.get("/api/admin/leads.csv", async (req, res) => {
    adminNoIndex(res);
    try {
      const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 160) : "";
      const revenueBand = typeof req.query.band === "string" ? req.query.band.slice(0, 40) : "";
      const from = parseDateOnly(typeof req.query.from === "string" ? req.query.from : undefined);
      const toExclusive = parseDateOnly(typeof req.query.to === "string" ? req.query.to : undefined, true);
      if (from === null || toExclusive === null || (from && toExclusive && from >= toExclusive)) { res.status(400).json({ error: "Período inválido." }); return; }
      const rows = await allLeads({ query, revenueBand, from, toExclusive });
      const columns = ["id", "createdAt", "name", "company", "whatsapp", "email", "revenueBand", "message", "source", "utmSource", "utmMedium", "utmCampaign", "consent", "consentAt"] as const;
      const escapeCell = (value: unknown) => { let text = String(value ?? ""); if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`; return `"${text.replace(/"/g, '""')}"`; };
      const csv = "\uFEFF" + [columns.join(";"), ...rows.map(row => columns.map(key => escapeCell(row[key])).join(";"))].join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", "attachment; filename=spweb-leads.csv"); res.send(csv);
    } catch { res.status(503).json({ error: "Não foi possível exportar os leads." }); }
  });

  app.post("/api/admin/leads/delete", async (req, res) => {
    adminNoIndex(res);
    const ids = z.array(z.string().uuid()).min(1).max(100).safeParse(req.body?.ids);
    if (!ids.success) { res.status(400).json({ error: "Seleção inválida." }); return; }
    try { await deleteLeadsByIds(ids.data); res.json({ deleted: ids.data.length }); }
    catch { res.status(503).json({ error: "Não foi possível excluir os leads." }); }
  });

  app.get("/api/admin/count", async (_req, res) => {
    adminNoIndex(res);
    try { res.json({ total: await countLeads() }); } catch { res.status(503).json({ error: "Não foi possível contar os leads." }); }
  });
}
