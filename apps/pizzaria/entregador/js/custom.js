const API_URL = "http://127.0.0.1:3000";
const LOCAL_ORDERS_KEY = "yulipeLocalOrders";
const DRIVER_KEY = "yulipeDriverName";
const ASSIGNMENTS_KEY = "yulipeDeliveryAssignments";

let orders = [];
let activeTab = "disponiveis";
let apiOffline = false;

const driverName = document.getElementById("driverName");
const ordersList = document.getElementById("ordersList");
const statusMessage = document.getElementById("statusMessage");

driverName.value = localStorage.getItem(DRIVER_KEY) || "";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function loadJson(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function assignments() {
  return loadJson(ASSIGNMENTS_KEY, {});
}

function saveAssignment(orderId, data) {
  const next = assignments();
  next[String(orderId)] = {
    ...(next[String(orderId)] || {}),
    ...data,
    updatedAt: new Date().toISOString()
  };
  saveJson(ASSIGNMENTS_KEY, next);
}

function currentDriver() {
  return driverName.value.trim() || "Entregador";
}

function isDeliveryAvailable(order) {
  return ["Pronto para entrega", "A caminho"].includes(order.status) && !order.delivery?.driver;
}

function showStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type === "error" ? "error" : ""}`;
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => {
    statusMessage.className = "status-message";
  }, 3200);
}

function mapLocalOrder(order) {
  return {
    id: order.id,
    status: order.status || "Pendente",
    criadoEm: order.criadoEm,
    total: order.total || 0,
    cliente: order.cliente,
    pagamento: order.pagamento,
    detalhes: order.itens || [],
    local: true
  };
}

function mapApiOrder(order) {
  return {
    id: order.id_pedido,
    status: order.status_pedido || "Pendente",
    criadoEm: order.data_pedido,
    total: order.valor_total || 0,
    cliente: order.cliente,
    pagamento: order.pagamento,
    detalhes: order.detalhes || []
  };
}

function hydrateAssignment(order) {
  const assigned = assignments()[String(order.id)] || {};
  return { ...order, delivery: assigned };
}

async function fetchOrders() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const response = await fetch(`${API_URL}/pedidos`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error("Falha ao buscar pedidos");
    const data = await response.json();
    orders = Array.isArray(data) ? data.map(mapApiOrder).map(hydrateAssignment) : [];
    apiOffline = false;
  } catch (error) {
    orders = loadJson(LOCAL_ORDERS_KEY).map(mapLocalOrder).map(hydrateAssignment);
    apiOffline = true;
  }

  render();
}

function filteredOrders() {
  const driver = currentDriver();
  if (activeTab === "disponiveis") {
    return orders.filter(isDeliveryAvailable);
  }

  if (activeTab === "minhas") {
    return orders.filter(order => order.delivery?.driver === driver && ["Pronto para entrega", "A caminho"].includes(order.status));
  }

  return orders.filter(order => order.delivery?.driver === driver && order.status === "Entregue");
}

function orderAddress(order) {
  const customer = order.cliente || {};
  return [customer.street, customer.number].filter(Boolean).join(", ") + (customer.neighborhood ? ` - ${customer.neighborhood}` : "");
}

function mapsLink(order) {
  const customer = order.cliente || {};
  const query = [customer.street, customer.number, customer.neighborhood].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function paymentLabel(order) {
  const payment = order.pagamento;
  if (!payment) return "Nao informado";
  return `${payment.metodo || payment}${payment.trocoPara ? ` - troco para R$ ${payment.trocoPara}` : ""}`;
}

function itemSummary(order) {
  const names = (order.detalhes || []).map(item => item.nome).filter(Boolean);
  return names.length ? names.join(", ") : "Itens do pedido";
}

function renderOrder(order) {
  const isMine = order.delivery?.driver === currentDriver();
  const canAccept = isDeliveryAvailable(order);
  const canStart = isMine && order.status === "Pronto para entrega";
  const canFinish = isMine && order.status === "A caminho";

  return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <h2>Pedido #${escapeHTML(order.id)}</h2>
          <div class="order-meta">
            <span>${escapeHTML(order.cliente?.name || "Cliente")}</span>
            <span>Pagamento: ${escapeHTML(paymentLabel(order))}</span>
          </div>
        </div>
        <span class="badge">${escapeHTML(order.status)}</span>
      </div>

      <div class="order-address">
        <strong>Endereco</strong>
        <span>${escapeHTML(orderAddress(order) || "Endereco nao informado")}</span>
        ${order.cliente?.reference ? `<span>Referencia: ${escapeHTML(order.cliente.reference)}</span>` : ""}
        ${order.delivery?.driver ? `<span>Entregador: ${escapeHTML(order.delivery.driver)}</span>` : ""}
      </div>

      <div class="order-items">
        <strong>Pedido</strong>
        <span>${escapeHTML(itemSummary(order))}</span>
      </div>

      <div class="order-total">
        <span>Total</span>
        <strong>${money(order.total)}</strong>
      </div>

      <div class="order-actions">
        <a class="back-link" href="${mapsLink(order)}" target="_blank" rel="noopener">Abrir mapa</a>
        ${canAccept ? `<button class="primary" type="button" data-action="accept" data-id="${order.id}">Aceitar entrega</button>` : ""}
        ${canStart ? `<button class="primary" type="button" data-action="start" data-id="${order.id}">Saiu para entrega</button>` : ""}
        ${canFinish ? `<button class="primary" type="button" data-action="finish" data-id="${order.id}">Marcar entregue</button>` : ""}
        ${isMine && order.status !== "Entregue" ? `<button class="danger" type="button" data-action="release" data-id="${order.id}">Liberar entrega</button>` : ""}
      </div>
    </article>
  `;
}

