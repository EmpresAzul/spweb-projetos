import { useEffect, useMemo, useState } from "react";
import { siteConfig } from "../lib/config";

type Lead = { id: string; name: string; company: string; whatsapp: string; email: string; revenueBand: string; message: string | null; source: string | null; utmSource: string | null; createdAt: string };
const bands = ["Até R$ 50 mil", "R$ 50 a 200 mil", "R$ 200 a 500 mil", "Acima de R$ 500 mil"];
const dateLabel = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
export default function Admin() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [csrf, setCsrf] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]); const [loggedIn, setLoggedIn] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(""); const [band, setBand] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [selected, setSelected] = useState<string[]>([]); const pageSize = 25;
  const headers = useMemo(() => ({ "Content-Type": "application/json", "X-CSRF-Token": csrf }), [csrf]);
  const filters = useMemo(() => new URLSearchParams({ q: query, band, from, to }), [query, band, from, to]);
  useEffect(() => {
    document.title = "Painel administrativo | SPWeb";
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement("meta"); robots.setAttribute("name", "robots"); document.head.appendChild(robots); }
    robots.setAttribute("content", "noindex,nofollow");
    fetch("/api/admin/session", { credentials: "same-origin" }).then(async response => {
      if (response.ok) { const data = await response.json(); setLoggedIn(true); setCsrf(data.csrf || ""); }
    }).catch(() => undefined);
  }, []);
  async function loadLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters); params.set("page", String(page));
      const response = await fetch(`/api/admin/leads?${params}`, { credentials: "same-origin" });
      if (!response.ok) { if (response.status === 401) setLoggedIn(false); const data = await response.json().catch(() => ({})); setError(data.error || (response.status === 401 ? "Sessão encerrada. Entre novamente." : "Não foi possível aplicar esse filtro.")); return; }
      const data = await response.json(); setLeads(data.items); setTotal(data.total); setSelected([]);
    } catch { setError("Não foi possível carregar os leads."); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (loggedIn) void loadLeads(); }, [loggedIn, page, filters]);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Não foi possível entrar.");
      setCsrf(data.csrf || ""); setPassword(""); setLoggedIn(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Falha de autenticação."); }
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin", headers }); setLoggedIn(false); setCsrf("");
  }
  async function remove(ids: string[]) {
    if (!ids.length) return;
    const confirmation = ids.length === 1 ? "Excluir definitivamente este lead? Esta ação não pode ser desfeita." : `Excluir definitivamente ${ids.length} leads? Esta ação não pode ser desfeita.`;
    if (!window.confirm(confirmation)) return;
    const response = await fetch("/api/admin/leads/delete", { method: "POST", credentials: "same-origin", headers, body: JSON.stringify({ ids }) });
    if (response.ok) await loadLeads(); else setError("Não foi possível excluir. Atualize a sessão e tente novamente.");
  }
  async function exportCsv() {
    const response = await fetch(`/api/admin/leads.csv?${filters}`, { credentials: "same-origin" });
    if (!response.ok) { setError("Falha ao exportar CSV."); return; }
    const url = URL.createObjectURL(await response.blob()); const link = document.createElement("a"); link.href = url; link.download = "spweb-leads.csv"; link.click(); URL.revokeObjectURL(url);
  }
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const toggle = (id: string, checked: boolean) => setSelected(current => checked ? Array.from(new Set([...current, id])) : current.filter(item => item !== id));
  if (!loggedIn) return <main className="admin-page"><a className="brand" href="/" aria-label="SPWeb — início"><span className="brand-mark" aria-hidden="true">◆</span><span><b>SP</b><em>Web</em></span></a><section className="admin-login"><span className="eyebrow">ÁREA RESTRITA</span><h1 className="headline">Entrar no painel</h1><p>Acesso exclusivo para gestão dos contatos recebidos.</p><form onSubmit={login}><label>E-mail<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Senha<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{error && <p role="alert" className="admin-error">{error}</p>}<button className="cta" type="submit">Entrar no painel</button></form><a className="back-link" href="/">Voltar ao site</a></section></main>;
  return <main className="admin-page"><header className="admin-head"><a className="brand" href="/" aria-label="SPWeb — início"><span className="brand-mark" aria-hidden="true">◆</span><span><b>SP</b><em>Web</em></span></a><div><strong>{total} leads</strong><button type="button" onClick={() => void logout()} className="ghost-cta">Sair</button></div></header><section className="admin-content"><h1 className="headline">Leads recebidos</h1>
    <div className="admin-toolbar"><input aria-label="Buscar lead" placeholder="Buscar nome, empresa ou e-mail" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /><select aria-label="Filtrar faturamento" value={band} onChange={event => { setBand(event.target.value); setPage(1); }}><option value="">Todas as faixas</option>{bands.map(item => <option key={item}>{item}</option>)}</select><label>De<input aria-label="Data inicial" type="date" max={to || undefined} value={from} onChange={event => { setFrom(event.target.value); setPage(1); }} /></label><label>Até<input aria-label="Data final" type="date" min={from || undefined} value={to} onChange={event => { setTo(event.target.value); setPage(1); }} /></label><button className="ghost-cta" onClick={() => void exportCsv()}>Exportar CSV</button><button className="danger-button" disabled={!selected.length} onClick={() => void remove(selected)}>Excluir selecionados ({selected.length})</button></div>
    {error && <p role="alert" className="admin-error">{error}</p>}{loading && <p aria-live="polite">Carregando leads…</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th><input type="checkbox" aria-label="Selecionar todos desta página" checked={leads.length > 0 && selected.length === leads.length} onChange={event => setSelected(event.target.checked ? leads.map(item => item.id) : [])} /></th><th>Data</th><th>Nome / empresa</th><th>Contato</th><th>Faturamento</th><th>Origem</th><th>Ação</th></tr></thead><tbody>{leads.map(lead => <tr key={lead.id}><td><input type="checkbox" aria-label={`Selecionar ${lead.name}`} checked={selected.includes(lead.id)} onChange={event => toggle(lead.id, event.target.checked)} /></td><td>{dateLabel(lead.createdAt)}</td><td><strong>{lead.name}</strong><br /><span>{lead.company}</span>{lead.message && <details><summary>Mensagem</summary><p>{lead.message}</p></details>}</td><td><a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">WhatsApp</a><br /><a href={`mailto:${lead.email}`}>{lead.email}</a></td><td>{lead.revenueBand}</td><td>{lead.utmSource || lead.source || "Direto"}</td><td><button className="danger-button" onClick={() => void remove([lead.id])}>Excluir</button></td></tr>)}</tbody></table>
      <div className="admin-mobile-cards">{leads.map(lead => <article className="admin-lead-card" key={lead.id}><label className="admin-select"><input type="checkbox" aria-label={`Selecionar ${lead.name}`} checked={selected.includes(lead.id)} onChange={event => toggle(lead.id, event.target.checked)} /> Selecionar</label><p><strong>{lead.name}</strong><br />{lead.company}</p><p><a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">WhatsApp</a> · <a href={`mailto:${lead.email}`}>{lead.email}</a></p><p><b>Faturamento:</b> {lead.revenueBand}<br /><b>Origem:</b> {lead.utmSource || lead.source || "Direto"}<br /><b>Recebido:</b> {dateLabel(lead.createdAt)}</p>{lead.message && <details><summary>Mensagem</summary><p>{lead.message}</p></details>}<button className="danger-button" onClick={() => void remove([lead.id])}>Excluir lead</button></article>)}</div>
      {!leads.length && !loading && <p className="admin-empty">Nenhum lead encontrado.</p>}</div>
    <div className="admin-pagination"><button className="ghost-cta" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</button><span>Página {page} de {pages}</span><button className="ghost-cta" disabled={page >= pages} onClick={() => setPage(value => value + 1)}>Próxima</button></div><p className="admin-config-note">Painel de gestão {siteConfig.brand}</p></section></main>;
}
