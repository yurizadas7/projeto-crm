const API_URL = "http://127.0.0.1:3000";
const DELIVERY_FEE = 5;
const DELIVERY_AREAS = [
  { bairro: "Centro", km: 1.2, taxa: 5 },
  { bairro: "Vila Nova", km: 2.4, taxa: 7 },
  { bairro: "Jardim Europa", km: 3.1, taxa: 9 },
  { bairro: "Santa Luzia", km: 4.6, taxa: 12 },
  { bairro: "Parque das Aguas", km: 6.2, taxa: 16 },
  { bairro: "Residencial Primavera", km: 8.5, taxa: 22 },
  { bairro: "Jardim Imperial", km: 10.8, taxa: 28 },
  { bairro: "Distrito Industrial", km: 13.4, taxa: 34 },
  { bairro: "Chacaras Boa Vista", km: 16.8, taxa: 40 }
];
const CUSTOMER_PROFILE_KEY = "yulipeCustomerProfile";
const LOCAL_ORDERS_KEY = "yulipeLocalOrders";
const ACTIVE_ORDER_KEY = "yulipeActiveOrder";

let carrinho = [];
let pizzaAtual = null;
let customerProfile = loadCustomerProfile();

const btnTema = document.getElementById("tema-btn");
const modal = document.querySelector(".modal");
const fechar = document.querySelector(".fechar");
const saboresOpcoes = document.getElementById("saboresOpcoes");
const buscaCardapio = document.getElementById("buscaCardapio");
const pedidoCardContainer = document.getElementById("pedidoCardContainer");
const clienteStatus = document.getElementById("clienteStatus");
const perfilClienteBtn = document.getElementById("perfilClienteBtn");
const checkoutModal = document.getElementById("checkoutModal");
const checkoutCliente = document.getElementById("checkoutCliente");
const checkoutResumo = document.getElementById("checkoutResumo");
const trocoField = document.getElementById("trocoField");
const trocoPara = document.getElementById("trocoPara");
const paymentHint = document.getElementById("paymentHint");
const pedidoTracking = document.getElementById("pedidoTracking");
const sacolaMessage = document.getElementById("sacolaMessage");
const checkoutMessage = document.getElementById("checkoutMessage");
const pizzaMessage = document.getElementById("pizzaMessage");

const saboresPorTipo = {
  salgada: [
    "Calabresa",
    "Portuguesa",
    "Frango com Catupiry",
    "Quatro Queijos",
    "Marguerita",
    "Bacon",
    "Atum",
    "Napolitana",
    "Moda da casa",
    "Lombo com Catupiry"
  ],
  doce: [
    "Chocolate",
    "Brigadeiro",
    "Prestigio",
    "Banana com Canela",
    "Romeu e Julieta",
    "Doce de Leite",
    "Confete",
    "Chocolate com Morango"
  ]
};

function loadCustomerProfile() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_PROFILE_KEY)) || null;
  } catch (error) {
    return null;
  }
}

function hasRequiredProfile(profile) {
  return Boolean(profile?.name && profile?.phone && profile?.neighborhood && profile?.street && profile?.number);
}

function requireCustomerProfile() {
  if (hasRequiredProfile(customerProfile)) return;
  window.location.href = "../cliente-login/index.html";
}

function customerAddress(profile) {
  return `${profile.street}, ${profile.number} - ${profile.neighborhood}`;
}

function renderCustomerProfile() {
  if (!clienteStatus || !customerProfile) return;

  clienteStatus.innerHTML = `
    <div>
      <strong>${escapeHTML(customerProfile.name)} - ${escapeHTML(customerProfile.phone)}</strong>
      <span>${escapeHTML(customerAddress(customerProfile))}</span>
    </div>
    <span>Perfil de entrega ativo</span>
  `;
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function deliveryAreaFor(profile = customerProfile) {
  const neighborhood = normalizeText(profile?.neighborhood);
  return DELIVERY_AREAS.find(area => normalizeText(area.bairro) === neighborhood) || null;
}

function deliveryFee() {
  if (!carrinho.length) return 0;
  return deliveryAreaFor()?.taxa ?? DELIVERY_FEE;
}

function deliveryAreaLabel(area = deliveryAreaFor()) {
  if (!area) return "padrao";
  return `${area.bairro} - ${String(area.km).replace(".", ",")} km`;
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function borderPrice(border) {
  if (border === "chocolate") return 10;
  if (["catupiry", "cheddar"].includes(border)) return 8;
  return 0;
}

function itemPrice(item) {
  return Number(item.preco || 0) + borderPrice(item.borda);
}

function cartSubtotal() {
  return carrinho.reduce((sum, item) => sum + itemPrice(item), 0);
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (error) {
    return fallback;
  }
}

function loadLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveLocalOrder(order) {
  const orders = loadLocalOrders();
  orders.unshift(order);
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders.slice(0, 80)));
}

