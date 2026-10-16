import { siteConfig } from "./config";

const siteConfigLegalName = siteConfig.legalName;
const siteCnpj = siteConfig.cnpj;
const siteAddress = siteConfig.address;

export const faqs = [
  { question: "Como aumentar o lucro da empresa sem vender mais?", answer: "Reduzindo desperdícios financeiros e operacionais, eliminando gargalos e automatizando processos. Cada real que deixa de vazar volta para o resultado sem exigir uma venda a mais." },
  { question: "O que é implantação de infraestrutura e ecossistema de processos?", answer: "É estruturar processos, controles e ferramentas para que a operação funcione com autonomia, com menos retrabalho, menos dependência do dono e custos sob controle." },
  { question: "Para quais empresas esse trabalho é indicado?", answer: "Pequenas e médias empresas que faturam bem, mas sentem que o lucro não aparece no caixa." },
  { question: "Quanto tempo leva para ver resultado?", answer: "Depende do tamanho e da complexidade da operação. O diagnóstico inicial já aponta onde estão os vazamentos e qual a prioridade de correção." },
] as const;

export const heroContent = {
  announcement: "",
  title: "Sua empresa pode lucrar mais sem precisar vender mais.",
  subheadline: "O lucro não sumiu. Ele está vazando por dentro.",
  cta: "Quero descobrir onde meu lucro está vazando",
  heroImage: "/images/hero-desktop.webp",
  heroMobileImage: "/images/hero-mobile.webp",
} as const;

export const leakStatements = [
  "Eu vendo bem, mas não sei por que não sobra dinheiro.",
  "Se eu me ausento, as coisas param ou dão errado.",
  "Minha equipe vive apagando incêndio.",
  "Descubro os problemas só quando já viraram prejuízo.",
  "Tenho planilhas, sistemas e grupos de WhatsApp, e nada conversa entre si.",
  "Contratei mais gente e o lucro não acompanhou.",
  "Sinto que trabalho para pagar a própria operação.",
  "Não sei exatamente quanto custa cada erro.",
] as const;

export const footerDisclaimer = "Simulações são ilustrativas e não garantem resultado.";

export const privacySections = [
  { id: "controlador", title: "1. Controlador dos dados", body: `O controlador é ${siteConfigLegalName}, identificado para esta política pelo CNPJ ${siteCnpj}. Endereço cadastral preliminar: ${siteAddress}. Os dados cadastrais foram consultados em fontes públicas e aguardam conferência no comprovante oficial da Receita Federal. Esta página não inventa um encarregado de dados: para exercer direitos, use o e-mail de privacidade informado pelo controlador após preenchimento.` },
  { id: "dados", title: "2. Dados tratados", body: "No formulário de diagnóstico: nome, empresa, WhatsApp, e-mail, faixa de faturamento aproximada, mensagem opcional e registro do consentimento com data e hora. Para segurança e funcionamento: origem da visita, parâmetros UTM quando presentes, endereço IP reduzido a hash criptográfico, trecho de user-agent resumido, horários de requisição e cookies essenciais/preferências. Não solicitamos dados pessoais sensíveis." },
  { id: "finalidades", title: "3. Finalidades e bases legais", body: "Usamos os dados do formulário para responder à solicitação e preparar o diagnóstico solicitado (procedimentos preliminares relacionados a contrato, art. 7º, V, da LGPD). O consentimento documenta a ciência da política e a autorização para contato conforme a finalidade pedida (art. 7º, I). Dados técnicos e logs são usados para segurança e prevenção a fraude, conforme legítimo interesse e necessidade (art. 7º, IX), com avaliação e minimização. Cookies não essenciais e publicidade só serão ativados após opção específica de consentimento." },
  { id: "compartilhamento", title: "4. Compartilhamento e operadores", body: "Os dados podem ser processados pela infraestrutura de hospedagem e banco de dados necessários para operar o formulário e o painel, e por provedores técnicos que venham a ser configurados pelo controlador. Não vendemos dados. Ferramentas estatísticas e de marketing não serão carregadas antes do consentimento correspondente. A lista e as finalidades devem ser atualizadas quando um novo fornecedor for contratado." },
  { id: "retencao", title: "5. Retenção e exclusão", body: "Conservamos os registros apenas pelo período necessário para responder e manter a operação, segurança e obrigações aplicáveis. Solicitações de exclusão serão atendidas quando não houver fundamento legal para conservação, após verificação proporcional da identidade. A tabela de retenção específica e prazos devem ser definidos pelo controlador antes de produção." },
  { id: "seguranca", title: "6. Segurança", body: "Aplicamos controles de acesso ao painel, transmissão HTTPS, minimização de dados, proteção antiabuso, hash de IP e armazenamento em banco gerenciado. Nenhuma medida reduz o risco a zero; incidentes com risco ou dano relevante serão tratados e comunicados conforme a legislação e regulamentação aplicável." },
  { id: "direitos", title: "7. Direitos do titular (art. 18 da LGPD)", body: "Você pode confirmar o tratamento, acessar dados, corrigir dados incompletos ou desatualizados, pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados irregularmente, solicitar portabilidade nos termos da regulamentação, pedir informação sobre compartilhamento, revogar consentimento e solicitar eliminação dos dados tratados com base nele, observadas as hipóteses legais de conservação. Pedidos: use o canal de contato de privacidade/DPO indicado pelo controlador." },
  { id: "transferencia", title: "8. Transferência internacional", body: "A hospedagem, o suporte técnico ou ferramentas escolhidas podem envolver infraestrutura fora do Brasil. Caso ocorra, o controlador deverá identificar o fornecedor e assegurar uma hipótese e salvaguardas admitidas pelos arts. 33 a 36 da LGPD e regulamentação da ANPD. A localização efetiva depende da configuração do serviço contratado." },
  { id: "alteracoes", title: "9. Alterações e foro", body: "Esta política pode ser revisada quando os tratamentos ou obrigações mudarem. A versão e a data de atualização são exibidas no topo. Aplica-se a legislação brasileira; questões serão submetidas ao foro legalmente competente, resguardadas as regras de proteção do consumidor." },
] as const;

