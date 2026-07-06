const stages = [
  { id: "novo", label: "Novo" },
  { id: "conversa", label: "Em conversa" },
  { id: "orcamento", label: "Orcamento enviado" },
  { id: "fechado", label: "Fechado" },
  { id: "perdido", label: "Perdido" }
];

const demoClients = [
  { id: 1, name: "Marina Costa", phone: "11984321002", service: "Pacote estetica", stage: "novo", value: 480, reminder: "Hoje 15:30", note: "Quer comparar duas opcoes antes de fechar.", tags: ["Novo lead", "Instagram"] },
  { id: 2, name: "Clinica Bella Forma", phone: "11977118822", service: "Plano de atendimento", stage: "conversa", value: 1290, reminder: "Hoje 17:00", note: "Dona pediu uma proposta com 2 usuarios.", tags: ["Alto potencial", "Indicacao"] },
  { id: 3, name: "Rafael Lima", phone: "11966442210", service: "Manutencao mensal", stage: "orcamento", value: 750, reminder: "Amanha 10:00", note: "Aguardando aprovacao do socio.", tags: ["Orcamento", "Retornar"] },
  { id: 4, name: "Studio Mares", phone: "11955221908", service: "Campanha de vendas", stage: "conversa", value: 980, reminder: "Hoje 11:40", note: "Precisa responder clientes mais rapido.", tags: ["WhatsApp", "Urgente"] },
  { id: 5, name: "Ana Paula", phone: "11922334455", service: "Consultoria inicial", stage: "fechado", value: 350, reminder: "", note: "Fechou primeira mensalidade.", tags: ["Fechado", "Pix"] },
  { id: 6, name: "Oficina Central", phone: "11988776655", service: "Organizacao de clientes", stage: "novo", value: 590, reminder: "Hoje 14:10", note: "Recebe muitos contatos e perde retornos.", tags: ["WhatsApp", "Dor clara"] },
  { id: 7, name: "Loja Vitrine", phone: "11977889900", service: "CRM simples", stage: "perdido", value: 430, reminder: "", note: "Achou melhor avaliar no proximo mes.", tags: ["Perdido", "Preco"] }
];

let clients = JSON.parse(localStorage.getItem("nexocrm-clients") || "null") || demoClients;
let draggedId = null;

const board = document.getElementById("board");
const search = document.getElementById("search");
const modal = document.getElementById("modalBackdrop");
const form = document.getElementById("clientForm");
const toast = document.getElementById("toast");

function money(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function whatsappNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : "55" + digits;
}