function setMessage(element, message = "", type = "error") {
  if (!element) return;
  element.textContent = message;
  element.className = `${element.classList.contains("checkout-message") ? "checkout-message" : "sacola-message"} ${message ? type : ""}`;
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  btnTema.textContent = document.body.classList.contains("dark") ? "Sol" : "Lua";
}

function renderizarSabores(tipo = "salgada") {
  const sabores = saboresPorTipo[tipo] || saboresPorTipo.salgada;
  saboresOpcoes.innerHTML = sabores.map(sabor => {
    const saborSeguro = escapeHTML(sabor);
    return `<label><input type="checkbox" value="${saborSeguro}"> ${saborSeguro}</label>`;
  }).join("");
}

function resetarSabores(tipo = "salgada") {
  renderizarSabores(tipo);
  document.getElementById("borda").value = "sem";
  document.getElementById("obs").value = "";
}

function limitarSabores(limite) {
  document.querySelectorAll("#saboresOpcoes input[type='checkbox']").forEach(cb => {
    cb.onchange = () => {
      setMessage(pizzaMessage, "");
      const selecionados = document.querySelectorAll("#saboresOpcoes input[type='checkbox']:checked");
      if (selecionados.length > limite) {
        cb.checked = false;
        setMessage(pizzaMessage, `Voce so pode escolher ate ${limite} sabores.`);
      }
    };
  });
}

