const stages = [
  { id: "novo", label: "Novo" },
  { id: "conversa", label: "Em conversa" },
  { id: "orcamento", label: "Orcamento enviado" },
  { id: "fechado", label: "Fechado" },
  { id: "perdido", label: "Perdido" }
];

const pageCopy = {
  funil: {
    title: "CRM simples para vender mais pelo WhatsApp",
    subtitle: "Organize leads, propostas e retornos em uma demo pronta para apresentacao."
  },
  perfil: {
    title: "Perfil",
    subtitle: "Argumentos, beneficios e oferta sugerida para apresentar o produto."
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
  }
};

const demoClients = [
  { id: 1, name: "Clara Andrade - Studio Glow", phone: "11984321002", service: "Pacote de CRM para estetica", source: "Instagram", priority: "Alta", owner: "Yurim", stage: "novo", value: 349.99, reminderAt: todayAt(15, 30), note: "Tem muitos pedidos no direct e perde retornos pelo WhatsApp.", tags: ["Lead quente", "Estetica"], history: ["Lead criado para demonstracao comercial.", "Dor principal: falta de controle dos retornos."] },
  { id: 2, name: "Clinica Bella Forma", phone: "11977118822", service: "Implantacao com treinamento", source: "Indicacao", priority: "Alta", owner: "Yurim", stage: "conversa", value: 899.90, reminderAt: todayAt(17, 0), note: "Dona pediu uma proposta para duas atendentes acompanharem os leads.", tags: ["Alto potencial", "Equipe"], history: ["Lead recebido por indicacao.", "Conversa em andamento com alto potencial de fechamento."] },
  { id: 3, name: "Rafael Lima - Oficina Prime", phone: "11966442210", service: "CRM para orcamentos de oficina", source: "WhatsApp", priority: "Media", owner: "Yurim", stage: "orcamento", value: 499.90, reminderAt: addDaysAt(1, 10, 0), note: "Aguardando aprovacao do socio para comecar ainda esta semana.", tags: ["Orcamento enviado", "Retornar"], history: ["Orcamento enviado.", "Aguardando aprovacao interna."] },
  { id: 4, name: "Studio Mares Pilates", phone: "11955221908", service: "Organizacao de leads e retornos", source: "WhatsApp", priority: "Alta", owner: "Yurim", stage: "conversa", value: 599.90, reminderAt: todayAt(11, 40), note: "Recebe contatos pelo WhatsApp e quer saber quem precisa de retorno.", tags: ["WhatsApp", "Urgente"], history: ["Cliente relatou demora nos retornos.", "Necessidade clara de organizacao."] },
  { id: 5, name: "Ana Paula - Boutique Donna", phone: "11922334455", service: "Plano mensal de acompanhamento", source: "Instagram", priority: "Media", owner: "Yurim", stage: "fechado", value: 349.99, reminderAt: "", note: "Fechou primeira mensalidade apos ver a demo do funil.", tags: ["Fechado", "Pix"], history: ["Cliente fechada.", "Pagamento realizado por Pix."] },
  { id: 6, name: "Oficina Central", phone: "11988776655", service: "Controle de orcamentos no WhatsApp", source: "Indicacao", priority: "Alta", owner: "Yurim", stage: "novo", value: 449.90, reminderAt: todayAt(14, 10), note: "Recebe muitos contatos e nao sabe quais propostas estao abertas.", tags: ["Dor clara", "Orcamentos"], history: ["Novo lead cadastrado.", "Dor principal: perda de propostas."] },
  { id: 7, name: "Loja Vitrine Modas", phone: "11977889900", service: "CRM simples para loja", source: "Site", priority: "Baixa", owner: "Yurim", stage: "perdido", value: 299.90, reminderAt: "", note: "Preferiu avaliar no proximo mes, mas pediu contato futuro.", tags: ["Perdido", "Reativar"], history: ["Cliente recusou por enquanto.", "Pode voltar no proximo mes."] }
];

const AUTH_KEY = "nexocrm-auth-session";

