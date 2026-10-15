# Plano técnico e direção visual — SPWeb

## Objetivo e escopo
Criar um site B2B de conversão em pt-BR para a SPWeb, com landing cinematográfica inspirada em navegação por fileiras premium, captação persistente e painel privado. O projeto gerenciado foi inicializado com servidor e MySQL; este starter é React 19/Vite, Express/Node, TypeScript, Drizzle e Wouter, não Next.js. Mantemos a stack suportada e renderizamos o HTML inicial por rota no servidor, tanto com middleware Vite em desenvolvimento como no servidor compilado. Não inventar depoimentos, resultados, dados oficiais ou notas Lighthouse. A publicação ampla permanece fora deste ciclo sem autorização explícita.

## Arquitetura e responsabilidades
- `client/src/pages/Home.tsx`: landing semântica; calculadora em BRL, trilhos CSS scroll-snap, CTA para `#contato`, formulário POST nativo, confiança/copy fornecidas e placeholders explícitos.
- `client/src/pages/Legal.tsx`, `ThankYou.tsx`, `Admin.tsx`: documentos LGPD/termos/cookies, confirmação com WhatsApp configurável e administração autenticada, respectivamente.
- `client/src/components/CookieBanner.tsx`: escolha essencial/estatística/marketing; nenhum pixel externo antes de consentimento; revogação, eventos de conversão e IDs opcionais.
- `client/src/lib/config.ts` e `content.ts`: ponto central editável para marca, dados cadastrais preliminares, contatos, pixels, metadados, textos, FAQs, listas, etapas, entregáveis e textos legais.
- `client/src/index.css`: tokens dark, tipografia Sora/Montserrat self-hosted, layout responsivo, foco/reduced-motion e estados de UI. `client/public/`: fontes/licenças, favicon, manifesto, robots, `llms.txt`, imagem social e assets gerados servidos pelo storage gerenciado.
- `server/site-render.ts`: rotas conhecidas, renderização `renderToString`, title/description/robots/canonical condicionado à origem real, Open Graph/Twitter e JSON-LD. `server/_core/vite.ts`: SSR em Preview e renderização de produção com cache HTML revalidável e bundles com hash imutáveis.
- `server/spweb-routes.ts`: POST lead, cookies assinados, anti-spam e rate limits; sessão, login, CSRF, pesquisa/filtros, CSV, exclusão, robots e sitemap. `server/db.ts` encapsula consultas Drizzle.
- `drizzle/schema.ts` e migrations SQL: tabelas aditivas para leads, sessões administrativas e buckets de rate limit com chaves HMAC e expiração; o MySQL gerenciado é compartilhado entre dev e produção, portanto não submeter leads falsos nem apagar registros para testar.
- `client/public/manus-routes.json`: manifesto somente de páginas. `plan.md`/`TODO.md`: arquitetura e critérios originais do pedido.

## Fluxo de implementação e decisões
1. Preservar o starter e implementar a marca, conteúdo, componentes e estilos pedidos; usar as fotos cinematográficas originais já geradas e fontes locais licenciadas, sem substituir imagens por stock genérico.
2. Entregar as páginas públicas com conteúdo no HTML inicial e sem depender de JavaScript para leitura; React ativa as interações. Manter /admgerencia e /obrigado fora de indexação e protegidos conforme o fluxo do projeto.
3. Implementar persistência tipada via MySQL, validação Zod no cliente/servidor aplicável, POST sem JS com 303, consentimento, hash de IP, sessão opaca assinada, proteção CSRF e limites definidos no briefing. Credenciais chegam somente pelo input seguro do projeto; verificar o estado da solicitação existente, sem abrir cartões duplicados.
4. Renderizar structured data apenas onde cabe; não emitir canonical, og:image nem URL de site até `PUBLIC_SITE_URL`/`publicOrigin` representar um domínio real e controlado. Manter sitemap limitado à landing e às três legais.
5. Validar tipo, build, rotas, manifesto, status/cabeçalhos, tamanho inicial de JS e resposta do Preview. Não usar a base compartilhada para gerar lead de teste ou executar exclusões. Fazer auditoria de implementação read-only ao final.