function whatsappLink(client) {
  const number = whatsappNumber(client.phone);
  const message = `Ola, ${client.name}. Tudo bem? Estou retornando sobre ${client.service}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function initials(name) {
  return name.split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function save() {
  localStorage.setItem("nexocrm-clients", JSON.stringify(clients));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function filteredClients() {
  const query = search.value.trim().toLowerCase();
  if (!query) return clients;

  return clients.filter(client =>
    [client.name, client.phone, client.service, client.note].join(" ").toLowerCase().includes(query)
  );
}

function renderBoard() {
  const visible = filteredClients();
  board.innerHTML = "";

  stages.forEach(stage => {
    const stageClients = visible.filter(client => client.stage === stage.id);
    const column = document.createElement("section");

    column.className = "column";
    column.dataset.stage = stage.id;
    column.innerHTML = `<h2>${stage.label}<span class="count">${stageClients.length}</span></h2>`;

    column.addEventListener("dragover", event => event.preventDefault());
    column.addEventListener("drop", () => {
      const client = clients.find(item => item.id === draggedId);

      if (client && client.stage !== stage.id) {
        client.stage = stage.id;
        save();
        render();
        showToast("Cliente movido para " + stage.label + ".");
      }
    });

    stageClients.forEach(client => column.appendChild(createCard(client)));
    board.appendChild(column);
  });
}

function createCard(client) {
  const card = document.createElement("article");
  card.className = "card";
  card.draggable = true;
  card.addEventListener("dragstart", () => draggedId = client.id);

  const tags = (client.tags || []).map(tag => {
    const tone = tag.includes("Fechado") ? " ok" : tag.includes("Urgente") || tag.includes("Alto") ? " hot" : "";
    return `<span class="tag${tone}">${tag}</span>`;
  }).join("");

  card.innerHTML = `
    <div class="card-top">
      <div class="avatar">${initials(client.name)}</div>
      <div class="client">
        <strong>${client.name}</strong>
        <span>${client.service}</span>
      </div>
    </div>
    <div class="tag-row">${tags}</div>
    <div class="card-footer">
      <span>${client.reminder || "Sem retorno marcado"} - ${money(client.value)}</span>
      <button class="whats" type="button" title="Abrir WhatsApp" aria-label="Abrir WhatsApp de ${client.name}">
        <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.77 7.05L4 20l1.46-4.1A8 8 0 1 1 20 11.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8.8c.3 2.4 1.8 4.4 4.2 5.2l1.4-1.1 2.1.7c.1 1-.5 1.9-1.5 2.2-3.5.7-7.8-3.4-8-6.9.1-1 .9-1.7 1.9-1.6L9 8.8Z" fill="currentColor"/></svg>
      </button>
    </div>
  `;

  card.querySelector(".whats").addEventListener("click", event => {
    event.stopPropagation();

    const number = whatsappNumber(client.phone);

    if (!number) {
      showToast("Cadastre um WhatsApp para " + client.name + ".");
      return;
    }

    window.open(whatsappLink(client), "_blank", "noopener");
    showToast("WhatsApp aberto para " + client.name + ".");
  });

  return card;
}

function renderAside() {
  const reminderBox = document.getElementById("reminders");
  const todays = clients.filter(client => client.reminder && client.reminder.toLowerCase().includes("hoje"));

  reminderBox.innerHTML = todays.length
    ? todays.map(client => `
      <div class="reminder">
        <div class="time">${client.reminder.replace("Hoje ", "")}</div>
        <div>
          <strong>${client.name}</strong>
          <span>${client.note}</span>
        </div>
      </div>
    `).join("")
    : `<span style="color: var(--muted); font-size: 13px;">Nenhum retorno marcado para hoje.</span>`;
}

function renderMetrics() {
  const active = clients.filter(client => !["fechado", "perdido"].includes(client.stage));

  document.getElementById("activeCount").textContent = active.length;
  document.getElementById("quoteCount").textContent = clients.filter(client => client.stage === "orcamento").length;
  document.getElementById("reminderCount").textContent = clients.filter(client => client.reminder && client.reminder.toLowerCase().includes("hoje")).length;
  document.getElementById("pipelineValue").textContent = money(active.reduce((sum, client) => sum + Number(client.value || 0), 0));
}

function render() {
  renderBoard();
  renderAside();
  renderMetrics();
}

function openModal() {
  modal.classList.add("open");
  document.getElementById("name").focus();
}

function closeModal() {
  modal.classList.remove("open");
  form.reset();
}

document.getElementById("openModal").addEventListener("click", openModal);
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);

document.getElementById("demoDataBtn").addEventListener("click", () => {
  clients = demoClients.map(client => ({ ...client }));
  save();
  render();
  showToast("Dados ficticios recarregados.");
});

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

search.addEventListener("input", renderBoard);

form.addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(form);

  clients.unshift({
    id: Date.now(),
    name: data.get("name"),
    phone: data.get("phone"),
    service: data.get("service"),
    stage: data.get("stage"),
    value: Number(data.get("value") || 0),
    reminder: data.get("reminder"),
    note: data.get("note"),
    tags: ["Novo lead"]
  });

  save();
  closeModal();
  render();
  showToast("Cliente cadastrado na demonstracao.");
});

render();