let currentSession = loadAuthSession();
let clients = loadClients();
let draggedId = null;
let currentView = "funil";
let selectedClientId = null;

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const demoLoginBtn = document.getElementById("demoLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const accountEmail = document.getElementById("accountEmail");
const accountWorkspace = document.getElementById("accountWorkspace");
const board = document.getElementById("board");
const search = document.getElementById("search");
const modal = document.getElementById("modalBackdrop");
const form = document.getElementById("clientForm");
const toast = document.getElementById("toast");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const detailDrawer = document.getElementById("detailDrawer");
const detailBody = document.getElementById("detailBody");
const detailName = document.getElementById("detailName");

function todayAt(hour, minute) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return toInputDateTime(date);
}

function addDaysAt(days, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return toInputDateTime(date);
}

function loadAuthSession() {
  const stored = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored);
    return session?.email && session?.workspace ? session : null;
  } catch (error) {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    return null;
  }
}

function saveAuthSession(session, remember) {
  const storage = remember ? localStorage : sessionStorage;

  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  storage.setItem(AUTH_KEY, JSON.stringify(session));
}

function workspaceSlug(value) {
  return String(value || "demo")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "demo";
}

function clientsStorageKey() {
  const workspace = currentSession?.workspaceId || "demo";
  return `nexocrm-clients:${workspace}`;
}

function loadClients() {
  const stored = JSON.parse(localStorage.getItem(clientsStorageKey()) || "null");
  const source = stored || demoClients.map(client => ({ ...client }));

  return source.map(client => ({
    ...client,
    source: client.source || inferSource(client),
    priority: client.priority || "Media",
    owner: client.owner || "Yurim",
    reminderAt: client.reminderAt || migrateReminder(client.reminder),
    history: client.history || ["Cliente importado para o painel."]
  }));
}

function inferSource(client) {
  const tags = (client.tags || []).join(" ").toLowerCase();
  if (tags.includes("instagram")) return "Instagram";
  if (tags.includes("indicacao")) return "Indicacao";
  if (tags.includes("site")) return "Site";
  return "WhatsApp";
}

function migrateReminder(reminder) {
  if (!reminder) return "";
  const text = String(reminder).toLowerCase();
  const match = text.match(/(\d{1,2}):(\d{2})/);
  const hour = match ? Number(match[1]) : 9;
  const minute = match ? Number(match[2]) : 0;

  if (text.includes("amanha")) return addDaysAt(1, hour, minute);
  if (text.includes("hoje")) return todayAt(hour, minute);
  return "";
}

function toInputDateTime(date) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

