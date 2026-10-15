import { cookieSections, privacySections, termsSections } from "../lib/content";
import { siteConfig } from "../lib/config";

type LegalType = "privacy" | "terms" | "cookies";
const headings = { privacy: "Política de Privacidade", terms: "Termos de Uso", cookies: "Política de Cookies" } as const;
const sections = { privacy: privacySections, terms: termsSections, cookies: cookieSections } as const;
function BrandMini() { return <a className="brand" href="/" aria-label="SPWeb — início"><span className="brand-mark" aria-hidden="true">◆</span><span><b>SP</b><em>Web</em></span></a>; }
export default function Legal({ type }: { type: LegalType }) {
  const items = sections[type];
  return <div className="site legal-page"><header className="site-header legal-header"><BrandMini /><a className="header-cta" href="/">Voltar ao site</a></header><main className="legal-wrap"><span className="eyebrow">INFORMAÇÕES INSTITUCIONAIS</span><h1 className="headline">{headings[type]}</h1><p className="legal-updated">Última atualização: {siteConfig.lastUpdated}</p><p className="legal-intro">Controlador: {siteConfig.legalName} · CNPJ {siteConfig.cnpj}. {siteConfig.address}. Dados cadastrais preliminares; confirme a identificação no comprovante oficial da Receita Federal.</p><nav className="legal-index" aria-label="Índice desta página"><strong>Nesta página</strong>{items.map(item => <a key={item.id} href={`#${item.id}`}>{item.title}</a>)}</nav><article className="legal-copy">{items.map(item => <section id={item.id} key={item.id}><h2 className="headline">{item.title}</h2><p>{item.body}</p></section>)}<section id="contato-privacidade"><h2 className="headline">Contato sobre privacidade</h2><p>Canal de privacidade/DPO: {siteConfig.dpoEmail || "[PENDENTE: definir e-mail de privacidade e confirmar se há encarregado formal]"}. Endereço cadastral preliminar: {siteConfig.address}.</p></section></article><a className="back-link" href="/">← Voltar ao site</a></main><footer className="footer"><div className="wrap footer-inner"><BrandMini /><p>© {new Date().getFullYear()} SPWeb | CNPJ {siteConfig.cnpj} | {siteConfig.legalName} | {siteConfig.address}</p></div></footer></div>;
}
