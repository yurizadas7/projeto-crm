(function () {
const { addDaysAt, todayAt } = window.NexoUtils;

window.NexoConfig = {
  stages: [
    { id: "novo", label: "Novo" },
    { id: "conversa", label: "Em conversa" },
    { id: "orcamento", label: "Orcamento enviado" },
    { id: "fechado", label: "Fechado" },
    { id: "perdido", label: "Perdido" }
  ],
  pageCopy: {
    funil: {
      title: "CRM simples para nao perder vendas no WhatsApp",
      subtitle: "Mostre como leads, propostas e retornos viram uma rotina comercial facil de acompanhar."
    },
    perfil: {
      title: "Perfil",
      subtitle: "Argumentos, beneficios e oferta sugerida para apresentar o produto."
    },
    comercial: {
      title: "Fluxo comercial para fechar o SaaS",
      subtitle: "Pitch, roteiro de demo, implantacao e argumento de mensalidade em uma unica tela."
    },
    clientes: {
      title: "Clientes",
      subtitle: "Base comercial com origem, prioridade, responsavel e valor de proposta."
    },
    lembretes: {
      title: "Lembretes",
      subtitle: "Retornos marcados e proximos passos de cada atendimento."
    },
    relatorios: {
      title: "Relatorios",
      subtitle: "Indicadores para mostrar oportunidade, conversao e potencial em vendas."
    },
    equipe: {
      title: "Equipe",
      subtitle: "Convites, papeis e permissoes simuladas para apresentar o SaaS."
    },
    configuracoes: {
      title: "Configuracoes",
      subtitle: "Dados do workspace, preferencias comerciais e status do ambiente."
    },
    planos: {
      title: "Planos",
      subtitle: "Limites, vantagens, manutencao e upgrade visual do SaaS."
    },
    assistente: {
      title: "Assistente",
      subtitle: "Sugestoes locais para atendimento, follow-up e uso do CRM."
    }
  },
  demoClients: [
    { id: 1, name: "Clara Andrade - Studio Glow", phone: "11984321002", service: "Pacote de CRM para estetica", source: "Instagram", priority: "Alta", owner: "Yurim", stage: "novo", value: 349.99, reminderAt: todayAt(15, 30), note: "Tem muitos pedidos no direct e perde retornos pelo WhatsApp.", tags: ["Lead quente", "Estetica"], history: ["Lead criado para demonstracao comercial.", "Dor principal: falta de controle dos retornos."] },
    { id: 2, name: "Clinica Bella Forma", phone: "11977118822", service: "Implantacao com treinamento", source: "Indicacao", priority: "Alta", owner: "Yurim", stage: "conversa", value: 899.90, reminderAt: todayAt(17, 0), note: "Dona pediu uma proposta para duas atendentes acompanharem os leads.", tags: ["Alto potencial", "Equipe"], history: ["Lead recebido por indicacao.", "Conversa em andamento com alto potencial de fechamento."] },
    { id: 3, name: "Rafael Lima - Oficina Prime", phone: "11966442210", service: "CRM para orcamentos de oficina", source: "WhatsApp", priority: "Media", owner: "Yurim", stage: "orcamento", value: 499.90, reminderAt: addDaysAt(1, 10, 0), note: "Aguardando aprovacao do socio para comecar ainda esta semana.", tags: ["Orcamento enviado", "Retornar"], history: ["Orcamento enviado.", "Aguardando aprovacao interna."] },
    { id: 4, name: "Studio Mares Pilates", phone: "11955221908", service: "Organizacao de leads e retornos", source: "WhatsApp", priority: "Alta", owner: "Yurim", stage: "conversa", value: 599.90, reminderAt: todayAt(11, 40), note: "Recebe contatos pelo WhatsApp e quer saber quem precisa de retorno.", tags: ["WhatsApp", "Urgente"], history: ["Cliente relatou demora nos retornos.", "Necessidade clara de organizacao."] },
    { id: 5, name: "Ana Paula - Boutique Donna", phone: "11922334455", service: "Plano mensal de acompanhamento", source: "Instagram", priority: "Media", owner: "Yurim", stage: "fechado", value: 349.99, reminderAt: "", note: "Fechou primeira mensalidade apos ver a demo do funil.", tags: ["Fechado", "Pix"], history: ["Cliente fechada.", "Pagamento realizado por Pix."] },
    { id: 6, name: "Oficina Central", phone: "11988776655", service: "Controle de orcamentos no WhatsApp", source: "Indicacao", priority: "Alta", owner: "Yurim", stage: "novo", value: 449.90, reminderAt: todayAt(14, 10), note: "Recebe muitos contatos e nao sabe quais propostas estao abertas.", tags: ["Dor clara", "Orcamentos"], history: ["Novo lead cadastrado.", "Dor principal: perda de propostas."] },
    { id: 7, name: "Loja Vitrine Modas", phone: "11977889900", service: "CRM simples para loja", source: "Site", priority: "Baixa", owner: "Yurim", stage: "perdido", value: 299.90, reminderAt: "", note: "Preferiu avaliar no proximo mes, mas pediu contato futuro.", tags: ["Perdido", "Reativar"], history: ["Cliente recusou por enquanto.", "Pode voltar no proximo mes."] }
  ],
  planRules: {
    "Plano inicial": {
      name: "Plano inicial",
      price: "R$ 97/mes",
      users: 2,
      leads: 100,
      support: "WhatsApp em horario comercial",
      maintenance: "Corretiva",
      features: ["Funil simples", "Lembretes", "Exportacao basica", "1 workspace"]
    },
    "Plano profissional": {
      name: "Plano profissional",
      price: "R$ 197/mes",
      users: 10,
      leads: 2000,
      support: "Suporte prioritario",
      maintenance: "Corretiva + preventiva",
      features: ["Equipe com permissoes", "Relatorios", "Templates de WhatsApp", "Preferencias comerciais"]
    },
    "Plano premium": {
      name: "Plano premium",
      price: "Sob consulta",
      users: Infinity,
      leads: Infinity,
      support: "Atendimento prioritario",
      maintenance: "Corretiva + preventiva + evolutiva",
      features: ["Usuarios ilimitados", "Personalizacao", "Treinamento", "Integracoes futuras"]
    }
  },
  planOrder: ["Plano inicial", "Plano profissional", "Plano premium"],
  rolePermissions: {
    Admin: {
      deleteClient: true,
      exportClients: true,
      reloadDemo: true,
      manageTeam: true,
      viewReports: true,
      editSettings: true
    },
    Gestor: {
      deleteClient: false,
      exportClients: true,
      reloadDemo: true,
      manageTeam: false,
      viewReports: true,
      editSettings: true
    },
    Atendente: {
      deleteClient: false,
      exportClients: false,
      reloadDemo: false,
      manageTeam: false,
      viewReports: false,
      editSettings: false
    }
  }
};
})();