function parseMoney(value) {
  const normalized = String(value || "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  return Number(normalized || 0);
}

function stageLabel(stageId) {
  return stages.find(stage => stage.id === stageId)?.label || stageId;
}

function reminderDate(client) {
  if (!client.reminderAt) return null;
  const date = new Date(client.reminderAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function reminderText(client) {
  const date = reminderDate(client);
  if (!date) return "Sem retorno marcado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function reminderStatus(client) {
  const date = reminderDate(client);
  if (!date) return "none";

  const now = new Date();
  const today = now.toDateString() === date.toDateString();
  if (date < now) return "late";
  if (today) return "today";
  return "future";
}

function statusLabel(client) {
  const status = reminderStatus(client);
  if (status === "late") return "Atrasado";
  if (status === "today") return "Hoje";
  if (status === "future") return "Agendado";
  return "Sem lembrete";
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
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function save() {
  localStorage.setItem(clientsStorageKey(), JSON.stringify(clients));
}

function setAuthState() {
  document.body.classList.toggle("is-authenticated", Boolean(currentSession));

  if (!currentSession) {
    accountEmail.textContent = "";
    accountWorkspace.textContent = "";
    return;
  }

  accountEmail.textContent = currentSession.email;
  accountWorkspace.textContent = currentSession.workspace;
}

function signIn(email, password, workspace, remember) {
  if (!email || !workspace || String(password || "").length < 6) {
    loginMessage.textContent = "Informe e-mail, senha com 6 caracteres e workspace.";
    return;
  }

  currentSession = {
    email: email.trim().toLowerCase(),
    workspace: workspace.trim(),
    workspaceId: workspaceSlug(workspace),
    signedAt: new Date().toISOString()
  };

  saveAuthSession(currentSession, remember);
  clients = loadClients();
  selectedClientId = null;
  search.value = "";
  loginMessage.textContent = "";
  closeModal();
  closeDetails();
  setView("funil");
  setAuthState();
  render();
  showToast("Login realizado em " + currentSession.workspace + ".");
}

function signOut() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  currentSession = null;
  selectedClientId = null;
  closeModal();
  closeDetails();
  setAuthState();
  showToast("Sessao encerrada.");
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
    [client.name, client.phone, client.service, client.source, client.priority, client.owner, client.note, stageLabel(client.stage), reminderText(client), (client.tags || []).join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query)
  );
}

function sortedReminders(list) {
  return list
    .filter(client => reminderDate(client))
    .sort((first, second) => reminderDate(first) - reminderDate(second));
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
        addHistory(client, "Etapa alterada para " + stage.label + ".");
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
  card.addEventListener("click", () => openDetails(client.id));

  const tags = (client.tags || []).map(tag => {
    const tone = tag.includes("Fechado") ? " ok" : tag.includes("Urgente") || tag.includes("Alto") ? " hot" : "";
    return `<span class="tag${tone}">${escapeHtml(tag)}</span>`;
  }).join("");

  card.innerHTML = `
    <div class="card-top">
      <div class="avatar">${escapeHtml(initials(client.name))}</div>
      <div class="client">
        <strong>${escapeHtml(client.name)}</strong>
        <span>${escapeHtml(client.service)}</span>
      </div>
    </div>
    <div class="tag-row">${tags}<span class="tag ${reminderStatus(client)}">${statusLabel(client)}</span></div>
    <div class="card-footer">
      <span>${escapeHtml(reminderText(client))} - ${money(client.value)}</span>
      <div class="row-actions">
        <button class="mini-btn js-edit" type="button" title="Editar">Editar</button>
        <button class="whats js-whatsapp" type="button" title="Abrir WhatsApp" aria-label="Abrir WhatsApp de ${escapeHtml(client.name)}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.77 7.05L4 20l1.46-4.1A8 8 0 1 1 20 11.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8.8c.3 2.4 1.8 4.4 4.2 5.2l1.4-1.1 2.1.7c.1 1-.5 1.9-1.5 2.2-3.5.7-7.8-3.4-8-6.9.1-1 .9-1.7 1.9-1.6L9 8.8Z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
  `;

  card.querySelector(".js-whatsapp").addEventListener("click", event => {
    event.stopPropagation();
    openWhatsApp(client);
  });

  card.querySelector(".js-edit").addEventListener("click", event => {
    event.stopPropagation();
    openModal(client.id);
  });

  return card;
}

function renderAside() {
  const reminderBox = document.getElementById("reminders");
  const todays = sortedReminders(clients).filter(client => ["late", "today"].includes(reminderStatus(client)));

  reminderBox.innerHTML = todays.length
    ? todays.map(client => `
      <div class="reminder ${reminderStatus(client)}">
        <div class="time">${escapeHtml(reminderText(client))}</div>
        <div>
          <strong>${escapeHtml(client.name)}</strong>
          <span>${escapeHtml(client.note || client.service)}</span>
        </div>
      </div>
    `).join("")
    : `<span style="color: var(--muted); font-size: 13px;">Nenhum retorno critico para hoje.</span>`;

  document.getElementById("activityList").innerHTML = [
    ["Controle visual", "Mostre como o cliente para de depender de memoria, papel ou mensagens perdidas."],
    ["Retorno no prazo", "Abra a tela de lembretes e destaque atrasados, hoje e agendados."],
    ["Valor comercial", "Mostre o potencial em vendas e exporte a base como fechamento da demo."]
  ].map(item => `
    <div class="activity">
      <strong>${escapeHtml(item[0])}</strong>
      <span>${escapeHtml(item[1])}</span>
    </div>
  `).join("");
}

function renderMetrics() {
  const active = clients.filter(client => !["fechado", "perdido"].includes(client.stage));

  document.getElementById("activeCount").textContent = active.length;
  document.getElementById("quoteCount").textContent = clients.filter(client => client.stage === "orcamento").length;
  document.getElementById("reminderCount").textContent = clients.filter(client => ["late", "today"].includes(reminderStatus(client))).length;
  document.getElementById("pipelineValue").textContent = money(active.reduce((sum, client) => sum + Number(client.value || 0), 0));
}

function renderClientsTable() {
  const rows = document.getElementById("clientRows");
  const visible = filteredClients();

  rows.innerHTML = visible.map(client => `
    <tr>
      <td><button class="link-btn js-details" type="button" data-id="${client.id}">${escapeHtml(client.name)}</button></td>
      <td>${escapeHtml(client.phone)}</td>
      <td>${escapeHtml(client.service)}</td>
      <td>${escapeHtml(client.source || "-")}</td>
      <td><span class="stage-pill priority-${String(client.priority || "").toLowerCase()}">${escapeHtml(client.priority || "Media")}</span></td>
      <td>${escapeHtml(client.owner || "-")}</td>
      <td><span class="stage-pill">${stageLabel(client.stage)}</span></td>
      <td><span class="stage-pill ${reminderStatus(client)}">${escapeHtml(reminderText(client))}</span></td>
      <td>${money(client.value)}</td>
      <td>
        <div class="row-actions">
          <button class="mini-btn js-edit" type="button" data-id="${client.id}">Editar</button>
          <button class="mini-btn danger js-delete" type="button" data-id="${client.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");

  rows.querySelectorAll(".js-details").forEach(button => {
    button.addEventListener("click", () => openDetails(Number(button.dataset.id)));
  });

  rows.querySelectorAll(".js-edit").forEach(button => {
    button.addEventListener("click", () => openModal(Number(button.dataset.id)));
  });

  rows.querySelectorAll(".js-delete").forEach(button => {
    button.addEventListener("click", () => deleteClient(Number(button.dataset.id)));
  });
}

function renderReminderCards() {
  const cards = document.getElementById("reminderCards");
  const visible = sortedReminders(filteredClients());

  cards.innerHTML = visible.length
    ? visible.map(client => `
      <article class="reminder-card ${reminderStatus(client)}">
        <header>
          <strong>${escapeHtml(client.name)}</strong>
          <span class="stage-pill ${reminderStatus(client)}">${escapeHtml(statusLabel(client))}</span>
        </header>
        <p>${escapeHtml(client.note || client.service)}</p>
        <div class="detail-grid">
          <div><span>Retorno</span><strong>${escapeHtml(reminderText(client))}</strong></div>
          <div><span>Etapa</span><strong>${stageLabel(client.stage)}</strong></div>
        </div>
        <div class="card-footer">
          <span>${money(client.value)}</span>
          <div class="row-actions">
            <button class="secondary js-whatsapp" type="button" data-id="${client.id}">WhatsApp</button>
            <button class="mini-btn js-edit" type="button" data-id="${client.id}">Editar</button>
          </div>
        </div>
      </article>
    `).join("")
    : `<article class="reminder-card"><strong>Nenhum lembrete encontrado</strong><p>Cadastre data e hora no cliente para ele aparecer aqui.</p></article>`;

  cards.querySelectorAll(".js-whatsapp").forEach(button => {
    button.addEventListener("click", () => {
      const client = clients.find(item => item.id === Number(button.dataset.id));
      if (client) openWhatsApp(client);
    });
  });

  cards.querySelectorAll(".js-edit").forEach(button => {
    button.addEventListener("click", () => openModal(Number(button.dataset.id)));
  });
}

function renderReports() {
  const total = clients.length || 1;
  const closed = clients.filter(client => client.stage === "fechado");
  const closedValue = closed.reduce((sum, client) => sum + Number(client.value || 0), 0);
  const counts = stages.map(stage => ({
    ...stage,
    count: clients.filter(client => client.stage === stage.id).length
  }));
  const largest = counts.reduce((best, stage) => stage.count > best.count ? stage : best, counts[0]);
  const maxCount = Math.max(...counts.map(stage => stage.count), 1);

  document.getElementById("conversionRate").textContent = Math.round((closed.length / total) * 100) + "%";
  document.getElementById("averageTicket").textContent = money(closed.length ? closedValue / closed.length : 0);
  document.getElementById("largestStage").textContent = largest.label;

  document.getElementById("stageChart").innerHTML = counts.map(stage => `
    <div class="stage-row">
      <span>${stage.label}</span>
      <div class="track"><div class="fill" style="width: ${(stage.count / maxCount) * 100}%"></div></div>
      <strong>${stage.count}</strong>
    </div>
  `).join("");

  document.getElementById("summaryList").innerHTML = [
    ["Oportunidades abertas", clients.filter(client => !["fechado", "perdido"].includes(client.stage)).length + " leads ainda podem virar venda."],
    ["Valor em aberto", money(clients.filter(client => !["fechado", "perdido"].includes(client.stage)).reduce((sum, client) => sum + Number(client.value || 0), 0)) + " em propostas abertas."],
    ["Retornos pendentes", clients.filter(client => reminderDate(client)).length + " lembretes mostram proximos passos."],
    ["Retornos atrasados", clients.filter(client => reminderStatus(client) === "late").length + " oportunidades exigem atencao."]
  ].map(item => `
    <div class="summary-item">
      <strong>${item[0]}</strong>
      <span>${item[1]}</span>
    </div>
  `).join("");
}

function openWhatsApp(client) {
  const number = whatsappNumber(client.phone);

  if (!number) {
    showToast("Cadastre um WhatsApp para " + client.name + ".");
    return;
  }

  addHistory(client, "WhatsApp aberto pelo painel.");
  save();
  render();
  window.open(whatsappLink(client), "_blank", "noopener");
  showToast("WhatsApp aberto para " + client.name + ".");
}

function addHistory(client, message) {
  client.history = client.history || [];
  const stamp = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
  client.history.unshift(`${stamp} - ${message}`);
}

function openDetails(id) {
  const client = clients.find(item => item.id === id);
  if (!client) return;

  selectedClientId = id;
  detailName.textContent = client.name;
  detailBody.innerHTML = `
    <div class="drawer-hero">
      <div class="profile-avatar">${escapeHtml(initials(client.name))}</div>
      <div>
        <span class="eyebrow">${escapeHtml(stageLabel(client.stage))}</span>
        <h3>${escapeHtml(client.service)}</h3>
        <p>${escapeHtml(client.note || "Sem observacao cadastrada.")}</p>
      </div>
    </div>
    <div class="detail-grid">
      <div><span>WhatsApp</span><strong>${escapeHtml(client.phone)}</strong></div>
      <div><span>Valor</span><strong>${money(client.value)}</strong></div>
      <div><span>Origem</span><strong>${escapeHtml(client.source || "-")}</strong></div>
      <div><span>Prioridade</span><strong>${escapeHtml(client.priority || "Media")}</strong></div>
      <div><span>Responsavel</span><strong>${escapeHtml(client.owner || "-")}</strong></div>
      <div><span>Tags</span><strong>${escapeHtml((client.tags || []).join(", ") || "-")}</strong></div>
      <div><span>Retorno</span><strong>${escapeHtml(reminderText(client))}</strong></div>
      <div><span>Status</span><strong>${escapeHtml(statusLabel(client))}</strong></div>
    </div>
    <div class="drawer-actions">
      <button class="primary" type="button" id="detailWhatsapp">WhatsApp</button>
      <button class="secondary" type="button" id="detailEdit">Editar</button>
      <button class="secondary danger" type="button" id="detailDelete">Excluir</button>
    </div>
    <div class="history-list">
      <h3>Historico</h3>
      ${(client.history || []).map(item => `<div class="summary-item"><span>${escapeHtml(item)}</span></div>`).join("")}
    </div>
  `;

  document.getElementById("detailWhatsapp").addEventListener("click", () => openWhatsApp(client));
  document.getElementById("detailEdit").addEventListener("click", () => openModal(client.id));
  document.getElementById("detailDelete").addEventListener("click", () => deleteClient(client.id));
  detailDrawer.classList.add("open");
  detailDrawer.setAttribute("aria-hidden", "false");
}

function closeDetails() {
  selectedClientId = null;
  detailDrawer.classList.remove("open");
  detailDrawer.setAttribute("aria-hidden", "true");
}

function deleteClient(id) {
  const client = clients.find(item => item.id === id);
  if (!client) return;

  if (!window.confirm("Excluir " + client.name + "?")) return;

  clients = clients.filter(item => item.id !== id);
  save();
  closeDetails();
  render();
  showToast("Cliente excluido.");
}

function setView(view) {
  currentView = view;

  document.querySelectorAll(".nav button").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  document.querySelectorAll(".view").forEach(section => {
    section.classList.toggle("active", section.id === "view-" + view);
  });

  pageTitle.textContent = pageCopy[view].title;
  pageSubtitle.textContent = pageCopy[view].subtitle;
}

function render() {
  renderMetrics();
  renderBoard();
  renderAside();
  renderClientsTable();
  renderReminderCards();
  renderReports();

  if (selectedClientId && clients.some(client => client.id === selectedClientId)) {
    openDetails(selectedClientId);
  }
}

function openModal(id = null) {
  const client = clients.find(item => item.id === id);
  form.reset();

  document.getElementById("clientId").value = client?.id || "";
  document.getElementById("modalTitle").textContent = client ? "Editar cliente" : "Novo cliente";
  document.getElementById("saveClientBtn").textContent = client ? "Salvar alteracoes" : "Salvar cliente";

  if (client) {
    document.getElementById("name").value = client.name || "";
    document.getElementById("phone").value = client.phone || "";
    document.getElementById("service").value = client.service || "";
    document.getElementById("source").value = client.source || "WhatsApp";
    document.getElementById("priority").value = client.priority || "Media";
    document.getElementById("owner").value = client.owner || "";
    document.getElementById("tags").value = (client.tags || []).join(", ");
    document.getElementById("value").value = client.value || "";
    document.getElementById("stage").value = client.stage || "novo";
    document.getElementById("reminder").value = client.reminderAt || "";
    document.getElementById("note").value = client.note || "";
  }

  modal.classList.add("open");
  document.getElementById("name").focus();
}

function closeModal() {
  modal.classList.remove("open");
  form.reset();
}

document.querySelectorAll(".nav button").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.getElementById("openModal").addEventListener("click", () => openModal());
document.getElementById("openModalClients").addEventListener("click", () => openModal());
document.getElementById("exportClientsBtn").addEventListener("click", exportClients);
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
document.getElementById("closeDrawer").addEventListener("click", closeDetails);
document.getElementById("drawerBackdrop").addEventListener("click", closeDetails);

document.getElementById("demoDataBtn").addEventListener("click", () => {
  clients = demoClients.map(client => ({ ...client, history: [...client.history] }));
  save();
  closeDetails();
  render();
  showToast("Dados ficticios recarregados.");
});

loginForm.addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(loginForm);
  signIn(
    data.get("email"),
    data.get("password"),
    data.get("workspace"),
    Boolean(data.get("remember"))
  );
});

demoLoginBtn.addEventListener("click", () => {
  document.getElementById("loginEmail").value = "demo@nexocrm.com";
  document.getElementById("loginPassword").value = "demo123";
  document.getElementById("loginWorkspace").value = "NexoCRM Demo";
  document.getElementById("loginRemember").checked = true;
  signIn("demo@nexocrm.com", "demo123", "NexoCRM Demo", true);
});

logoutBtn.addEventListener("click", signOut);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

search.addEventListener("input", render);

form.addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(form);
  const id = Number(data.get("clientId"));
  const existing = clients.find(client => client.id === id);
  const payload = {
    name: data.get("name"),
    phone: data.get("phone"),
    service: data.get("service"),
    source: data.get("source"),
    priority: data.get("priority"),
    owner: data.get("owner"),
    tags: parseTags(data.get("tags")),
    stage: data.get("stage"),
    value: parseMoney(data.get("value")),
    reminderAt: data.get("reminder"),
    note: data.get("note")
  };

  if (existing) {
    Object.assign(existing, payload);
    addHistory(existing, "Dados do cliente atualizados.");
    showToast("Cliente atualizado.");
  } else {
    clients.unshift({
      id: Date.now(),
      ...payload,
      history: ["Cliente cadastrado no painel."]
    });
    showToast("Cliente cadastrado.");
  }

  save();
  closeModal();
  render();
});

setAuthState();
render();

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

function csvCell(value) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function exportClients() {
  const headers = ["Nome", "WhatsApp", "Interesse", "Origem", "Prioridade", "Responsavel", "Etapa", "Retorno", "Valor", "Tags", "Observacao"];
  const rows = clients.map(client => [
    client.name,
    client.phone,
    client.service,
    client.source,
    client.priority,
    client.owner,
    stageLabel(client.stage),
    reminderText(client),
    money(client.value),
    (client.tags || []).join(", "),
    client.note
  ]);
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "clientes-nexocrm.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Lista de clientes exportada.");
}
