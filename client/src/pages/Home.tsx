import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, useCallback } from "react";
import { siteConfig } from "../lib/config";
import { deliverables, faqs, heroContent, leakStatements, sectionVisuals, serviceSteps, testimonials } from "../lib/content";
import { clientLeadFormSchema } from "../lib/clientLeadSchema";

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
function phoneMask(raw: string) {
  const rawDigits = raw.replace(/\D/g, "");
  const digits = (raw.trim().startsWith("+55") && rawDigits.startsWith("55") ? rawDigits.slice(2) : rawDigits).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  const split = digits.length > 10 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}
function railKeyNavigation(event: ReactKeyboardEvent<HTMLDivElement>) {
  const rail = event.currentTarget;
  const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    rail.scrollBy({ left: (event.key === "ArrowRight" ? 1 : -1) * Math.max(240, rail.clientWidth * 0.8), behavior });
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    rail.scrollTo({ left: event.key === "Home" ? 0 : rail.scrollWidth, behavior });
  }
}
function Brand() { return <a className="brand" href="#top" aria-label="SPWeb — início"><span className="brand-mark" aria-hidden="true">◆</span><span><b>SP</b><em>Web</em></span></a>; }
function CTA({ children, href = "#contato" }: { children: React.ReactNode; href?: string }) { return <a className="cta" href={href}>{children}<span aria-hidden="true">↗</span></a>; }

