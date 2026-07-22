window.balcaoConfig = {
  businessName: 'Seu restaurante',
  bannerLabel: 'Template operacional',
  subtitle: 'Painel operacional genérico para consumo no local, retirada e atendimento rápido.',
  serviceTitle: 'Atendimento no balcão',
  filters: [
    { id: 'todos', label: 'Todos' },
    { id: 'pratos', label: 'Pratos' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'adicionais', label: 'Adicionais' }
  ],
  catalog: [
    {
      id: 1,
      name: 'Prato Especial do Dia',
      category: 'pratos',
      tag: 'Especial',
      description: 'Opção principal para adaptar ao cardápio real.',
      price: 38.9
    },
    {
      id: 2,
      name: 'Refeição Clássica',
      category: 'pratos',
      tag: 'Mais pedido',
      description: 'Base pronta para o menu do seu cliente.',
      price: 52.9
    },
    {
      id: 3,
      name: 'Combo Executivo',
      category: 'pratos',
      tag: 'Popular',
      description: 'Formato simples para atendimento rápido.',
      price: 49.9
    },
    {
      id: 4,
      name: 'Refrigerante 2L',
      category: 'bebidas',
      tag: 'Bebida',
      description: 'Canal de venda simples para o balcão.',
      price: 12
    },
    {
      id: 5,
      name: 'Água Mineral',
      category: 'bebidas',
      tag: 'Bebida',
      description: 'Item funcional para composição do pedido.',
      price: 10
    },
    {
      id: 6,
      name: 'Sobremesa Premium',
      category: 'sobremesas',
      tag: 'Doces',
      description: 'Texto genérico para trocar no projeto real.',
      price: 14
    },
    {
      id: 7,
      name: 'Adicional de Brinde',
      category: 'adicionais',
      tag: 'Adicional',
      description: 'Estrutura simples para customização posterior.',
      price: 8
    },
    {
      id: 8,
      name: 'Acompanhamento Extra',
      category: 'adicionais',
      tag: 'Acompanhamento',
      description: 'Item genérico pronto para adaptação.',
      price: 18
    }
  ],
  paymentMethods: [
    { id: 'dinheiro', label: 'Dinheiro' },
    { id: 'pix', label: 'Pix' },
    { id: 'cartao', label: 'Cartão' }
  ],
  defaultPayment: 'dinheiro',
  defaultMesa: 'Mesa 01',
  tableList: [
    { mesa: 'Mesa 01', status: 'livre' },
    { mesa: 'Mesa 02', status: 'ocupada' },
    { mesa: 'Mesa 03', status: 'livre' },
    { mesa: 'Mesa 04', status: 'ocupada' },
    { mesa: 'Mesa 05', status: 'livre' },
    { mesa: 'Mesa 06', status: 'ocupada' }
  ]
};
