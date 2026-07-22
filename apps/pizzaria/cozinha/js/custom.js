const API_URL = "http://127.0.0.1:3000";
const LOCAL_ORDERS_KEY = "yulipeLocalOrders";

let pedidos = [];
let apiOffline = false;
let hasLoadedOnce = false;
let knownOrderIds = new Set();

const novos = document.getElementById("novos");
const preparando = document.getElementById("preparando");
const prontosColuna = document.getElementById("prontosColuna");
const statusMessage = document.getElementById("statusMessage");

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function loadLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function localOrders() {
  return loadLocalOrders().map(mapLocalOrder);
}

function saveLocalOrders(orders) {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

function mapLocalOrder(order) {
  return {
    id: order.id,
    status: order.status || "Pendente",
    criadoEm: order.criadoEm,
    total: order.total || 0,
    itens: order.itens?.length || 0,
    cliente: order.cliente,
    pagamento: order.pagamento,
    detalhes: order.itens || [],
    local: true
  };
}

function showStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => {
    statusMessage.className = "status-message";
  }, 3000);
}

function notifyNewOrders(nextOrders) {
  const nextIds = new Set(nextOrders.map(order => String(order.id)));
  const hasNew = [...nextIds].some(id => !knownOrderIds.has(id));
  if (hasLoadedOnce && hasNew) {
    showStatus("Novo pedido recebido.", "info");
    document.title = "Novo pedido - Yulipe Cozinha";
    setTimeout(() => {
      document.title = "Yulipe Cozinha";
    }, 4000);
  }
  knownOrderIds = nextIds;
}

async function buscarPedidos() {
  if (!hasLoadedOnce) {
    pedidos = localOrders();
    hasLoadedOnce = true;
    knownOrderIds = new Set(pedidos.map(order => String(order.id)));
    renderizar();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 900);

  try {
    const res = await fetch(`${API_URL}/pedidos`, { signal: controller.signal });
    if (!res.ok) throw new Error("Falha ao buscar pedidos");
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("O backend nao retornou uma lista de pedidos");

    const apiOrders = data.map(p => ({
        id: p.id_pedido,
        status: p.status_pedido || "Pendente",
        criadoEm: p.data_pedido,
        total: p.valor_total || 0,
        itens: p.total_itens || p.detalhes?.length || 0,
        cliente: p.cliente,
        pagamento: p.pagamento,
        detalhes: p.detalhes || []
      }));
    pedidos = apiOrders.length ? apiOrders : localOrders();

    apiOffline = false;
    notifyNewOrders(pedidos);
    renderizar();
  } catch (erro) {
    apiOffline = true;
    pedidos = localOrders();
    renderizar();

    if (!showStatus.offlineShown) {
      showStatus("Backend offline. Exibindo pedidos locais deste navegador.", "error");
      showStatus.offlineShown = true;
    }
  } finally {
    clearTimeout(timeout);
  }
}

function minutosDesde(dateValue) {
  if (!dateValue) return 0;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
}

function tempoClass(minutos) {
  if (minutos >= 30) return "vermelho";
  if (minutos >= 15) return "amarelo";
  return "verde";
}

function itemNames(pedido) {
  return (pedido.detalhes || []).map(item => item.nome).filter(Boolean).join(", ");
}

function cardPedido(pedido) {
  const minutos = minutosDesde(pedido.criadoEm);
  const pagamento = pedido.pagamento
    ? `${pedido.pagamento.metodo}${pedido.pagamento.trocoPara ? ` - troco para R$ ${pedido.pagamento.trocoPara}` : ""}`
    : "";
  const card = document.createElement("article");

  card.className = "card-pedido";
  card.draggable = true;
  card.dataset.id = pedido.id;
  card.innerHTML = `
    <h5>Pedido #${pedido.id}</h5>
    ${pedido.cliente ? `<div>Cliente: ${pedido.cliente.name}</div>` : ""}
    ${pedido.cliente?.neighborhood ? `<div>Bairro: ${pedido.cliente.neighborhood}</div>` : ""}
    <div>Status: ${pedido.status}</div>
    <div>Total: ${money(pedido.total)}</div>
    <div>Itens: ${pedido.itens}</div>
    ${pagamento ? `<div>Pagamento: ${pagamento}</div>` : ""}
    ${itemNames(pedido) ? `<small>${itemNames(pedido)}</small>` : ""}
    <span class="tempo ${tempoClass(minutos)}">${minutos} min</span>
    <div class="acoes-card">
      ${pedido.status !== "Pendente" ? `<button class="btn-voltar" type="button" data-action="voltar" data-id="${pedido.id}">Voltar</button>` : ""}
      ${pedido.status === "Pendente" ? `<button class="btn-iniciar" type="button" data-action="iniciar" data-id="${pedido.id}">Iniciar</button>` : ""}
      ${pedido.status === "Em preparo" ? `<button class="btn-finalizar" type="button" data-action="finalizar" data-id="${pedido.id}">Marcar pronto</button>` : ""}
      ${pedido.status === "Pronto para entrega" ? `<button class="btn-motoboy" type="button" data-action="motoboy" data-id="${pedido.id}">Enviar para motoboy</button>` : ""}
    </div>
  `;
  card.addEventListener("dragstart", dragStart);
  return card;
}