function abrirModal(pizza) {
  document.getElementById("tituloPizza").textContent = pizza.nome;
  setMessage(pizzaMessage, "");
  resetarSabores(pizza.tipo);
  limitarSabores(pizza.limite);
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

function fecharModal() {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

function pegarSabores() {
  return Array.from(document.querySelectorAll("#saboresOpcoes input[type='checkbox']:checked")).map(cb => cb.value);
}

function atualizarCarrinho() {
  const container = document.querySelector(".itens-sacola");
  const sacola = document.querySelector(".sacola");
  container.innerHTML = "";
  sacola.classList.toggle("has-items", carrinho.length > 0);

  if (!carrinho.length) {
    container.innerHTML = "<p>Sacola vazia</p>";
    atualizarTotais(0);
    return;
  }

  let subtotal = 0;

  carrinho.forEach((item, index) => {
    const totalItem = itemPrice(item);
    subtotal += totalItem;
    const detail = item.tipo === "pizza"
      ? `
        <span>Sabores: ${escapeHTML(item.sabores.join(", ") || "nao informado")}</span>
        <span>Borda: ${escapeHTML(item.bordaLabel)}</span>
        ${item.observacao ? `<span>Obs: ${escapeHTML(item.observacao)}</span>` : ""}
      `
      : "<span>Bebida</span>";

    container.innerHTML += `
      <div class="item">
        <div class="item-main">
          <strong>${escapeHTML(item.nome)}</strong>
          <div class="item-details">${detail}</div>
        </div>
        <div class="item-actions">
          <span>${money(totalItem)}</span>
          <button class="remover-item" type="button" data-index="${index}">Remover</button>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".remover-item").forEach(button => {
    button.addEventListener("click", () => {
      carrinho.splice(Number(button.dataset.index), 1);
      atualizarCarrinho();
    });
  });

  atualizarTotais(subtotal);
}

function atualizarTotais(subtotal) {
  const taxa = deliveryFee();
  const total = subtotal + taxa;
  const subtotalEl = document.getElementById("subtotalSacola");
  const taxaEl = document.getElementById("taxaSacola");
  const totalEl = document.getElementById("totalSacola");

  subtotalEl.textContent = `Subtotal: ${money(subtotal)}`;
  taxaEl.textContent = `Entrega ${deliveryAreaLabel()}: ${money(taxa)}`;
  totalEl.textContent = `Total: ${money(total)}`;
  totalEl.dataset.total = money(total);
}

function mostrarConfirmacao(data) {
  pedidoCardContainer.innerHTML = `
    <div class="pedido-confirmado">
      <h2>Pedido confirmado</h2>
      <p><strong>Numero do pedido:</strong> #${escapeHTML(data.idPedido || "local")}</p>
      <p><strong>Total:</strong> ${money(data.total)}</p>
      <p>${escapeHTML(data.message || "Seu pedido foi enviado para a cozinha.")}</p>
    </div>
  `;
  pedidoCardContainer.classList.add("show");
  setTimeout(() => {
    pedidoCardContainer.classList.remove("show");
    pedidoCardContainer.innerHTML = "";
  }, 4200);
}

function statusStep(status) {
  const normalized = String(status || "Pendente").toLowerCase();
  if (normalized.includes("entregue")) return 5;
  if (normalized.includes("caminho")) return 4;
  if (normalized.includes("pronto")) return 3;
  if (normalized.includes("preparo")) return 2;
  return 1;
}

function activeOrder() {
  const saved = loadJson(ACTIVE_ORDER_KEY, null);
  const local = loadLocalOrders().find(order => order.status !== "Entregue" && order.status !== "Cancelado");
  return saved || local || null;
}

function saveActiveOrder(order) {
  localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(order));
}

function renderPedidoTracking(order = activeOrder()) {
  if (!pedidoTracking) return;

  if (!order || ["Cancelado"].includes(order.status)) {
    pedidoTracking.innerHTML = "";
    return;
  }

  const step = statusStep(order.status);
  pedidoTracking.innerHTML = `
    <div>
      <strong>Pedido #${escapeHTML(order.id)} - ${escapeHTML(order.status || "Pendente")}</strong>
      <span>${money(order.total)} ${order.sync_pending ? "- aguardando sincronizacao" : ""}</span>
    </div>
    <ol class="tracking-steps">
      <li class="${step >= 1 ? "active" : ""}">Recebido</li>
      <li class="${step >= 2 ? "active" : ""}">Preparo</li>
      <li class="${step >= 3 ? "active" : ""}">Pronto</li>
      <li class="${step >= 4 ? "active" : ""}">Entrega</li>
      <li class="${step >= 5 ? "active" : ""}">Entregue</li>
    </ol>
  `;
}

async function syncTrackedOrders() {
  const orders = loadLocalOrders();
  const current = activeOrder();
  let changed = false;

  for (const order of orders) {
    if (order.sync_pending || !Number(order.id)) continue;
    try {
      const res = await fetch(`${API_URL}/pedidos/${order.id}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status_pedido && data.status_pedido !== order.status) {
        order.status = data.status_pedido;
        changed = true;
      }
    } catch (error) {
      return;
    }
  }

  if (changed) localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));

  if (current && !current.sync_pending && Number(current.id)) {
    try {
      const res = await fetch(`${API_URL}/pedidos/${current.id}`);
      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...current,
          id: data.id_pedido || current.id,
          status: data.status_pedido || current.status,
          total: data.valor_total || current.total
        };
        saveActiveOrder(updated);
        renderPedidoTracking(updated);
        return;
      }
    } catch (error) {
      // Mantem o ultimo status salvo.
    }
  }

  renderPedidoTracking(current);
}

function selectedPayment() {
  const checked = document.querySelector("input[name='paymentMethod']:checked");
  return checked?.value || "Pix";
}

function updatePaymentUI() {
  const method = selectedPayment();
  trocoField.classList.toggle("show", method === "Dinheiro");
  if (paymentHint) {
    paymentHint.textContent = {
      Pix: "Confirmacao rapida via Pix.",
      "Cartao na entrega": "A maquininha sera levada junto com o pedido.",
      Dinheiro: "Informe o valor para calcularmos o troco."
    }[method] || "";
  }
  setMessage(checkoutMessage, "");
}

