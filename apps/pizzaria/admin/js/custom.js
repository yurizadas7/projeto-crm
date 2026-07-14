const btnDark = document.getElementById("darkModeBtn");
const ctx = document.getElementById("graficoVendas");
const seletor = document.getElementById("periodoGrafico");
const LOCAL_ORDERS_KEY = "yulipeLocalOrders";
const STORE_CONFIG_KEY = "yulipeStoreConfig";
const storeConfigForm = document.getElementById("storeConfigForm");
const clientesResumo = document.getElementById("clientesResumo");

const dados = {
  semana: {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"],
    valores: [1200, 1900, 1500, 2400, 3200, 4500, 3900]
  },
  mes: {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    valores: [12000, 14500, 16800, 18200]
  },
  ano: {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    valores: [32000, 35000, 41000, 38000, 47000, 51000, 49000, 56000, 62000, 68000, 73000, 81000]
  }
};

let grafico = null;

const defaultStoreConfig = {
  name: "Pizzaria do Yulipe",
  phone: "11999990000",
  address: "Rua Exemplo, 123",
  deliveryFee: "5,00",
  openingHours: "18h as 23h",
  deliveryAreas: "Centro, Jardim, Vila Nova",
  payments: ["Pix", "Cartao na entrega", "Dinheiro"]
};

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

function setThemeButton() {
  btnDark.textContent = document.body.classList.contains("dark") ? "Sol" : "Lua";
}

function drawFallbackChart(periodo) {
  const chart = ctx.getContext("2d");
  const { labels, valores } = dados[periodo];
  const width = ctx.width = ctx.clientWidth || 800;
  const height = ctx.height = 300;
  const padding = 36;
  const max = Math.max(...valores);
  const min = Math.min(...valores);
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

  chart.fillStyle = document.body.classList.contains("dark") ? "#f9fafb" : "#475467";
  chart.font = "12px Arial";
  labels.forEach((label, index) => {
    const x = padding + ((width - padding * 2) / Math.max(labels.length - 1, 1)) * index;
    chart.fillText(label, x - 10, height - 10);
  });
}

function renderChart(periodo = "semana") {
  if (window.Chart) {
    if (!grafico) {
      grafico = new Chart(ctx, {
        type: "line",
        data: {
          labels: dados[periodo].labels,
          datasets: [{
            label: "Faturamento",
            data: dados[periodo].valores,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } }
        }
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

function renderCustomersSummary() {
  const orders = loadJson(LOCAL_ORDERS_KEY, []);
  const customers = new Map();

  orders.forEach(order => {
    if (!order.cliente?.phone) return;
    const current = customers.get(order.cliente.phone) || {
      name: order.cliente.name,
      phone: order.cliente.phone,
      neighborhood: order.cliente.neighborhood,
      orders: 0,
      total: 0
    };
    current.orders += 1;
    current.total += Number(order.total || 0);
    customers.set(order.cliente.phone, current);
  });

  const list = Array.from(customers.values()).slice(0, 6);
  clientesResumo.innerHTML = list.length
    ? list.map(customer => `
      <div class="summary-item">
        <strong>${customer.name} - ${customer.phone}</strong>
        <span>${customer.neighborhood || "Bairro nao informado"} - ${customer.orders} pedido(s) - ${money(customer.total)}</span>
      </div>
    `).join("")
    : `<div class="summary-item"><strong>Nenhum cliente local ainda</strong><span>Os clientes aparecem aqui quando pedidos forem feitos no cardapio.</span></div>`;
}

function fillStoreConfig() {
  const config = loadJson(STORE_CONFIG_KEY, defaultStoreConfig);
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

storeConfigForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(storeConfigForm);
  saveJson(STORE_CONFIG_KEY, {
    name: data.get("name"),
    phone: data.get("phone"),
    address: data.get("address"),
    deliveryFee: data.get("deliveryFee"),
    openingHours: data.get("openingHours"),
    deliveryAreas: data.get("deliveryAreas"),
    payments: data.getAll("payments")
  });
  alert("Configuracoes salvas.");
});

btnDark.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  setThemeButton();
  renderChart(seletor.value);
});

seletor.addEventListener("change", () => {
  renderChart(seletor.value);
});

setThemeButton();
renderChart();
fillStoreConfig();
renderCustomersSummary();