export default function Home() {
  const [revenue, setRevenue] = useState(200000);
  const [share, setShare] = useState(8);
  const [scrolled, setScrolled] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const monthly = useMemo(() => revenue * share / 100, [revenue, share]);
  const formatInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 12);
    setRevenue(Number(digits || 0));
  };
  const validateLeadForm = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const result = clientLeadFormSchema.safeParse(data);
    if (result.success) { setValidationMessages([]); return; }
    event.preventDefault();
    setValidationMessages([...new Set(result.error.issues.map(issue => issue.message))]);
    const firstField = result.error.issues[0]?.path[0];
    if (firstField) form.querySelector<HTMLElement>(`[name="${String(firstField)}"]`)?.focus();
  };
  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!("IntersectionObserver" in window)) return;
    const headerObserver = hero ? new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0.05 }) : null;
    if (hero && headerObserver) headerObserver.observe(hero);
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-revealed"); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll(".section").forEach(section => revealObserver.observe(section));
    return () => { headerObserver?.disconnect(); revealObserver.disconnect(); };
  }, []);

  return <div className="site" id="top">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    {heroContent.announcement && <div className="topline">{heroContent.announcement}</div>}
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}><Brand /><a className="header-cta" href="#contato">Falar com a SPWeb <span aria-hidden="true">↗</span></a></header>
    <main id="conteudo">
      <section className="hero" aria-labelledby="hero-title">
        <picture className="hero-picture"><source media="(max-width: 700px)" srcSet={heroContent.heroMobileImage} type="image/webp" /><img className="hero-photo" src={heroContent.heroImage} alt="Empresário observa indicadores da operação em um escritório à noite" fetchPriority="high" width="1920" height="1080" /></picture>
        <div className="hero-overlay" />
        <div className="hero-inner wrap">
          <div className="hero-copy"><span className="eyebrow"><i /> DIAGNÓSTICO SEM COMPROMISSO</span>
            <h1 id="hero-title" className="headline">{heroContent.title}<br /><span>{heroContent.subheadline}</span></h1>
            <p style={{fontSize: ".88rem", fontWeight: 600, color: "#ffdf00", marginBottom: "14px", letterSpacing: ".02em"}}>Faturamento é ego, lucro é equilíbrio e caixa é rei.</p>
            <p>Você trabalha, fatura, paga a equipe, paga os fornecedores e, no fim do mês, o caixa não reflete o esforço. Identificamos onde o dinheiro escapa, eliminamos o desperdício e implantamos a infraestrutura para sua operação funcionar com autonomia.</p>
            <CTA>{heroContent.cta}</CTA>
            <small className="micro">Conversa de diagnóstico sem compromisso. Resposta em até 1 dia útil.</small>
          </div>
          <aside className="leak-slip" aria-label="Exemplo ilustrativo do extrato do vazamento"><div className="slip-top"><span>SPW / OPERAÇÃO</span><b>EXTRATO DO VAZAMENTO</b></div>
            {["Retrabalho que ninguém mede", "Tarefas manuais feitas por gente cara", "Compras sem comparação nem regra", "Gargalo que trava a entrega e o recebimento", "Dono apagando incêndio em vez de decidir"].map(item => <div className="slip-row" key={item}><span>{item}</span><b>R$ ______</b></div>)}
            <div className="slip-total"><span>LUCRO QUE DEVERIA TER FICADO</span><b>R$ ??????</b></div><p>Exemplo ilustrativo: o extrato que ninguém te mostra</p>
          </aside>
        </div>
      </section>
      <div className="trust wrap"><span>SPWeb</span><span className="trust-dot">◆</span><span className="trust-line" /><span>Infraestrutura para sua empresa operar com autonomia.</span></div>

      <section className="section wrap"><div className="section-head"><span className="eyebrow">O CUSTO QUE NÃO APARECE NA PLANILHA</span><h2 className="headline">Você conhece essa sensação.</h2></div><div className="pain-grid"><div className="pain-copy"><p>A empresa fatura bem. O telefone toca. A equipe está ocupada. E mesmo assim, no fim do mês, sobra pouco.</p><p>Você já pensou em vender mais. Em contratar mais. Em trabalhar mais horas. E toda vez que cresce, a conta de gente, de erro e de urgência cresce junto.</p><p>O problema nunca foi falta de esforço. É que <strong>cada processo quebrado cobra um pedágio silencioso</strong>, todos os dias, e você paga sem ver a nota.</p></div><figure className="pain-visual"><img src={sectionVisuals.operations} alt="Equipe acompanha indicadores e alertas operacionais em um escritório à noite" loading="lazy" decoding="async" width="1920" height="1080" /><figcaption>O custo cresce quando o processo não se enxerga.</figcaption></figure></div></section>

      <section className="section rail-section"><div className="wrap section-head"><span className="eyebrow">TOP 10 · RECONHECE ALGUM DESSES SINAIS?</span><h2 className="headline">Se alguma dessas frases é sua, o vazamento já está acontecendo.</h2></div><div className="rail-wrap"><div className="leak-rail" role="region" aria-label="Sinais de vazamento. Use as setas esquerda e direita para percorrer os cartões." tabIndex={0} onKeyDown={railKeyNavigation}>{leakStatements.map((item, i) => <article className="leak-card" key={item}><span className="outline-number">{String(i + 1).padStart(2, "0")}</span><span className="card-index">VAZAMENTO {String(i + 1).padStart(2, "0")}</span><p>{item}</p><span className="card-arrow" aria-hidden="true">↗</span></article>)}</div></div></section>

      <section className="section calculator wrap"><div className="calc-copy"><span className="eyebrow">UMA SIMULAÇÃO PARA COMEÇAR</span><h2 className="headline">Quanto o vazamento custa por mês?</h2><p>Faça a conta que quase ninguém faz. É uma simulação ilustrativa para dar tamanho ao problema. O número real vem do diagnóstico.</p><label htmlFor="revenue">Faturamento mensal aproximado</label><div className="money-input"><span>R$</span><input id="revenue" inputMode="numeric" value={new Intl.NumberFormat("pt-BR").format(revenue)} onChange={e => formatInput(e.target.value)} aria-label="Faturamento mensal aproximado em reais" /></div><label className="slider-label" htmlFor="share">Parcela que pode estar escapando <strong>{share}%</strong></label><input id="share" type="range" min="2" max="25" value={share} onChange={e => setShare(Number(e.target.value))} />
      <div className="calc-result" aria-live="polite"><span>Dinheiro que pode estar saindo sem gerar valor</span><strong>{money(monthly)}<small> / mês</small></strong><p>O equivalente a <b>{money(monthly * 12)} por ano.</b></p></div><div style={{marginTop: "20px", padding: "16px", background: "linear-gradient(90deg,#16a34a10,transparent)", borderLeft: "2px solid #16a34a", borderRadius: "6px"}}><p style={{margin: 0, fontSize: ".87rem", color: "#c5d5e5", lineHeight: 1.6}}><strong style={{color: "#4ade80", display: "block", marginBottom: "6px"}}>O investimento para ter o ecossistema completo</strong>Dependendo do seu faturamento, fica entre 10% e 15% do vazamento anual detectado. Ou seja: mesmo investindo, você ainda recupera 85% a 90% do desperdício — e isso se repete todos os anos.</p></div><span className="fineprint">Simulação ilustrativa, não garante resultado.</span><CTA>Quero receber meu diagnóstico</CTA></div><figure className="calc-image"><img src="/images/calculator.webp" alt="Mãos analisam contas e calculadora em uma mesa de trabalho" loading="lazy" decoding="async" width="900" height="675" /><figcaption>O primeiro passo é enxergar o número.</figcaption></figure></section>

      <section className="section mechanism"><div className="wrap"><div className="section-head"><span className="eyebrow">DO DIAGNÓSTICO À AUTONOMIA</span><h2 className="headline">Não é consultoria que entrega slide. É infraestrutura que opera sozinha.</h2><p>Relatório bonito não devolve lucro. O que devolve é um ecossistema de processos, controles e automações implantado dentro da sua empresa, funcionando sem depender de você ou de heróis na equipe.</p></div><div className="steps">{serviceSteps.map(([n, title, body]) => <article className="step-card" key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}</div><figure className="mechanism-visual"><img src={sectionVisuals.automation} alt="Gestor acompanha fluxos automatizados em painéis de operação" loading="lazy" decoding="async" width="1600" height="900" /><figcaption>Automação que sustenta a rotina — sem virar mais uma tarefa para o dono.</figcaption></figure></div></section>

      <section className="section wrap"><div className="section-head"><span className="eyebrow">A MESMA EMPRESA. OUTRA ROTINA.</span><h2 className="headline">O mesmo negócio. Duas realidades.</h2></div><div className="compare"><article><span className="compare-label">× HOJE</span><img src={sectionVisuals.chaos} alt="Mesa de operação sobrecarregada com papéis e tarefas manuais" loading="lazy" decoding="async" width="1600" height="900" /><ul><li>Fatura mais e sobra menos</li><li>Decisões no escuro e no susto</li><li>Equipe cara fazendo tarefa de máquina</li><li>Você é o gargalo da própria empresa</li><li>Sensação constante de correr sem chegar</li></ul></article><article className="compare-after"><span className="compare-label">✓ DEPOIS DA IMPLANTAÇÃO</span><img src={sectionVisuals.order} alt="Equipe opera com tranquilidade diante de um painel organizado" loading="lazy" decoding="async" width="1600" height="900" /><ul><li>Cada real tem destino e dono</li><li>Números claros para decidir com calma</li><li>Processos rodando com autonomia</li><li>Você volta a pensar no negócio, não a apagar fogo</li><li>Lucro previsível, sem depender de vender mais</li></ul></article></div></section>

      <section className="section rail-section deliverables"><div className="wrap section-head"><span className="eyebrow">O QUE FICA NA SUA EMPRESA</span><h2 className="headline">O que fica instalado na sua empresa</h2></div><div className="rail-wrap"><div className="poster-rail" role="region" aria-label="Entregáveis do ecossistema. Use as setas esquerda e direita para percorrer os cartões." tabIndex={0} onKeyDown={railKeyNavigation}>{deliverables.map(([title, body, image]) => <article className="poster" key={title}><img src={image} alt="" loading="lazy" decoding="async" width="480" height="640" /><div className="poster-shade" /><div className="poster-copy"><span>SPWEB · ECOSSISTEMA</span><h3>{title}</h3><p>{body}</p></div></article>)}</div></div></section>

      <section className="section wrap qualify"><div className="section-head"><span className="eyebrow">CRITÉRIO E TRANSPARÊNCIA</span><h2 className="headline">Para quem é. Para quem não é.</h2></div><div className="qualify-grid"><article><h3>É para você se…</h3><ul><li>sua PME já fatura e tem equipe</li><li>sente que o lucro não acompanha o esforço</li><li>quer resolver a causa, não só apagar incêndio</li><li>está disposto a mudar processos</li></ul></article><article><h3>Não é para você se…</h3><ul><li>busca fórmula mágica sem mexer na operação</li><li>quer só mais um relatório para a gaveta</li><li>ainda não tem operação rodando</li><li>não vai dedicar tempo à implantação</li></ul></article></div></section>

      <section className="section rail-section testimonials-section"><div className="wrap section-head"><span className="eyebrow">PROVA SOCIAL</span><h2 className="headline">Quem já parou de deixar o lucro escapar</h2></div><div className="rail-wrap"><div className="testimonials-rail" role="region" aria-label="Depoimentos de clientes" tabIndex={0} onKeyDown={railKeyNavigation}>{testimonials.map((testimonial) => <article className="testimonial-card" key={testimonial.name}><p>"{testimonial.text}"</p><div className="testimonial-author"><strong>{testimonial.name}</strong><span>{testimonial.city}, {testimonial.state} - {testimonial.country}</span></div></article>)}</div></div></section>

      <section className="section offer-section"><div className="wrap offer"><div><span className="eyebrow">UM PRÓXIMO PASSO, SEM PRESSÃO</span><h2 className="headline">Cada mês de espera é mais um mês pagando por desperdício.</h2><p>Você já pagou esse custo até aqui sem ver a nota. A pergunta é por quanto tempo mais.</p></div><div className="offer-card"><span>DIAGNÓSTICO DE VAZAMENTOS DE LUCRO</span><p>Conversa estratégica para entender sua operação e apontar onde estão os maiores desperdícios, com plano de implantação sob medida.</p><CTA>Quero parar de perder lucro</CTA><small>Sem compromisso. Vagas limitadas por mês para manter a qualidade da implantação.</small></div></div></section>

      <section className="section wrap faq"><div className="section-head"><span className="eyebrow">RESPOSTAS DIRETAS</span><h2 className="headline">Perguntas frequentes</h2></div>{faqs.map(({ question, answer }) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</section>

      <section className="contact-section" id="contato"><div className="contact-glow" /><div className="wrap contact-content"><span className="eyebrow">SEU PRÓXIMO PASSO</span><h2 className="headline">Sua empresa não precisa trabalhar mais para dar mais lucro.</h2><p>Precisa parar de desperdiçar o que já conquista. Conte sua situação e receba seu diagnóstico.</p><form className="lead-form" action="/api/lead" method="post" onSubmit={validateLeadForm}><label className="honeypot" aria-hidden="true">Deixe em branco<input name="website" tabIndex={-1} autoComplete="off" /></label><label>Nome<input name="name" autoComplete="name" required /></label><label>Empresa<input name="company" autoComplete="organization" required /></label><label>WhatsApp<input name="whatsapp" type="tel" autoComplete="tel" placeholder="(11) 99999-9999" onInput={e => { e.currentTarget.value = phoneMask(e.currentTarget.value); }} required /></label><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><label className="full-field">Faturamento mensal aproximado<select name="revenueBand" required defaultValue=""><option value="" disabled>Selecione uma faixa</option><option>Até R$ 50 mil</option><option>R$ 50 a 200 mil</option><option>R$ 200 a 500 mil</option><option>Acima de R$ 500 mil</option></select></label><label className="full-field">Sua dúvida ou situação<textarea name="message" rows={3} /></label><label className="consent full-field"><input type="checkbox" name="consent" value="true" required /><span>Li e concordo com a <a href="/politica-de-privacidade" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label>{validationMessages.length > 0 && <p className="form-errors full-field" role="alert" aria-live="assertive">{validationMessages.join(" ")}</p>}<button className="cta form-submit" type="submit">Quero meu diagnóstico agora <span aria-hidden="true">↗</span></button><small className="form-note">Seu pedido será tratado com segurança e usado para preparar o diagnóstico solicitado.</small></form></div></section>
    </main>
    <footer className="footer"><div className="wrap footer-inner"><Brand /><nav aria-label="Links legais"><a href="/politica-de-privacidade" target="_blank" rel="noopener">Política de Privacidade</a><a href="/termos-de-uso" target="_blank" rel="noopener">Termos de Uso</a><a href="/politica-de-cookies" target="_blank" rel="noopener">Política de Cookies</a><button type="button" className="manage-cookies" onClick={() => window.dispatchEvent(new Event("spweb:manage-cookies"))}>Gerenciar cookies</button></nav><p>© {new Date().getFullYear()} SPWeb | CNPJ {siteConfig.cnpj}{siteConfig.companyDetailsVerifiedOfficially ? ` · ${siteConfig.legalName} · ${siteConfig.address}` : ""}</p><small>Simulações são ilustrativas e não garantem resultado.</small></div></footer>
  </div>;
}