function renderCheckout() {
  customerProfile = loadCustomerProfile();
  if (!hasRequiredProfile(customerProfile)) {
    window.location.href = "../cliente-login/index.html";
    return;
  }

  const subtotal = cartSubtotal();
  const taxa = deliveryFee();
  const total = subtotal + taxa;
  const area = deliveryAreaFor();

  checkoutCliente.innerHTML = `
    <strong>${escapeHTML(customerProfile.name)} - ${escapeHTML(customerProfile.phone)}</strong>
    <span>${escapeHTML(customerAddress(customerProfile))}</span>
    <span>Taxa do bairro: ${escapeHTML(deliveryAreaLabel(area))} - ${money(taxa)}</span>
    ${customerProfile.complement ? `<span>Complemento: ${escapeHTML(customerProfile.complement)}</span>` : ""}
    ${customerProfile.reference ? `<span>Referencia: ${escapeHTML(customerProfile.reference)}</span>` : ""}
  `;

  checkoutResumo.innerHTML = `
    ${carrinho.map(item => `
      <div class="checkout-line">
        <span>${escapeHTML(item.nome)}${item.sabores?.length ? ` (${escapeHTML(item.sabores.join(", "))})` : ""}</span>
        <span>${money(itemPrice(item))}</span>
      </div>
    `).join("")}
    <hr>
    <div class="checkout-line"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <div class="checkout-line"><span>Taxa de entrega</span><span>${money(taxa)}</span></div>
    <div class="checkout-line"><span>Total</span><span>${money(total)}</span></div>
  `;
}

function abrirCheckout() {
  if (!carrinho.length) {
    setMessage(sacolaMessage, "Adicione pelo menos um item antes de finalizar.");
    return;
  }

  setMessage(sacolaMessage, "");
  renderCheckout();
  checkoutModal.style.display = "flex";
  checkoutModal.setAttribute("aria-hidden", "false");
}

function fecharCheckout() {
  checkoutModal.style.display = "none";
  checkoutModal.setAttribute("aria-hidden", "true");
}

function localOrderPayload() {
  const subtotal = cartSubtotal();
  const taxa = deliveryFee();
  const paymentMethod = selectedPayment();

  return {
    id: Date.now(),
    status: "Pendente",
    criadoEm: new Date().toISOString(),
    cliente: customerProfile,
    pagamento: {
      metodo: paymentMethod,
      trocoPara: paymentMethod === "Dinheiro" ? trocoPara.value.trim() : ""
    },
    itens: carrinho.map(item => ({ ...item })),
    bairroEntrega: deliveryAreaFor()?.bairro || customerProfile?.neighborhood || "Padrao",
    subtotal,
    taxa,
    total: subtotal + taxa
  };
}

async function carregarProdutosAPI() {
  try {
    const resposta = await fetch(`${API_URL}/produtos`);
    if (!resposta.ok) throw new Error("Falha ao carregar produtos");
    const produtos = await resposta.json();
    if (!Array.isArray(produtos)) return;

    const saboresAPI = produtos
      .map(produto => produto.nome_produto)
      .filter(Boolean);

    if (saboresAPI.length) {
      saboresPorTipo.salgada = [...new Set([...saboresPorTipo.salgada, ...saboresAPI])];
    }
  } catch (error) {
    console.info("Cardapio local carregado. Backend indisponivel para sabores extras.", error);
  }
}

async function finalizarPedido() {
  customerProfile = loadCustomerProfile();

  if (!hasRequiredProfile(customerProfile)) {
    window.location.href = "../cliente-login/index.html";
    return;
  }

  abrirCheckout();
}