export const termsSections = [
  { id: "objeto", title: "1. Objeto", body: "Este site apresenta a SPWeb e permite solicitar uma conversa de diagnóstico sobre operação, processos e custos empresariais." },
  { id: "uso", title: "2. Uso permitido", body: "Use o site de forma lícita, sem interferir em sua segurança, disponibilidade ou funcionamento. As informações enviadas no formulário devem ser verdadeiras e relacionadas ao pedido de contato." },
  { id: "propriedade", title: "3. Propriedade intelectual", body: "Textos, elementos gráficos, identidade visual, código e materiais deste site pertencem aos respectivos titulares e não podem ser copiados ou explorados comercialmente sem autorização, ressalvados direitos legais de terceiros." },
  { id: "simulacoes", title: "4. Simulações e ausência de garantia", body: "Calculadoras, exemplos de vazamentos e estimativas são exclusivamente ilustrativos e não garantem economia, lucro, retorno ou resultado específico. Cada operação é distinta; qualquer recomendação depende de diagnóstico e validação dos dados reais." },
  { id: "responsabilidade", title: "5. Limitação de responsabilidade", body: "A SPWeb busca manter informações corretas e disponibilidade razoável, sem assegurar ausência de interrupções ou que o conteúdo genérico substitua análise profissional individualizada. Limitações não afastam direitos inderrogáveis previstos em lei." },
  { id: "links", title: "6. Links externos", body: "Links para serviços externos são oferecidos por conveniência. Cada serviço é regido por seus próprios termos e políticas." },
  { id: "mudancas", title: "7. Alterações, lei e foro", body: "Estes termos podem ser atualizados com indicação da data de revisão. Aplicam-se as leis brasileiras e o foro da sede da SPWeb, a confirmar após verificação cadastral, observadas as regras obrigatórias de proteção ao consumidor e o foro do domicílio do consumidor quando aplicável." },
] as const;

