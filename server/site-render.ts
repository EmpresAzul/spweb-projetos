import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import App from "../client/src/App";
import { faqs } from "../client/src/lib/content";
import { siteConfig } from "../client/src/lib/config";

const publicRoutes: Record<string, { title: string; description: string }> = {
  "/": { title: "Aumente o lucro da sua empresa sem vender mais | SPWeb", description: "Descubra onde processos, retrabalho e custos invisíveis estão drenando o lucro da sua PME. Receba um diagnóstico sem compromisso." },
  "/politica-de-privacidade": { title: "Política de Privacidade | SPWeb", description: "Saiba como a SPWeb trata e protege os dados pessoais enviados pelo site." },
  "/termos-de-uso": { title: "Termos de Uso | SPWeb", description: "Condições de uso do site SPWeb, incluindo simulações e informações institucionais." },
  "/politica-de-cookies": { title: "Política de Cookies | SPWeb", description: "Informações sobre cookies essenciais, preferências, estatística e marketing no site SPWeb." },
  "/obrigado": { title: "Recebemos sua mensagem | SPWeb", description: "Sua solicitação de diagnóstico foi recebida pela SPWeb." },
  "/admgerencia": { title: "Painel administrativo | SPWeb", description: "Área restrita da SPWeb." },
};
const legalPaths = ["/politica-de-privacidade", "/termos-de-uso", "/politica-de-cookies"];

function schemaFor(path: string, origin: string) {
  if (path !== "/") {
    if (!origin || !legalPaths.includes(path)) return [];
    const breadcrumb = [{ "@type": "ListItem", position: 1, name: "Início", item: `${origin}/` }, { "@type": "ListItem", position: 2, name: publicRoutes[path]?.title || "Página", item: `${origin}${path}` }];
    return [{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumb }];
  }
  const organization = { "@context": "https://schema.org", "@type": "Organization", ...(origin ? { "@id": `${origin}/#organization`, url: origin } : {}), name: siteConfig.brand, ...(siteConfig.companyDetailsVerifiedOfficially ? { legalName: siteConfig.legalName } : {}), taxID: siteConfig.cnpj, identifier: { "@type": "PropertyValue", propertyID: "CNPJ", value: siteConfig.cnpj }, areaServed: { "@type": "Country", name: "Brasil" } };
  const website = { "@context": "https://schema.org", "@type": "WebSite", name: siteConfig.brand, ...(origin ? { url: origin } : {}), inLanguage: "pt-BR" };
  const service = { "@context": "https://schema.org", "@type": "Service", name: "Diagnóstico de vazamentos de lucro", provider: { "@type": "Organization", name: siteConfig.brand }, serviceType: "Diagnóstico e implantação de processos, controles e automações empresariais", audience: { "@type": "BusinessAudience", audienceType: "Donos de pequenas e médias empresas" }, areaServed: { "@type": "Country", name: "Brasil" } };
  const faq = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  return [organization, website, service, faq];
}
export function renderApp(path: string, search = "") {
  return renderToString(createElement(Router, { ssrPath: path, ssrSearch: search, children: createElement(App) }));
}
export function renderDocument(template: string, path: string, markup: string, configuredOrigin = process.env.PUBLIC_SITE_URL || siteConfig.publicOrigin) {
  const route = publicRoutes[path];
  const title = route?.title || "Página não encontrada | SPWeb";
  const description = route?.description || "A página solicitada não foi encontrada no site SPWeb.";
  const privateRoute = path === "/admgerencia" || path === "/obrigado" || !route;
  let origin = "";
  try {
    const candidate = new URL(configuredOrigin.trim());
    if (candidate.protocol === "https:" && candidate.pathname === "/" && !candidate.search && !candidate.hash && !candidate.username && !candidate.password) origin = candidate.origin;
  } catch { /* no canonical origin until a real HTTPS site URL is configured */ }
  let html = template.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/i, `$1${description}$2`);
  html = html.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${privateRoute ? "noindex,nofollow" : "index,follow"}" />`);
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`);
  const canonical = origin && !privateRoute ? `<link rel="canonical" href="${origin}${path}" />` : "";
  const socialImage = origin && !privateRoute ? `<meta property="og:image" content="${origin}/social-preview.png" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta name="twitter:image" content="${origin}/social-preview.png" />` : "";
  const jsonLd = !privateRoute ? schemaFor(path, origin).map(item => `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, "\\u003c")}</script>`).join("") : "";
  html = html.replace("</head>", `${canonical}${socialImage}${jsonLd}</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
  return html;
}
export function getRouteStatus(path: string) {
  if (path === "/admgerencia" || path === "/obrigado") return 200;
  return publicRoutes[path] ? 200 : 404;
}
export function getRouteRobots(path: string) {
  return path === "/admgerencia" || path === "/obrigado" || !publicRoutes[path] ? "noindex, nofollow, noarchive" : "index, follow";
}
export function isKnownPage(path: string) { return Object.hasOwn(publicRoutes, path); }
export const publicPagePaths = Object.keys(publicRoutes);
export const sitemapPagePaths = ["/", ...legalPaths];
