const API_URL = "http://127.0.0.1:3000";
const ctx = document.getElementById("graficoVendas");
const seletor = document.getElementById("periodoGrafico");
const STORE_CONFIG_KEY = "yulipeStoreConfig";
const LOCAL_ORDERS_KEY = "yulipeLocalOrders";
const storeConfigForm = document.getElementById("storeConfigForm");
const clientesResumo = document.getElementById("clientesResumo");
const productForm = document.getElementById("productForm");
const produtosLista = document.getElementById("produtosLista");
const pedidosRecentesBody = document.getElementById("pedidosRecentesBody");
const caixaPagamentos = document.getElementById("caixaPagamentos");
const caixaComandas = document.getElementById("caixaComandas");
const categoryForm = document.getElementById("categoryForm");
const categoriasLista = document.getElementById("categoriasLista");
const categoryOptions = document.getElementById("categoryOptions");
const adminNotice = document.getElementById("adminNotice");
const pageLinks = document.querySelectorAll("[data-page-link]");
const pages = document.querySelectorAll("[data-page]");

const dados = {
  semana: { labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"], valores: [0, 0, 0, 0, 0, 0, 0] },
  mes: { labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"], valores: [0, 0, 0, 0] },
  ano: { labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
};

let grafico = null;
let produtosCache = [];
let categoriasCache = [];
let pedidosCache = [];

document.body.classList.add("dark");

const defaultStoreConfig = {
  name: "Pizzaria do Yulipe",
  phone: "11999990000",
  address: "Rua Exemplo, 123",
  deliveryFee: "5,00",
  openingHours: "18h as 23h",
  deliveryAreas: [
    "Centro | 1,2 km | R$ 5,00",
    "Vila Nova | 2,4 km | R$ 7,00",
    "Jardim Europa | 3,1 km | R$ 9,00",
    "Santa Luzia | 4,6 km | R$ 12,00",
    "Parque das Aguas | 6,2 km | R$ 16,00",
    "Residencial Primavera | 8,5 km | R$ 22,00",
    "Jardim Imperial | 10,8 km | R$ 28,00",
    "Distrito Industrial | 13,4 km | R$ 34,00",
    "Chacaras Boa Vista | 16,8 km | R$ 40,00"
  ].join("\n"),
  payments: ["Pix", "Cartao na entrega", "Dinheiro"]
};

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function notify(message, type = "info") {
  if (!adminNotice) return;
  adminNotice.textContent = message;
  adminNotice.className = `admin-notice show ${type}`;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => {
    adminNotice.className = "admin-notice";
  }, 3600);
}

async function api(path, options = {}) {
  const resposta = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(data.error || "Erro na API");
  return data;
}

function showPage(pageName) {
  const targetPage = document.querySelector(`[data-page="${pageName}"]`) ? pageName : "dashboard";

  pages.forEach(page => {
    page.classList.toggle("active", page.dataset.page === targetPage);
  });

  pageLinks.forEach(link => {
    link.parentElement.classList.toggle("active", link.dataset.pageLink === targetPage);
  });

  if (window.location.hash !== `#${targetPage}`) {
    history.replaceState(null, "", `#${targetPage}`);
  }

  if (targetPage === "relatorios") {
    setTimeout(() => renderChart(seletor.value), 50);
  }

  if (targetPage === "caixa") {
    loadCaixa();
  }
}

function drawFallbackChart(periodo) {
  const chart = ctx.getContext("2d");
  const { labels, valores } = dados[periodo];
  const width = ctx.width = ctx.clientWidth || 800;
  const height = ctx.height = 300;
  const padding = 36;
  const max = Math.max(...valores, 1);
  const min = Math.min(...valores, 0);
  const range = Math.max(max - min, 1);

  chart.clearRect(0, 0, width, height);
  chart.strokeStyle = "#e4e7ec";
  chart.lineWidth = 1;

  for (let i = 0; i < 5; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    chart.beginPath();
    chart.moveTo(padding, y);
    chart.lineTo(width - padding, y);
    chart.stroke();
  }

  chart.strokeStyle = "#2f9fe8";
  chart.fillStyle = "rgba(47, 159, 232, 0.28)";
  chart.lineWidth = 3;
  chart.beginPath();

  valores.forEach((valor, index) => {
    const x = padding + ((width - padding * 2) / Math.max(labels.length - 1, 1)) * index;
    const y = height - padding - ((valor - min) / range) * (height - padding * 2);
    if (index === 0) chart.moveTo(x, y);
    else chart.lineTo(x, y);
  });

  chart.stroke();
  chart.lineTo(width - padding, height - padding);
  chart.lineTo(padding, height - padding);
  chart.closePath();
  chart.fill();
}

function renderChart(periodo = "semana") {
  if (window.Chart) {
    if (!grafico) {
      grafico = new Chart(ctx, {
        type: "line",
        data: {
          labels: dados[periodo].labels,
          datasets: [{ label: "Faturamento", data: dados[periodo].valores, tension: 0.4, fill: true }]
        },
        options: { responsive: true, plugins: { legend: { display: true } } }
      });
      return;
    }

    grafico.data.labels = dados[periodo].labels;
    grafico.data.datasets[0].data = dados[periodo].valores;
    grafico.update();
    return;
  }

  drawFallbackChart(periodo);
}

function metric(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderPedidosRecentes(pedidos = []) {
  pedidosRecentesBody.innerHTML = pedidos.length
    ? pedidos.map(pedido => `
      <tr>
        <td>${pedido.id_pedido}</td>
        <td>${escapeHTML(pedido.nome)}</td>
        <td><span class="badge ${["Pronto para entrega", "A caminho", "Entregue"].includes(pedido.status_pedido) ? "primary" : "warning"}">${escapeHTML(pedido.status_pedido)}</span></td>
        <td>${money(pedido.valor_total)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">Nenhum pedido real encontrado.</td></tr>`;
}

function renderMaisVendidas(items = []) {
  const list = document.getElementById("maisVendidasLista");
  if (!list) return;
  list.innerHTML = items.length
    ? items.map(item => `<li>${escapeHTML(item.nome_produto)} - ${Number(item.quantidade || 0)} venda(s)</li>`).join("")
    : `<li>Nenhum item vendido ainda</li>`;
}

function renderRelatorioResumo(data = {}) {
  const resumo = document.getElementById("relatorioResumo");
  if (!resumo) return;
  resumo.innerHTML = `
    <div class="summary-item"><strong>${data.pedidosMes || 0} pedido(s)</strong><span>Volume no mes atual</span></div>
    <div class="summary-item"><strong>${money(data.faturamentoMensal)}</strong><span>Faturamento mensal</span></div>
    <div class="summary-item"><strong>${money(data.ticketMedio)}</strong><span>Ticket medio</span></div>
    <div class="summary-item"><strong>${Number(data.taxaCancelamento || 0).toFixed(1)}%</strong><span>Taxa de cancelamento</span></div>
  `;
}

function orderPayment(order) {
  return order.pagamento?.metodo || order.forma_pagamento || "Nao informado";
}

function localOrdersForAdmin() {
  return loadJson(LOCAL_ORDERS_KEY, []).map(order => ({
    id: order.id,
    status: order.status,
    status_pedido: order.status,
    criadoEm: order.criadoEm,
    valor_total: order.total,
    cliente: order.cliente,
    pagamento: order.pagamento,
    detalhes: order.itens || []
  }));
}

function orderTotal(order) {
  return Number(order.valor_total || order.total || 0);
}

function orderDate(order) {
  return new Date(order.data_pedido || order.criadoEm || Date.now());
}

function isToday(order) {
  const date = orderDate(order);
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function estimatedDeliveryFee(order) {
  const total = orderTotal(order);
  const itemsTotal = (order.detalhes || []).reduce((sum, item) => (
    sum + Number(item.preco_unitario || item.preco || 0) * Number(item.quantidade || 1)
  ), 0);
  return Math.max(0, total - itemsTotal);
}

function renderCaixa(pedidos = pedidosCache) {
  const validOrders = pedidos.filter(order => order.status_pedido !== "Cancelado");
  const todayOrders = validOrders.filter(isToday);
  const total = todayOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const taxas = todayOrders.reduce((sum, order) => sum + estimatedDeliveryFee(order), 0);
  const ticket = todayOrders.length ? total / todayOrders.length : 0;

  metric("caixaVendasHoje", money(total));
  metric("caixaPedidosHoje", todayOrders.length);
  metric("caixaTaxasEntrega", money(taxas));
  metric("caixaTicketMedio", money(ticket));

  const pagamentos = todayOrders.reduce((acc, order) => {
    const metodo = orderPayment(order);
    acc[metodo] = (acc[metodo] || 0) + orderTotal(order);
    return acc;
  }, {});

  caixaPagamentos.innerHTML = Object.keys(pagamentos).length
    ? Object.entries(pagamentos).map(([metodo, valor]) => `
      <div class="summary-item">
        <strong>${escapeHTML(metodo)}</strong>
        <span>${money(valor)}</span>
      </div>
    `).join("")
    : `<div class="summary-item"><strong>Nenhuma venda hoje</strong><span>Os valores aparecem quando houver pedidos.</span></div>`;

  caixaComandas.innerHTML = validOrders.slice(0, 8).map(order => `
    <div class="summary-item product-row">
      <strong>#${escapeHTML(order.id_pedido || order.id)} - ${escapeHTML(order.cliente?.name || order.nome || "Cliente")}</strong>
      <span>${escapeHTML(order.status_pedido || order.status || "Pendente")} - ${money(orderTotal(order))}</span>
      <button class="btn" type="button" data-print-order="${escapeHTML(order.id_pedido || order.id)}">Imprimir comanda</button>
    </div>
  `).join("") || `<div class="summary-item"><strong>Nenhum pedido</strong><span>Comandas aparecem apos os pedidos.</span></div>`;
}

function printableOrder(order) {
  const items = (order.detalhes || []).map(item => `
    <tr>
      <td>${escapeHTML(item.quantidade || 1)}x ${escapeHTML(item.nome || item.nome_produto || "Item")}</td>
      <td>${money(Number(item.preco_unitario || item.preco || 0))}</td>
    </tr>
    ${item.sabores?.length ? `<tr><td colspan="2">Sabores: ${escapeHTML(item.sabores.join(", "))}</td></tr>` : ""}
    ${item.bordaLabel ? `<tr><td colspan="2">Borda: ${escapeHTML(item.bordaLabel)}</td></tr>` : ""}
    ${item.observacao ? `<tr><td colspan="2">Obs: ${escapeHTML(item.observacao)}</td></tr>` : ""}
  `).join("");

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Comanda #${escapeHTML(order.id_pedido || order.id)}</title>
        <style>
          body{font-family:Arial,sans-serif;margin:18px;color:#111}
          h1{font-size:22px;margin:0 0 8px}
          h2{font-size:16px;margin:16px 0 6px}
          p{margin:4px 0}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          td{border-bottom:1px dashed #999;padding:7px 0;vertical-align:top}
          td:last-child{text-align:right;white-space:nowrap}
          .total{font-size:20px;font-weight:900;margin-top:14px;text-align:right}
          @media print{button{display:none}}
        </style>
      </head>
      <body>
        <h1>Yulipe Pizzaria</h1>
        <p><strong>Pedido:</strong> #${escapeHTML(order.id_pedido || order.id)}</p>
        <p><strong>Status:</strong> ${escapeHTML(order.status_pedido || order.status || "Pendente")}</p>
        <p><strong>Pagamento:</strong> ${escapeHTML(orderPayment(order))}</p>
        <h2>Cliente</h2>
        <p>${escapeHTML(order.cliente?.name || order.nome || "Cliente")}</p>
        <p>${escapeHTML(order.cliente?.phone || order.telefone || "")}</p>
        <p>${escapeHTML(order.cliente ? `${order.cliente.street || ""}, ${order.cliente.number || ""} - ${order.cliente.neighborhood || ""}` : "")}</p>
        <h2>Itens</h2>
        <table>${items || "<tr><td>Itens nao carregados</td><td></td></tr>"}</table>
        <p class="total">Total: ${money(orderTotal(order))}</p>
        <button onclick="window.print()">Imprimir</button>
        <script>window.print()</script>
      </body>
    </html>
  `;
}

function printOrder(id) {
  const order = pedidosCache.find(item => String(item.id_pedido || item.id) === String(id));
  if (!order) {
    notify("Pedido nao encontrado para impressao.", "error");
    return;
  }

  const printWindow = window.open("", "_blank", "width=420,height=680");
  if (!printWindow) {
    notify("O navegador bloqueou a janela de impressao.", "error");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(printableOrder(order));
  printWindow.document.close();
}

async function loadCaixa() {
  try {
    pedidosCache = await api("/pedidos");
  } catch (error) {
    pedidosCache = localOrdersForAdmin();
  }

  renderCaixa(pedidosCache);
}

async function loadDashboard() {
  try {
    const data = await api("/admin/dashboard");
    metric("metricPedidosHoje", data.pedidosHoje || 0);
    metric("metricFaturamentoHoje", money(data.faturamentoHoje));
    metric("metricClientes", data.clientes || 0);
    metric("metricTicketMedio", money(data.ticketMedio));
    metric("metricFaturamentoMensal", money(data.faturamentoMensal));
    metric("metricPedidosMes", data.pedidosMes || 0);
    metric("metricRecorrentes", `${Number(data.clientesRecorrentes || 0).toFixed(0)}%`);
    metric("metricCancelamento", `${Number(data.taxaCancelamento || 0).toFixed(1)}%`);
    renderPedidosRecentes(data.recentes || []);
    renderMaisVendidas(data.maisVendidas || []);
    renderRelatorioResumo(data);
  } catch (error) {
    renderPedidosRecentes([]);
    renderRelatorioResumo({});
  }
}

async function renderCustomersSummary() {
  try {
    const customers = await api("/clientes");
    const list = customers.slice(0, 8);
    clientesResumo.innerHTML = list.length
      ? list.map(customer => `
        <div class="summary-item">
          <strong>${escapeHTML(customer.nome)} - ${escapeHTML(customer.telefone)}</strong>
          <span>${customer.total_pedidos || 0} pedido(s) - ${money(customer.valor_total)}</span>
        </div>
      `).join("")
      : `<div class="summary-item"><strong>Nenhum cliente ainda</strong><span>Os clientes aparecem aqui quando pedidos forem feitos.</span></div>`;
  } catch (error) {
    clientesResumo.innerHTML = `<div class="summary-item"><strong>Backend indisponivel</strong><span>Nao foi possivel carregar clientes.</span></div>`;
  }
}

function productPayload() {
  const data = new FormData(productForm);
  return {
    nome_produto: String(data.get("nome_produto") || "").trim(),
    categoria: String(data.get("categoria") || "Cardapio").trim(),
    preco: Number(String(data.get("preco") || "0").replace(",", ".")),
    descricao: String(data.get("descricao") || "").trim(),
    disponivel: Boolean(data.get("disponivel"))
  };
}

function clearProductForm() {
  productForm.reset();
  document.getElementById("productId").value = "";
  document.getElementById("productAvailable").checked = true;
}

function editProduct(id) {
  const produto = produtosCache.find(item => Number(item.id_produto) === Number(id));
  if (!produto) return;

  document.getElementById("productId").value = produto.id_produto;
  document.getElementById("productName").value = produto.nome_produto || "";
  document.getElementById("productCategory").value = produto.nome_categoria || "Cardapio";
  document.getElementById("productPrice").value = String(produto.preco || "0").replace(".", ",");
  document.getElementById("productDescription").value = produto.descricao || "";
  document.getElementById("productAvailable").checked = Boolean(produto.disponivel);
  document.getElementById("produtos").scrollIntoView({ behavior: "smooth" });
}

function renderProducts(produtos) {
  produtosCache = produtos;
  produtosLista.innerHTML = produtos.length
    ? produtos.map(produto => `
      <div class="summary-item product-row">
        <strong>${escapeHTML(produto.nome_produto)} - ${money(produto.preco)}</strong>
        <span>${escapeHTML(produto.nome_categoria || "Sem categoria")} - ${produto.disponivel ? "Disponivel" : "Indisponivel"}</span>
        <div class="form-actions">
          <button class="btn" type="button" data-edit-product="${produto.id_produto}">Editar</button>
          <button class="btn btn-danger" type="button" data-delete-product="${produto.id_produto}">Remover</button>
        </div>
      </div>
    `).join("")
    : `<div class="summary-item"><strong>Nenhum produto cadastrado</strong><span>Cadastre o primeiro item do cardapio.</span></div>`;
}

async function loadProducts() {
  try {
    renderProducts(await api("/produtos?todos=1"));
  } catch (error) {
    produtosLista.innerHTML = `<div class="summary-item"><strong>Backend indisponivel</strong><span>Nao foi possivel carregar produtos.</span></div>`;
  }
}

function clearCategoryForm() {
  categoryForm.reset();
  document.getElementById("categoryId").value = "";
}

function editCategory(id) {
  const categoria = categoriasCache.find(item => Number(item.id_categoria) === Number(id));
  if (!categoria) return;
  document.getElementById("categoryId").value = categoria.id_categoria;
  document.getElementById("categoryName").value = categoria.nome_categoria || "";
}

function renderCategories(categorias = []) {
  categoriasCache = categorias;
  categoryOptions.innerHTML = categorias.map(categoria => `<option value="${escapeHTML(categoria.nome_categoria)}"></option>`).join("");
  categoriasLista.innerHTML = categorias.length
    ? categorias.map(categoria => `
      <div class="summary-item product-row">
        <strong>${escapeHTML(categoria.nome_categoria)}</strong>
        <span>${categoria.total_produtos || 0} produto(s)</span>
        <button class="btn" type="button" data-edit-category="${categoria.id_categoria}">Editar</button>
      </div>
    `).join("")
    : `<div class="summary-item"><strong>Nenhuma categoria</strong><span>Crie categorias para organizar o cardapio.</span></div>`;
}

async function loadCategories() {
  try {
    renderCategories(await api("/categorias"));
  } catch (error) {
    categoriasLista.innerHTML = `<div class="summary-item"><strong>Backend indisponivel</strong><span>Nao foi possivel carregar categorias.</span></div>`;
  }
}

async function fillStoreConfig() {
  let config = loadJson(STORE_CONFIG_KEY, defaultStoreConfig);
  try {
    config = await api("/configuracoes");
    saveJson(STORE_CONFIG_KEY, config);
  } catch (error) {
    // Mantem ultimo valor local como fallback visual.
  }

  storeConfigForm.elements.name.value = config.name || "";
  storeConfigForm.elements.phone.value = config.phone || "";
  storeConfigForm.elements.address.value = config.address || "";
  storeConfigForm.elements.deliveryFee.value = config.deliveryFee || "";
  storeConfigForm.elements.openingHours.value = config.openingHours || "";
  storeConfigForm.elements.deliveryAreas.value = config.deliveryAreas || "";
  storeConfigForm.querySelectorAll("input[name='payments']").forEach(input => {
    input.checked = (config.payments || []).includes(input.value);
  });
}

storeConfigForm.addEventListener("submit", async event => {
  event.preventDefault();
  const data = new FormData(storeConfigForm);
  const payload = {
    name: data.get("name"),
    phone: data.get("phone"),
    address: data.get("address"),
    deliveryFee: data.get("deliveryFee"),
    openingHours: data.get("openingHours"),
    deliveryAreas: data.get("deliveryAreas"),
    payments: data.getAll("payments")
  };

  try {
    await api("/configuracoes", { method: "PUT", body: JSON.stringify(payload) });
    saveJson(STORE_CONFIG_KEY, payload);
    notify("Configuracoes salvas.");
  } catch (error) {
    notify("Nao foi possivel salvar configuracoes no backend.", "error");
  }
});

productForm.addEventListener("submit", async event => {
  event.preventDefault();
  const id = document.getElementById("productId").value;
  const payload = productPayload();

  if (!payload.nome_produto || !payload.preco) {
    notify("Informe nome e preco do produto.", "error");
    return;
  }

  try {
    if (id) {
      await api(`/admin/produtos/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await api("/admin/produtos", { method: "POST", body: JSON.stringify(payload) });
    }
    clearProductForm();
    await loadProducts();
    await loadCategories();
    await loadDashboard();
    notify("Produto salvo.");
  } catch (error) {
    notify("Nao foi possivel salvar o produto.", "error");
  }
});

produtosLista.addEventListener("click", event => {
  const id = event.target.dataset.editProduct;
  if (id) {
    showPage("produtos");
    editProduct(id);
  }

  const deleteId = event.target.dataset.deleteProduct;
  if (deleteId && confirm("Remover este produto do cardapio?")) {
    api(`/admin/produtos/${deleteId}`, { method: "DELETE" })
      .then(async data => {
        notify(data.message || "Produto removido.");
        await loadProducts();
        await loadDashboard();
      })
      .catch(() => notify("Nao foi possivel remover o produto.", "error"));
  }
});

categoryForm.addEventListener("submit", async event => {
  event.preventDefault();
  const id = document.getElementById("categoryId").value;
  const nome = document.getElementById("categoryName").value.trim();
  if (!nome) {
    notify("Informe o nome da categoria.", "error");
    return;
  }

  try {
    if (id) await api(`/admin/categorias/${id}`, { method: "PUT", body: JSON.stringify({ nome_categoria: nome }) });
    else await api("/admin/categorias", { method: "POST", body: JSON.stringify({ nome_categoria: nome }) });
    clearCategoryForm();
    await loadCategories();
    notify("Categoria salva.");
  } catch (error) {
    notify("Nao foi possivel salvar a categoria.", "error");
  }
});

categoriasLista.addEventListener("click", event => {
  const id = event.target.dataset.editCategory;
  if (id) editCategory(id);
});

caixaComandas?.addEventListener("click", event => {
  const id = event.target.dataset.printOrder;
  if (id) printOrder(id);
});

document.getElementById("clearProductForm").addEventListener("click", clearProductForm);
document.getElementById("clearCategoryForm").addEventListener("click", clearCategoryForm);

pageLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showPage(link.dataset.pageLink);
  });
});

seletor.addEventListener("change", () => renderChart(seletor.value));

renderChart();
fillStoreConfig();
loadDashboard();
loadCaixa();
renderCustomersSummary();
loadCategories();
loadProducts();
showPage((window.location.hash || "#dashboard").replace("#", ""));
