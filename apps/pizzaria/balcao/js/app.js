(function () {
  const businessConfig = window.balcaoConfig || {
    businessName: 'Seu restaurante',
    bannerLabel: 'Template operacional',
    serviceTitle: 'Atendimento no balcão',
    subtitle: 'Painel operacional genérico para consumo no local, retirada e atendimento rápido.',
    filters: [
      { id: 'todos', label: 'Todos' },
      { id: 'pratos', label: 'Pratos' },
      { id: 'bebidas', label: 'Bebidas' },
      { id: 'sobremesas', label: 'Sobremesas' },
      { id: 'adicionais', label: 'Adicionais' }
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
    ],
    catalog: []
  };

  const STORAGE_KEYS = {
    cart: 'balcaoCartState',
    history: 'balcaoHistoryState',
    tables: 'balcaoTableState',
    comanda: 'balcaoComandaState',
    payment: 'balcaoPaymentState'
  };

  const catalogData = Array.isArray(businessConfig.catalog) ? businessConfig.catalog : [];
  const defaultTables = Array.isArray(businessConfig.tableList) ? businessConfig.tableList : [];

  const cart = loadState(STORAGE_KEYS.cart, []);
  const commandHistory = loadState(STORAGE_KEYS.history, []);
  let tableState = loadState(STORAGE_KEYS.tables, defaultTables);
  let activeFilter = 'todos';
  let activePayment = loadState(STORAGE_KEYS.payment, businessConfig.defaultPayment || 'dinheiro');
  let comanda = Number(loadState(STORAGE_KEYS.comanda, 104));

  const catalogGrid = document.getElementById('catalogGrid');
  const buscaProduto = document.getElementById('buscaProduto');
  const listaPedido = document.getElementById('listaPedido');
  const subtotalPedido = document.getElementById('subtotalPedido');
  const taxaPedido = document.getElementById('taxaPedido');
  const totalPedido = document.getElementById('totalPedido');
  const mensagemPedido = document.getElementById('mensagemPedido');
  const nomeCliente = document.getElementById('nomeCliente');
  const nomeAtendente = document.getElementById('nomeAtendente');
  const mesaPedido = document.getElementById('mesaPedido');
  const tipoAtendimento = document.getElementById('tipoAtendimento');
  const observacaoPedido = document.getElementById('observacaoPedido');
  const comandaNumero = document.getElementById('comandaNumero');
  const itensCount = document.getElementById('itensCount');
  const statusPedido = document.getElementById('statusPedido');
  const mesasPanel = document.getElementById('mesasPanel');
  const comandasRecentes = document.getElementById('comandasRecentes');
  const mesasOcupadasCount = document.getElementById('mesasOcupadasCount');
  const pedidosAtivosCount = document.getElementById('pedidosAtivosCount');
  const filterPills = document.getElementById('filterPills');
  const businessLabel = document.getElementById('businessLabel');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');

  function money(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function loadState(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return JSON.parse(JSON.stringify(fallback));
      return JSON.parse(raw);
    } catch (error) {
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  function saveState(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function applyBusinessConfig() {
    businessLabel.textContent = businessConfig.bannerLabel || 'Template operacional';
    pageTitle.textContent = businessConfig.serviceTitle || 'Atendimento no balcão';
    pageSubtitle.textContent = businessConfig.subtitle || 'Painel operacional genérico para consumo no local, retirada e atendimento rápido.';

    if (Array.isArray(businessConfig.filters) && businessConfig.filters.length) {
      filterPills.innerHTML = businessConfig.filters.map((filter) => `
        <button type="button" class="pill ${filter.id === activeFilter ? 'active' : ''}" data-filter="${filter.id}">${filter.label}</button>
      `).join('');

      filterPills.querySelectorAll('[data-filter]').forEach((button) => {
        button.addEventListener('click', () => {
          activeFilter = button.dataset.filter;
          renderFilterButtons();
          renderCatalog();
        });
      });
    }

    if (Array.isArray(businessConfig.paymentMethods) && businessConfig.paymentMethods.length) {
      document.querySelector('.payment-grid').innerHTML = businessConfig.paymentMethods.map((method) => `
        <button type="button" class="btn btn-pay ${method.id === activePayment ? 'active' : ''}" data-payment="${method.id}">${method.label}</button>
      `).join('');

      document.querySelectorAll('[data-payment]').forEach((button) => {
        button.addEventListener('click', () => {
          activePayment = button.dataset.payment;
          saveState(STORAGE_KEYS.payment, activePayment);
          document.querySelectorAll('[data-payment]').forEach((item) => item.classList.remove('active'));
          button.classList.add('active');
        });
      });
    }

    if (businessConfig.defaultMesa && mesaPedido) {
      mesaPedido.value = businessConfig.defaultMesa;
    }
  }

  function renderFilterButtons() {
    if (!filterPills || !Array.isArray(businessConfig.filters) || !businessConfig.filters.length) return;
    filterPills.querySelectorAll('[data-filter]').forEach((button) => {
      button.classList.toggle('active', button.dataset.filter === activeFilter);
    });
  }

  function renderCatalog() {
    const query = buscaProduto.value.trim().toLowerCase();
    const filtered = catalogData.filter((item) => {
      const matchesFilter = activeFilter === 'todos' || item.category === activeFilter;
      const matchesQuery = !query || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });

    catalogGrid.innerHTML = filtered.map((item) => `
      <article class="product-card">
        <span class="tag">${item.tag}</span>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="price">${money(item.price)}</div>
        <div class="product-actions">
          <button type="button" class="btn btn-primary" data-add="${item.id}">Adicionar</button>
        </div>
      </article>
    `).join('');

    catalogGrid.querySelectorAll('[data-add]').forEach((button) => {
      button.addEventListener('click', () => addToCart(Number(button.dataset.add)));
    });
  }

  function addToCart(itemId) {
    const item = catalogData.find((entry) => entry.id === itemId);
    if (!item) return;

    const existing = cart.find((entry) => entry.id === itemId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }

    saveState(STORAGE_KEYS.cart, cart);
    statusPedido.textContent = 'Em atendimento';
    renderCart();
    mensagemPedido.textContent = `${item.name} adicionado ao pedido.`;
  }

  function renderCart() {
    const quantity = cart.reduce((sum, item) => sum + item.qty, 0);
    itensCount.textContent = `${quantity} item${quantity === 1 ? '' : 's'}`;
    saveState(STORAGE_KEYS.cart, cart);

    if (!cart.length) {
      listaPedido.innerHTML = '<div class="empty-state">Ainda não há itens no pedido.</div>';
      subtotalPedido.textContent = money(0);
      taxaPedido.textContent = money(0);
      totalPedido.textContent = money(0);
      statusPedido.textContent = 'Em aberto';
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const taxa = subtotal > 0 ? 2.5 : 0;
    const total = subtotal + taxa;

    listaPedido.innerHTML = cart.map((item) => `
      <div class="order-item">
        <div class="order-item-top">
          <div>
            <strong>${item.name}</strong>
            <small>${money(item.price)} cada</small>
          </div>
          <span>${money(item.price * item.qty)}</span>
        </div>
        <div class="order-item-actions">
          <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
          <strong>${item.qty}</strong>
          <button type="button" class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
        </div>
      </div>
    `).join('');

    listaPedido.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => changeQty(Number(button.dataset.id), button.dataset.action));
    });

    subtotalPedido.textContent = money(subtotal);
    taxaPedido.textContent = money(taxa);
    totalPedido.textContent = money(total);
  }

  function changeQty(itemId, action) {
    const item = cart.find((entry) => entry.id === itemId);
    if (!item) return;

    if (action === 'increase') item.qty += 1;
    if (action === 'decrease') item.qty -= 1;

    if (item.qty <= 0) {
      const index = cart.findIndex((entry) => entry.id === itemId);
      cart.splice(index, 1);
    }

    saveState(STORAGE_KEYS.cart, cart);
    renderCart();
  }

  function nextComanda() {
    comanda += 1;
    comandaNumero.textContent = `#${comanda}`;
    saveState(STORAGE_KEYS.comanda, comanda);
  }

  function renderMesaPanel() {
    if (!mesasPanel) return;

    saveState(STORAGE_KEYS.tables, tableState);
    const ocupadas = tableState.filter((table) => table.status === 'ocupada').length;
    mesasOcupadasCount.textContent = String(ocupadas).padStart(2, '0');
    pedidosAtivosCount.textContent = String(Math.max(ocupadas, 1)).padStart(2, '0');

    mesasPanel.innerHTML = tableState.map((table) => `
      <article class="mesa-card ${table.status}">
        <strong>${table.mesa}</strong>
        <span>${table.status === 'ocupada' ? 'Ocupada' : 'Livre'}</span>
        <button type="button" data-mesa="${table.mesa}">${table.status === 'ocupada' ? 'Ver mesa' : 'Abrir mesa'}</button>
      </article>
    `).join('');

    mesasPanel.querySelectorAll('[data-mesa]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.dataset.mesa;
        mesaPedido.value = target;
        nomeCliente.value = target;
        mensagemPedido.textContent = `${target} selecionada para atendimento.`;
      });
    });
  }

  function renderHistory() {
    if (!comandasRecentes) return;

    if (!commandHistory.length) {
      comandasRecentes.innerHTML = '<div class="history-item"><strong>Nenhuma comanda fechada ainda</strong><span>As comandas aparecem aqui após o fechamento.</span></div>';
      return;
    }

    comandasRecentes.innerHTML = commandHistory.slice(0, 5).map((entry) => `
      <div class="history-item">
        <strong>${entry.comanda} • ${entry.cliente}</strong>
        <span>${entry.mesa} • ${entry.pagamento} • ${money(entry.total)}</span>
      </div>
    `).join('');
  }

  function addCommandHistory(entry) {
    commandHistory.unshift(entry);
    saveState(STORAGE_KEYS.history, commandHistory);
    renderHistory();
  }

  buscaProduto.addEventListener('input', renderCatalog);

  document.getElementById('finalizarPedido').addEventListener('click', () => {
    if (!cart.length) {
      mensagemPedido.textContent = 'Adicione pelo menos um item ao pedido antes de fechar a comanda.';
      return;
    }

    const cliente = nomeCliente.value.trim() || 'Cliente balcão';
    const atendente = nomeAtendente.value.trim() || 'Atendente não informado';
    const mesa = mesaPedido.value || businessConfig.defaultMesa || 'Mesa 01';
    const modo = tipoAtendimento.value;
    const observacao = observacaoPedido.value.trim();
    const total = Number(totalPedido.textContent.replace(/[R$\s.]/g, '').replace(',', '.'));

    mensagemPedido.textContent = `Comanda ${comandaNumero.textContent} fechada para ${cliente} • ${mesa} • ${modo}. Atendente: ${atendente}. Forma de pagamento: ${activePayment}. Total: ${money(total)}.`;

    if (observacao) {
      mensagemPedido.textContent += ` Observação: ${observacao}`;
    }

    const selectedTable = tableState.find((table) => table.mesa === mesa);
    if (selectedTable) {
      selectedTable.status = 'ocupada';
    }

    addCommandHistory({
      comanda: comandaNumero.textContent,
      cliente,
      mesa,
      pagamento: activePayment,
      total
    });

    statusPedido.textContent = 'Fechada';
    cart.length = 0;
    nomeCliente.value = '';
    nomeAtendente.value = '';
    observacaoPedido.value = '';
    saveState(STORAGE_KEYS.cart, cart);
    renderCart();
    renderMesaPanel();
    nextComanda();
  });

  document.getElementById('abrirNovaComanda').addEventListener('click', () => {
    cart.length = 0;
    nomeCliente.value = '';
    nomeAtendente.value = '';
    observacaoPedido.value = '';
    saveState(STORAGE_KEYS.cart, cart);
    renderCart();
    renderMesaPanel();
    nextComanda();
    mensagemPedido.textContent = 'Nova comanda aberta com sucesso.';
  });

  applyBusinessConfig();
  renderMesaPanel();
  renderHistory();
  renderCatalog();
  renderCart();
  comandaNumero.textContent = `#${comanda}`;
})();