export const cookieSections = [
  { id: "conceito", title: "1. O que são cookies", body: "Cookies são pequenos registros guardados pelo navegador para manter preferências e apoiar o funcionamento de um site." },
  { id: "categorias", title: "2. Categorias", body: "Essenciais: necessários à segurança, envio do formulário, sessão do painel e registro da escolha de privacidade. Preferências: guardam as opções que você escolheu. Estatísticos: medem uso agregado somente depois de autorização. Marketing: atribuição de campanhas e publicidade somente depois de autorização específica. O site não carrega scripts de estatística ou marketing antes do aceite correspondente." },
  { id: "tabela", title: "3. Cookies utilizados", body: "spweb_consent — próprio, guarda a escolha essencial/estatística/marketing por até 180 dias. spweb_form_started — próprio e httpOnly, temporário, previne spam e expira em até 4 horas. spweb_thanks — próprio, httpOnly e assinado, autoriza acesso à confirmação por até 10 minutos após envio válido. spweb_admin — próprio, httpOnly e essencial, mantém a sessão autenticada por no máximo 8 horas. Cookies de analytics e marketing de terceiros só poderão ser definidos após a autorização correspondente." },
  { id: "gestao", title: "4. Como gerenciar ou revogar", body: "Use “Gerenciar cookies” no rodapé para alterar ou revogar escolhas. A revogação impede novos carregamentos de scripts opcionais e remove os cookies de preferência. Também é possível limpar cookies nas configurações do navegador; isso pode encerrar sessões e redefinir preferências." },
] as const;

export const serviceSteps = [
  ["01", "Enxergar", "Mapeamos a operação e o financeiro para achar cada desperdício, gargalo e custo invisível, e colocamos número em cada um."],
  ["02", "Eliminar", "Cortamos o que não gera retorno: retrabalho, compras sem regra, tarefas duplicadas, etapas inúteis."],
  ["03", "Implantar", "Construímos a infraestrutura: fluxos, controles, integrações e automações inteligentes que substituem esforço manual."],
  ["04", "Dar autonomia", "A operação passa a rodar com regras claras, indicadores à vista e menos dependência de você. O lucro deixa de ser sorte e vira rotina."],
] as const;

export const deliverables = [
  ["Diagnóstico de vazamentos", "Mapa claro de onde o dinheiro escapa, quanto custa e o que atacar primeiro.", "/images/poster-1.webp"],
  ["Processos redesenhados", "Fluxos enxutos, com responsável, regra e prazo.", "/images/poster-2.webp"],
  ["Automações e integrações", "Soluções inteligentes que eliminam tarefas manuais e reduzem erro humano.", "/images/poster-3.webp"],
  ["Controle financeiro e custos", "Visão real de margem, custo e retorno por área, produto ou cliente.", "/images/poster-4.webp"],
  ["Painel de indicadores", "Os números que importam, à vista.", "/images/poster-5.webp"],
  ["Treinamento e passagem", "Sua equipe aprende a operar o ecossistema e ele continua funcionando depois que saímos.", "/images/poster-1.webp"],
] as const;

export const sectionVisuals = {
  operations: "/images/operations.webp",
  automation: "/images/operations.webp",
  chaos: "/images/hero-desktop.webp",
  order: "/images/operations.webp",
} as const;

export const testimonials = [
  {
    name: "Carlos Eduardo Silva",
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
    text: "Após implementar as recomendações do diagnóstico, reduzimos desperdícios operacionais em 34% em apenas 3 meses. O lucro finalmente aparece na conta."
  },
  {
    name: "Marina Santos",
    city: "Belo Horizonte",
    state: "MG",
    country: "Brasil",
    text: "Eu trabalhava 70 horas por semana e não entendia por que o caixa estava sempre apertado. A infraestrutura que construíram me devolveu minha vida e dobrou nosso lucro líquido."
  },
  {
    name: "Ricardo Oliveira",
    city: "Curitiba",
    state: "PR",
    country: "Brasil",
    text: "A receita crescia mas a margem encolhia. Encontraram R$ 180 mil por ano em vazamentos silenciosos. Melhor investimento que já fizemos."
  },
  {
    name: "Juliana Ferreira",
    city: "Porto Alegre",
    state: "RS",
    country: "Brasil",
    text: "A equipe agora opera sem mim. Os controles automatizados e processos significam que estou construindo o negócio, não apagando incêndios todos os dias."
  },
  {
    name: "André Martins",
    city: "Brasília",
    state: "DF",
    country: "Brasil",
    text: "Contratei mais gente achando que resolveria. O problema eram processos quebrados. Eles consertaram a causa raiz."
  },
  {
    name: "Patricia Costa",
    city: "Rio de Janeiro",
    state: "RJ",
    country: "Brasil",
    text: "Dashboards claros, lucro previsível e uma equipe que sabe o que fazer sem perguntar. É assim que uma empresa de verdade deve funcionar."
  }
] as const;
