import { useEffect, useState } from "react";
import { siteConfig } from "../lib/config";

type Consent = { essential: true; analytics: boolean; marketing: boolean };
type FBQ = ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string };
type MarketingWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: FBQ; _fbq?: FBQ };
const cookieName = "spweb_consent";
const sentInMemory = new Set<string>();

function saveConsent(value: Consent) {
  document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=15552000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}
function loadConsent(): Consent | null {
  const match = document.cookie.split("; ").find(item => item.startsWith(`${cookieName}=`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(cookieName.length + 1))) as Partial<Consent>;
    if (parsed.essential !== true || typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") return null;
    return { essential: true, analytics: parsed.analytics, marketing: parsed.marketing };
  } catch { return null; }
}
function expireCookies(names: string[]) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  for (const name of names) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}
function revokeAnalytics() {
  const w = window as MarketingWindow;
  w.gtag?.("consent", "update", { analytics_storage: "denied" });
  document.querySelectorAll("script[data-spweb-ga4]").forEach(node => node.remove());
  expireCookies(["_ga", "_gid", "_gat"]);
}
function revokeMarketing() {
  const w = window as MarketingWindow;
  w.fbq?.("consent", "revoke");
  w.gtag?.("consent", "update", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  document.querySelectorAll("script[data-spweb-pixel]").forEach(node => node.remove());
  expireCookies(["_fbp", "_fbc"]);
}
function initializeAnalytics(consent: Consent) {
  const id = siteConfig.ga4MeasurementId.trim();
  if (!id) return;
  const w = window as MarketingWindow;
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function (...args: unknown[]) { w.dataLayer?.push(args); };
  w.gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });
  if (!document.querySelector("script[data-spweb-ga4]")) {
    w.gtag("js", new Date());
    w.gtag("config", id, { anonymize_ip: true });
    const script = document.createElement("script");
    script.async = true;
    script.dataset.spwebGa4 = "true";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }
}
function initializeMarketing() {
  const id = siteConfig.metaPixelId.trim();
  if (!id) return;
  const w = window as MarketingWindow;
  if (!w.fbq) {
    const fbq: FBQ = (...args: unknown[]) => { (fbq.queue ??= []).push(args); };
    fbq.queue = []; fbq.loaded = true; fbq.version = "2.0";
    w.fbq = fbq; w._fbq = fbq;
  }
  if (!document.querySelector("script[data-spweb-pixel]")) {
    w.fbq("consent", "grant");
    w.fbq("init", id);
    w.fbq("track", "PageView");
    const script = document.createElement("script");
    script.async = true;
    script.dataset.spwebPixel = "true";
    script.src = "https://connect.facebook.net/pt_BR/fbevents.js";
    document.head.appendChild(script);
  }
}
function syncTracking(consent: Consent) {
  if (typeof window === "undefined") return;
  if (consent.analytics) initializeAnalytics(consent); else revokeAnalytics();
  if (consent.marketing) initializeMarketing(); else revokeMarketing();
}
function wasLeadEventSent(category: string) {
  try { return window.sessionStorage.getItem(`spweb-lead-event-${category}`) === "1"; }
  catch { return sentInMemory.has(category); }
}
function markLeadEventSent(category: string) {
  try { window.sessionStorage.setItem(`spweb-lead-event-${category}`, "1"); }
  catch { sentInMemory.add(category); }
}
function sendLeadEvent(consent: Consent) {
  if (typeof window === "undefined" || window.location.pathname !== "/obrigado") return;
  const w = window as MarketingWindow;
  if (consent.marketing && siteConfig.metaPixelId && w.fbq && !wasLeadEventSent("meta")) {
    w.fbq("track", "Lead"); markLeadEventSent("meta");
  }
  if (consent.analytics && siteConfig.ga4MeasurementId && w.gtag && !wasLeadEventSent("analytics")) {
    w.gtag("event", "generate_lead"); markLeadEventSent("analytics");
  }
}

export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  useEffect(() => {
    const current = loadConsent();
    setConsent(current);
    if (current) { setAnalytics(current.analytics); setMarketing(current.marketing); syncTracking(current); sendLeadEvent(current); }
    const manage = () => {
      const saved = loadConsent();
      setAnalytics(saved?.analytics ?? false); setMarketing(saved?.marketing ?? false); setOpen(true);
    };
    window.addEventListener("spweb:manage-cookies", manage);
    return () => window.removeEventListener("spweb:manage-cookies", manage);
  }, []);
  const choose = (value: Consent) => {
    saveConsent(value); setConsent(value); setOpen(false); syncTracking(value); sendLeadEvent(value);
  };
  if (consent && !open) return null;
  return <aside className="cookie-banner" aria-label="Preferências de cookies">
    <div><strong>Privacidade em primeiro lugar</strong><p>Usamos cookies essenciais. Estatísticas e marketing só são ativados se você autorizar cada categoria.</p>
      {open && <div className="cookie-options" role="group" aria-label="Categorias de cookies">
        <label><input type="checkbox" checked disabled /> Essenciais (sempre ativos)</label>
        <label><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} /> Estatísticos</label>
        <label><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} /> Marketing</label>
      </div>}
    </div>
    <div className="cookie-actions">
      <button type="button" onClick={() => choose({ essential: true, analytics: true, marketing: true })}>Aceitar todos</button>
      <button type="button" onClick={() => choose({ essential: true, analytics: false, marketing: false })}>Recusar não essenciais</button>
      <button type="button" onClick={() => open ? choose({ essential: true, analytics, marketing }) : setOpen(true)}>{open ? "Salvar preferências" : "Personalizar"}</button>
    </div>
  </aside>;
}
