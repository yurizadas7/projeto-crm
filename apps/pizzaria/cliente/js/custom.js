const API_URL = "http://localhost:3000";
const DELIVERY_FEE = 5;
const CUSTOMER_PROFILE_KEY = "yulipeCustomerProfile";
const LOCAL_ORDERS_KEY = "yulipeLocalOrders";

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
      const selecionados = document.querySelectorAll("#saboresOpcoes input[type='checkbox']:checked");
      if (selecionados.length > limite) {
        cb.checked = false;
        alert(`Voce so pode escolher ate ${limite} sabores.`);
      }
    };
  });
}

function abrirModal(pizza) {
  document.getElementById("tituloPizza").textContent = pizza.nome;
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
  container.innerHTML = "";

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
      ? `<small>Sabores: ${item.sabores.join(", ") || "nao informado"}</small><br><small>Borda: ${item.bordaLabel}</small><br><small>Obs: ${item.observacao || "nenhuma"}</small>`
      : "<small>Bebida</small>";

    container.innerHTML += `
      <div class="item">
        <strong>${escapeHTML(item.nome)}</strong><br>
        ${detail}<br>
        <span>${money(totalItem)}</span>
        <button class="remover-item" type="button" data-index="${index}">Remover</button>
        <hr>
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
  const taxa = carrinho.length ? DELIVERY_FEE : 0;
  const total = subtotal + taxa;
  document.getElementById("subtotalSacola").textContent = `Subtotal: ${money(subtotal)}`;
  document.getElementById("taxaSacola").textContent = `Taxa de entrega: ${money(taxa)}`;
  document.getElementById("totalSacola").textContent = `Total: ${money(total)}`;
}

function mostrarConfirmacao(data) {
  pedidoCardContainer.innerHTML = `
    <div class="pedido-confirmado">
      <h2>Pedido confirmado</h2>
      <p><strong>Numero do pedido:</strong> #${escapeHTML(data.idPedido || "local")}</p>
      <p><strong>Total:</strong> ${money(data.total)}</p>
      <p>Seu pedido foi enviado para a cozinha.</p>
    </div>
  `;
  pedidoCardContainer.classList.add("show");
  setTimeout(() => {
    pedidoCardContainer.classList.remove("show");
    pedidoCardContainer.innerHTML = "";
  }, 4200);
}

function selectedPayment() {
  const checked = document.querySelector("input[name='paymentMethod']:checked");
  return checked?.value || "Pix";
}

function renderCheckout() {
  customerProfile = loadCustomerProfile();
  if (!hasRequiredProfile(customerProfile)) {
    window.location.href = "../cliente-login/index.html";
    return;
  }

  const subtotal = cartSubtotal();
  const taxa = carrinho.length ? DELIVERY_FEE : 0;
  const total = subtotal + taxa;

  checkoutCliente.innerHTML = `
    <strong>${escapeHTML(customerProfile.name)} - ${escapeHTML(customerProfile.phone)}</strong>
    <span>${escapeHTML(customerAddress(customerProfile))}</span>
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
    alert("Carrinho vazio.");
    return;
  }

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
  const taxa = carrinho.length ? DELIVERY_FEE : 0;
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
    alert("Informe o valor para troco.");
    return;
  }

  saveLocalOrder(pedidoLocal);

  try {
    const resposta = await fetch(`${API_URL}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente: customerProfile, itens: carrinho, pagamento: pedidoLocal.pagamento })
    });

    const data = await resposta.json();
    if (!resposta.ok) throw new Error(data.error || "Erro ao enviar pedido");

    mostrarConfirmacao({ idPedido: data.idPedido || pedidoLocal.id, total: pedidoLocal.total });
  } catch (error) {
    console.info("Pedido salvo apenas na demonstracao local.", error);
    mostrarConfirmacao({ idPedido: pedidoLocal.id, total: pedidoLocal.total });
  }

  carrinho = [];
  atualizarCarrinho();
  fecharCheckout();
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
    alert("Escolha pelo menos um sabor.");
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
  input.addEventListener("change", () => {
    trocoField.classList.toggle("show", selectedPayment() === "Dinheiro");
  });
});

requireCustomerProfile();
renderCustomerProfile();
carregarProdutosAPI();
atualizarCarrinho();