## Direção de design
- **Movimento:** billboard cinematográfico e trilhos laterais de conteúdo premium, inspirados no padrão Netflix sem copiar marca ou ativos.
- **Princípios:** promessa e CTA compreensíveis em uma dobra; evidência visual sem alegação factual; navegação em fileiras com scroll-snap; foco acessível e baixa dependência de JavaScript.
- **Cor:** navy quase preto e azul profundo dão foco e confiança; o gradiente verde assina ações/resultado positivo; amarelo identifica números, atenção, logotipo e foco.
- **Layout:** full-bleed no hero, leitura vertical com fileiras deslizáveis e comparação lado a lado; mobile empilha sem cortar conteúdo; máx. 1200px e ritmo vertical generoso.
- **Assinaturas:** wordmark SP/Web com losango amarelo; extrato translúcido com divisórias pontilhadas; números de Top 10 vazados em amarelo.
- **Interações:** CTA de conversão conduz ao formulário, carrosséis nativos por swipe/teclado, FAQ `<details>`, calculadora BRL com `aria-live`, cookies personalizáveis/revogáveis.
- **Animação:** entrada escalonada do hero/extrato e reveal único por IntersectionObserver; somente `transform`/`opacity`; `prefers-reduced-motion` reduz animação.
- **Tipografia:** Sora 700 nas headlines e Montserrat nos textos/UI, ambas hospedadas localmente; todas H1/H2 recebem o mesmo `clamp(1.75rem, 1.25rem + 1.6vw, 2.5rem)`, line-height 1.15 e tracking -0.02em; H3 1.25rem/Sora 600.
- **Essência/voz:** infraestrutura para PMEs que faturam mas querem reter lucro; direta, analítica e honesta. Exemplos: “Sua empresa pode lucrar mais sem precisar vender mais.” e “O lucro não sumiu. Ele está vazando por dentro.”
- **Marca:** SP claro, Web em gradiente verde e losango amarelo; favicon SVG coordenado. Cor verde SPWeb: `#16A34A`.

## Limitações e pendências operacionais
- A confirmação cadastral oficial da Receita não foi obtida; `legalName`, endereço e CEP são apresentados como dados preliminares, nunca como verificados. Confirmar no comprovante antes de produção.
- Dados que o controlador precisa fornecer/confirmar: WhatsApp, e-mails de contato/DPO/notificação, IDs GA4/Meta, dois depoimentos reais, garantia real, razão social/endereço oficial, política/prazo de retenção e origem pública do site.
- O login usa `ADMIN_EMAIL` e `ADMIN_PASSWORD_HASH` protegidos; se o hash não estiver em bcrypt válido, o campo protegido `ADMIN_PASSWORD` é convertido a bcrypt (custo 12) em memória e removido de `process.env` após derivação. O token é opaco, assinado e persistido somente por hash.
- A plataforma não oferece envio de e-mail ao consumidor sem provedor específico; notificação a `ADMIN_NOTIFY_EMAIL` depende de provedor que ainda não foi configurado.
- Não publicar para audiência ampla neste ciclo. Relatar apenas medições realmente realizadas; Lighthouse 100 não é presumido.

## Fontes cadastrais consultadas (15/10/2026)
- BrasilAPI: https://brasilapi.com.br/api/cnpj/v1/47671866000198 — retorno de razão social, município/UF e CEP; não confirmou rua/número no resultado observado.
- ReceitaWS: https://receitaws.com.br/v1/cnpj/47671866000198 — fonte terceirizada/não oficial, usada somente como indicação preliminar de endereço/contato.
- Receita Federal: https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/ — portal oficial consultado, mas sem comprovante autenticado/preenchido obtido neste fluxo. Dados aguardam validação oficial.
