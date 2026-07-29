export interface HelpTopic {
  id: string;
  title: string;
  /** Prefixos de rota que mostram este tópico no painel de ajuda contextual. */
  routes: string[];
  /** Quem normalmente usa esta tela, pra orientar o texto. */
  audience: string;
  tips: string[];
}

export const helpTopics: HelpTopic[] = [
  {
    id: "agenda",
    title: "Agenda",
    routes: ["/"],
    audience: "Recepção e profissionais",
    tips: [
      "Clique num horário vazio do calendário pra criar um agendamento já com profissional e horário preenchidos.",
      "Clique num agendamento existente pra editar horário, profissional ou serviço.",
      "As áreas riscadas na coluna do profissional são bloqueios (almoço, compromisso externo) — não aceitam agendamento por cima.",
      "Overbooking só é permitido marcando a opção explicitamente no formulário — por padrão o sistema impede dois agendamentos no mesmo horário.",
    ],
  },
  {
    id: "atendimentos",
    title: "Atendimentos",
    routes: ["/atendimentos"],
    audience: "Profissionais e recepção",
    tips: [
      "Um atendimento nasce a partir de um agendamento confirmado e acompanha o cliente do check-in até o fim do serviço.",
      "Finalize o atendimento pra liberar a venda associada pro checkout.",
    ],
  },
  {
    id: "vendas",
    title: "Vendas",
    routes: ["/vendas"],
    audience: "Recepção e caixa",
    tips: [
      "Uma venda reúne serviços e produtos consumidos por um atendimento antes de ir pro checkout.",
      "Serviços de venda avulsa (sem agendamento prévio) também podem ser lançados direto aqui.",
    ],
  },
  {
    id: "pagamentos",
    title: "Pagamentos",
    routes: ["/pagamentos"],
    audience: "Caixa e gerência",
    tips: [
      "Pagamento a prazo (\"Deferred\") só fica disponível se estiver habilitado em Configurações → Negócio.",
      "A liberação de comissão pode depender do pagamento estar efetivamente quitado — isso é configurável em Configurações.",
    ],
  },
  {
    id: "caixa",
    title: "Caixa",
    routes: ["/caixa"],
    audience: "Recepção e gerência",
    tips: [
      "Abra o caixa no início do turno com o saldo inicial em dinheiro.",
      "Feche o caixa ao final do turno pra conferir o saldo esperado contra o valor contado.",
    ],
  },
  {
    id: "comissoes",
    title: "Comissões e repasses",
    routes: ["/comissoes", "/minhas-comissoes"],
    audience: "Gerência (visão geral) e profissionais (extrato próprio)",
    tips: [
      "Comissão \"Pendente\" ainda não atingiu o critério de liberação configurado; \"Liberada\" já pode ser repassada.",
      "Quando uma comissão é liberada, o sistema já cria um repasse pendente na seção \"Repasses aos profissionais\" — hoje o pagamento em si é feito manualmente (Pix) e marcado como pago ali.",
      "Profissionais só enxergam o próprio extrato em \"Minhas Comissões\", nunca o de outros colegas.",
    ],
  },
  {
    id: "estoque",
    title: "Estoque",
    routes: ["/estoque"],
    audience: "Gerência e profissionais que usam insumos",
    tips: [
      "Entrada aumenta o estoque; saída (venda ou uso interno) reduz; ajuste corrige uma divergência de contagem (pode ser negativo).",
      "Se o insumo tem uma unidade operacional (ex.: frasco) além da unidade base (ex.: ml), o sistema converte automaticamente ao registrar o movimento.",
      "O alerta de estoque baixo aparece quando a quantidade atual fica igual ou menor que o mínimo configurado no insumo.",
    ],
  },
  {
    id: "produtos",
    title: "Produtos",
    routes: ["/produtos"],
    audience: "Gerência",
    tips: ["Produtos aqui são itens de venda avulsa pro cliente (ex.: shampoo) — não confundir com insumos internos, que ficam em Estoque."],
  },
  {
    id: "fiscal",
    title: "Documentos Fiscais",
    routes: ["/fiscal"],
    audience: "Gerência",
    tips: [
      "Todo documento nasce em rascunho e avança conforme o provedor fiscal configurado processa a emissão.",
      "Sem provedor real configurado, o documento fica em rascunho — isso é esperado até a integração fiscal (Focus NFe) entrar em produção.",
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    routes: ["/whatsapp"],
    audience: "Gerência",
    tips: [
      "Sem credencial do Meta Cloud API configurada, as mensagens ficam com status \"Pulada\" — é o comportamento esperado em modo de teste.",
      "Assim que as credenciais forem configuradas, é possível reenviar qualquer mensagem pulada ou que falhou direto por essa tela.",
    ],
  },
  {
    id: "clientes",
    title: "Clientes",
    routes: ["/clientes"],
    audience: "Recepção",
    tips: ["Clientes vindos do agendamento online já entram cadastrados automaticamente, combinados por telefone."],
  },
  {
    id: "profissionais",
    title: "Profissionais",
    routes: ["/profissionais"],
    audience: "Gerência",
    tips: [
      "Configure o percentual de comissão de cada profissional aqui — sem isso, o sistema não consegue calcular a comissão da venda.",
      "A chave Pix cadastrada aqui é usada como referência pro repasse manual até a integração automática de split de pagamento entrar no ar.",
    ],
  },
  {
    id: "servicos",
    title: "Serviços",
    routes: ["/servicos"],
    audience: "Gerência",
    tips: ["Marque \"disponível online\" pra um serviço aparecer no widget público de agendamento."],
  },
  {
    id: "lgpd",
    title: "LGPD",
    routes: ["/lgpd", "/privacidade", "/termos-de-uso"],
    audience: "Gerência",
    tips: [
      "Solicitações chegam pelo canal público de agendamento, quando o cliente pede acesso, correção, portabilidade, exclusão ou revogação de consentimento.",
      "Marque como \"Resolvida\" só depois de efetivamente atender o pedido — o registro fica no histórico como comprovação.",
    ],
  },
  {
    id: "configuracoes",
    title: "Configurações",
    routes: ["/configuracoes"],
    audience: "Gerência",
    tips: [
      "\"Liberar comissão com pagamento a prazo\" é o parâmetro que decide se uma venda parcelada já libera a comissão ou se precisa esperar a quitação.",
    ],
  },
  {
    id: "painel",
    title: "Painel",
    routes: ["/painel"],
    audience: "Gerência e dono",
    tips: [
      "O guia de início rápido (quando aparece) mostra o que falta configurar pro estabelecimento operar — ele desaparece sozinho quando tudo estiver pronto.",
      "Os números do dia consideram apenas vendas concluídas e pagamentos efetivamente pagos hoje.",
    ],
  },
];

export const GENERAL_HELP_TIP =
  "Não achou o que precisava? Veja todos os tópicos na Central de Ajuda ou fale com quem administra o sistema no seu estabelecimento.";

export function findHelpTopicForPath(pathname: string): HelpTopic | null {
  const matches = helpTopics.filter((topic) =>
    topic.routes.some((route) => (route === "/" ? pathname === "/" : pathname.startsWith(route))),
  );

  if (matches.length === 0) return null;

  return matches.sort((a, b) => {
    const aLen = Math.max(...a.routes.map((r) => r.length));
    const bLen = Math.max(...b.routes.map((r) => r.length));
    return bLen - aLen;
  })[0];
}