async function confirmarPedido() {
  customerProfile = loadCustomerProfile();

  if (!hasRequiredProfile(customerProfile)) {
    window.location.href = "../cliente-login/index.html";
    return;
  }

  const pedidoLocal = localOrderPayload();
  if (pedidoLocal.pagamento.metodo === "Dinheiro" && !pedidoLocal.pagamento.trocoPara) {
    setMessage(checkoutMessage, "Informe o valor para troco.");
    return;
  }

  try {
    setMessage(checkoutMessage, "Enviando pedido para a cozinha...", "info");
    const resposta = await fetch(`${API_URL}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: customerProfile,
        itens: carrinho,
        pagamento: pedidoLocal.pagamento,
        taxaEntrega: pedidoLocal.taxa,
        bairroEntrega: pedidoLocal.bairroEntrega
      })
    });

    const data = await resposta.json();
    if (!resposta.ok) throw new Error(data.error || "Erro ao enviar pedido");

    const trackedOrder = { ...pedidoLocal, id: data.idPedido || pedidoLocal.id, status: data.status || "Pendente" };
    saveLocalOrder(trackedOrder);
    saveActiveOrder(trackedOrder);
    mostrarConfirmacao({ idPedido: data.idPedido || pedidoLocal.id, total: data.total || pedidoLocal.total });
    carrinho = [];
    atualizarCarrinho();
    fecharCheckout();
    renderPedidoTracking();
  } catch (error) {
    const offlineOrder = { ...pedidoLocal, sync_pending: true };
    saveLocalOrder(offlineOrder);
    saveActiveOrder(offlineOrder);
    mostrarConfirmacao({
      idPedido: pedidoLocal.id,
      total: pedidoLocal.total,
      message: "Backend offline. Pedido salvo localmente para a cozinha deste dispositivo."
    });
    carrinho = [];
    atualizarCarrinho();
    fecharCheckout();
    renderPedidoTracking();
    console.error(error);
  }
}

function filtrarCardapio() {
  const termo = buscaCardapio.value.trim().toLowerCase();
  document.querySelectorAll(".produto").forEach(produto => {
    const texto = produto.innerText.toLowerCase();
    produto.style.display = texto.includes(termo) ? "block" : "none";
  });
}

btnTema.addEventListener("click", toggleTheme);
perfilClienteBtn.addEventListener("click", () => {
  window.location.href = "../cliente-login/index.html";
});
fechar.addEventListener("click", fecharModal);
modal.addEventListener("click", event => {
  if (event.target === modal) fecharModal();
});

buscaCardapio.addEventListener("input", filtrarCardapio);

document.querySelectorAll("[data-scroll-target]").forEach(button => {
  button.addEventListener("click", () => document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth" }));
});

document.addEventListener("click", event => {
  if (event.target.classList.contains("abrir-modal")) {
    const produto = event.target.closest(".produto");
    pizzaAtual = {
      id_produto: Number(produto.dataset.idProduto || 0),
      nome: produto.dataset.nome,
      limite: Number(produto.dataset.limite || 2),
      preco: Number(produto.dataset.preco || 0),
      tipo: produto.dataset.tipo || "salgada"
    };
    abrirModal(pizzaAtual);
  }

  if (event.target.classList.contains("adicionar-bebida")) {
    carrinho.push({
      tipo: "bebida",
      nome: event.target.dataset.nome,
      preco: Number(event.target.dataset.preco),
      quantidade: 1,
      sabores: [],
      borda: "sem",
      bordaLabel: "Sem borda",
      observacao: ""
    });
    atualizarCarrinho();
  }
});

document.getElementById("addCarrinho").addEventListener("click", () => {
  if (!pizzaAtual) return;

  const sabores = pegarSabores();
  if (!sabores.length) {
    setMessage(pizzaMessage, "Escolha pelo menos um sabor.");
    return;
  }

  const borda = document.getElementById("borda");
  carrinho.push({
    tipo: "pizza",
    id_produto: pizzaAtual.id_produto || undefined,
    nome: pizzaAtual.nome,
    preco: pizzaAtual.preco,
    quantidade: 1,
    sabores,
    borda: borda.value,
    bordaLabel: borda.options[borda.selectedIndex].text,
    observacao: document.getElementById("obs").value.trim()
  });

  atualizarCarrinho();
  fecharModal();
});

document.getElementById("finalizarPedido").addEventListener("click", finalizarPedido);
document.getElementById("confirmarPedido").addEventListener("click", confirmarPedido);
document.querySelector(".fechar-checkout").addEventListener("click", fecharCheckout);
document.getElementById("editarPerfilCheckout").addEventListener("click", () => {
  window.location.href = "../cliente-login/index.html";
});
checkoutModal.addEventListener("click", event => {
  if (event.target === checkoutModal) fecharCheckout();
});
document.querySelectorAll("input[name='paymentMethod']").forEach(input => {
  input.addEventListener("change", updatePaymentUI);
});

requireCustomerProfile();
renderCustomerProfile();
renderPedidoTracking();
setInterval(syncTrackedOrders, 5000);
carregarProdutosAPI();
atualizarCarrinho();