function renderMetrics() {
  const driver = currentDriver();
  document.getElementById("metricDisponiveis").textContent = orders.filter(isDeliveryAvailable).length;
  document.getElementById("metricMinhas").textContent = orders.filter(order => order.delivery?.driver === driver && ["Pronto para entrega", "A caminho"].includes(order.status)).length;
  document.getElementById("metricFinalizadas").textContent = orders.filter(order => order.delivery?.driver === driver && order.status === "Entregue").length;
}

function render() {
  renderMetrics();
  const list = filteredOrders();
  ordersList.innerHTML = list.length
    ? list.map(renderOrder).join("")
    : `<div class="empty-state">${apiOffline ? "Backend offline. Mostrando pedidos locais deste navegador." : "Nenhuma entrega nesta lista."}</div>`;
}

function updateLocalStatus(id, status) {
  const localOrders = loadJson(LOCAL_ORDERS_KEY);
  const order = localOrders.find(item => Number(item.id) === Number(id));
  if (!order) return false;
  order.status = status;
  saveJson(LOCAL_ORDERS_KEY, localOrders);
  return true;
}

async function updateStatus(id, status) {
  const localUpdated = updateLocalStatus(id, status);
  if (localUpdated || apiOffline) {
    await fetchOrders();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/pedidos/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Nao foi possivel atualizar.");
    await fetchOrders();
  } catch (error) {
    apiOffline = true;
    showStatus("Backend offline. Atualizacao aplicada apenas se o pedido for local.", "error");
    await fetchOrders();
  }
}

async function handleAction(action, id) {
  if (!driverName.value.trim()) {
    driverName.focus();
    showStatus("Informe o nome do entregador antes de aceitar.", "error");
    return;
  }

  localStorage.setItem(DRIVER_KEY, currentDriver());

  if (action === "accept") {
    saveAssignment(id, { driver: currentDriver(), acceptedAt: new Date().toISOString() });
    showStatus("Entrega aceita.");
    render();
  }

  if (action === "start") {
    saveAssignment(id, { driver: currentDriver(), startedAt: new Date().toISOString() });
    await updateStatus(id, "A caminho");
    showStatus("Pedido saiu para entrega.");
  }

  if (action === "finish") {
    saveAssignment(id, { driver: currentDriver(), deliveredAt: new Date().toISOString() });
    await updateStatus(id, "Entregue");
    showStatus("Entrega finalizada.");
  }

  if (action === "release") {
    const next = assignments();
    delete next[String(id)];
    saveJson(ASSIGNMENTS_KEY, next);
    await updateStatus(id, "Pronto para entrega");
    showStatus("Entrega liberada.");
  }
}

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach(tab => tab.classList.toggle("active", tab === button));
    render();
  });
});

ordersList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  handleAction(button.dataset.action, Number(button.dataset.id));
});

driverName.addEventListener("input", () => {
  localStorage.setItem(DRIVER_KEY, currentDriver());
  render();
});

setInterval(fetchOrders, 4000);
fetchOrders();