function renderizar() {
  novos.innerHTML = "";
  preparando.innerHTML = "";
  prontosColuna.innerHTML = "";

  pedidos.forEach(pedido => {
    const status = String(pedido.status || "").trim();
    const card = cardPedido(pedido);

    if (status === "Pendente") novos.appendChild(card);
    else if (status === "Em preparo") preparando.appendChild(card);
    else if (["Pronto para entrega", "A caminho", "Entregue"].includes(status)) prontosColuna.appendChild(card);
    else novos.appendChild(card);
  });

  renderEmptyState(novos, "Nenhum pedido novo.");
  renderEmptyState(preparando, "Nada em preparo agora.");
  renderEmptyState(prontosColuna, "Nenhum pedido pronto.");
  atualizarIndicadores();
}

function renderEmptyState(container, message) {
  if (container.children.length) return;
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  container.appendChild(empty);
}

function updateLocalStatus(id, status) {
  const localOrders = loadLocalOrders();
  const localOrder = localOrders.find(pedido => Number(pedido.id) === Number(id));

  if (!localOrder) return false;

  localOrder.status = status;
  saveLocalOrders(localOrders);
  pedidos = loadLocalOrders().map(mapLocalOrder);
  renderizar();
  showStatus("Status atualizado no pedido local.", "info");
  return true;
}

async function atualizarStatus(id, status) {
  const pedidoAtual = pedidos.find(pedido => Number(pedido.id) === Number(id));

  if (pedidoAtual?.local) {
    if (updateLocalStatus(id, status)) return;
  }

  if (apiOffline) {
    if (!updateLocalStatus(id, status)) {
      showStatus("Backend offline. So pedidos locais podem ser atualizados.", "error");
    }
    return;
  }

  try {
    const res = await fetch(`${API_URL}/pedidos/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao atualizar status");
    await buscarPedidos();
  } catch (error) {
    apiOffline = true;
    if (updateLocalStatus(id, status)) {
      showStatus("Backend offline. Status atualizado apenas na demonstracao.", "error");
    } else {
      showStatus("Nao foi possivel atualizar o pedido real. Verifique a API.", "error");
    }
  }
}

function statusAnterior(status) {
  if (["Pronto para entrega", "A caminho", "Entregue"].includes(status)) return "Em preparo";
  if (status === "Em preparo") return "Pendente";
  return "Pendente";
}

async function iniciar(id) {
  await atualizarStatus(id, "Em preparo");
}

async function finalizar(id) {
  await atualizarStatus(id, "Pronto para entrega");
}

async function enviarMotoboy(id) {
  await atualizarStatus(id, "A caminho");
}

async function voltar(id) {
  const pedido = pedidos.find(p => Number(p.id) === Number(id));
  if (!pedido) return;
  await atualizarStatus(id, statusAnterior(pedido.status));
}

function dragStart(e) {
  e.dataTransfer.setData("id", e.currentTarget.dataset.id);
}

function atualizarIndicadores() {
  document.getElementById("totalPedidos").textContent = pedidos.length;
  document.getElementById("emPreparo").textContent = pedidos.filter(p => p.status === "Em preparo").length;
  document.getElementById("prontos").textContent = pedidos.filter(p => ["Pronto para entrega", "A caminho"].includes(p.status)).length;
}

document.querySelectorAll(".dropzone").forEach(zona => {
  zona.addEventListener("dragover", e => e.preventDefault());
  zona.addEventListener("drop", async e => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("id"));
    const novoStatus = zona.dataset.status || "Pendente";
    await atualizarStatus(id, novoStatus);
  });
});

document.addEventListener("click", event => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);
  if (!action || !id) return;
  if (action === "iniciar") iniciar(id);
  if (action === "finalizar") finalizar(id);
  if (action === "motoboy") enviarMotoboy(id);
  if (action === "voltar") voltar(id);
});

setInterval(() => {
  document.getElementById("relogio").textContent = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}, 1000);

setInterval(buscarPedidos, 3000);

document.getElementById("btnFullscreen").addEventListener("click", () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});

buscarPedidos();

