const { stages, pageCopy, demoClients, planRules, planOrder, rolePermissions } = window.NexoConfig;
const { addDaysAt, escapeHtml, money, parseMoney, todayAt } = window.NexoUtils;
const NexoApi = window.NexoLocalApi;
let currentSession = NexoApi.loadSession();
let clients = loadClients();
let workspaceSettings = NexoApi.loadSettings(currentSession?.workspaceId || "demo", currentSession);
let members = NexoApi.loadMembers(currentSession?.workspaceId || "demo", currentSession);
let draggedId = null;
let currentView = "funil";
let selectedClientId = null;

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const recoveryForm = document.getElementById("recoveryForm");
const loginMessage = document.getElementById("loginMessage");
const authCardTitle = document.getElementById("authCardTitle");
const authCardText = document.getElementById("authCardText");
const demoLoginBtn = document.getElementById("demoLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const accountEmail = document.getElementById("accountEmail");
const accountWorkspace = document.getElementById("accountWorkspace");
const accountRole = document.getElementById("accountRole");
const workspacePlan = document.getElementById("workspacePlan");
const memberForm = document.getElementById("memberForm");
const settingsForm = document.getElementById("settingsForm");
const currentRole = document.getElementById("currentRole");
const assistantClient = document.getElementById("assistantClient");
const assistantIntent = document.getElementById("assistantIntent");
const assistantQuestion = document.getElementById("assistantQuestion");
const assistantAnswer = document.getElementById("assistantAnswer");
const assistantContext = document.getElementById("assistantContext");
const onboardingBackdrop = document.getElementById("onboardingBackdrop");
const onboardingForm = document.getElementById("onboardingForm");
const apiMode = document.getElementById("apiMode");
const apiBaseUrl = document.getElementById("apiBaseUrl");
const apiStatus = document.getElementById("apiStatus");
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

function loadClients() {
  const source = NexoApi.loadClients(currentSession?.workspaceId || "demo");

  return source.map(client => ({
    ...client,
    source: client.source || inferSource(client),
    priority: client.priority || "Media",
    owner: client.owner || "Yurim",
    reminderAt: client.reminderAt || migrateReminder(client.reminder),
    history: client.history || ["Cliente importado para o painel."]
  }));
}

function reloadWorkspaceState() {
  const workspaceId = currentSession?.workspaceId || "demo";
  clients = loadClients();
  workspaceSettings = NexoApi.loadSettings(workspaceId, currentSession);
  members = NexoApi.loadMembers(workspaceId, currentSession);
}

function inferSource(client) {
  const tags = (client.tags || []).join(" ").toLowerCase();
  if (tags.includes("instagram")) return "Instagram";
  if (tags.includes("indicacao")) return "Indicacao";
  if (tags.includes("site")) return "Site";
  return "WhatsApp";
}

function migrateReminder(reminder) {
  const text = String(reminder || "").toLowerCase();
  if (!text) return "";

  const timeMatch = text.match(/(\d{1,2})h(?:(\d{2}))?/);
  const hour = timeMatch ? Number(timeMatch[1]) : 17;
  const minute = timeMatch?.[2] ? Number(timeMatch[2]) : 0;

  if (text.includes("amanha")) return addDaysAt(1, hour, minute);
  if (text.includes("hoje")) return todayAt(hour, minute);
  return "";
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
  const template = workspaceSettings.whatsappTemplate || "Ola, {{nome}}. Tudo bem? Estou retornando sobre {{interesse}}.";
  const message = template
    .replaceAll("{{nome}}", client.name)
    .replaceAll("{{interesse}}", client.service)
    .replaceAll("{{empresa}}", workspaceSettings.companyName || currentSession?.workspace || "NexoCRM");
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
  NexoApi.saveClients(currentSession?.workspaceId || "demo", clients);
}

function saveWorkspaceSettings() {
  NexoApi.saveSettings(currentSession?.workspaceId || "demo", workspaceSettings);
}

function saveMembers() {
  NexoApi.saveMembers(currentSession?.workspaceId || "demo", members);
}

function permissions() {
  return rolePermissions[currentSession?.role || "Admin"] || rolePermissions.Admin;
}

function currentPlan() {
  return planRules[workspaceSettings.plan] || planRules["Plano inicial"];
}

function formatLimit(value) {
  return value === Infinity ? "Ilimitado" : String(value);
}

function usagePercent(used, limit) {
  if (limit === Infinity) return 12;
  return Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
}

function hasCapacity(kind) {
  const plan = currentPlan();
  if (kind === "leads") return plan.leads === Infinity || clients.length < plan.leads;
  if (kind === "users") return plan.users === Infinity || members.length < plan.users;
  return true;
}

function can(action) {
  if (action === "deleteClient" && workspaceSettings.restrictDelete === false) return true;
  return Boolean(permissions()[action]);
}

function setAuthState() {
  document.body.classList.toggle("is-authenticated", Boolean(currentSession));

  if (!currentSession) {
    accountEmail.textContent = "";
    accountWorkspace.textContent = "";
    accountRole.textContent = "";
    workspacePlan.textContent = "Plano demo";
    return;
  }

  accountEmail.textContent = currentSession.email;
  accountWorkspace.textContent = workspaceSettings.companyName || currentSession.workspace;
  accountRole.textContent = currentSession.role || "Admin";
  workspacePlan.textContent = workspaceSettings.plan || currentSession.plan || "Plano demo";
}

function signIn(email, password, workspace, remember) {
  if (!email || !workspace || String(password || "").length < 6) {
    showAuthMessage("Informe e-mail, senha com 6 caracteres e workspace.", "error");
    return;
  }

  try {
    currentSession = NexoApi.signIn({ email, password, workspace, remember });
  } catch (error) {
    showAuthMessage(error.message, "error");
    return;
  }

  reloadWorkspaceState();
  selectedClientId = null;
  search.value = "";
  showAuthMessage("", "error");
  closeModal();
  closeDetails();
  setView("funil");
  setAuthState();
  render();
  showToast("Login realizado em " + currentSession.workspace + ".");
}

function signUp(name, email, password, workspace) {
  if (!name || !email || !workspace || String(password || "").length < 6) {
    showAuthMessage("Preencha nome, e-mail, empresa e senha com 6 caracteres.", "error");
    return;
  }

  try {
    currentSession = NexoApi.signUp({ name, email, password, workspace });
    NexoApi.saveSession(currentSession, true);
  } catch (error) {
    showAuthMessage(error.message, "error");
    return;
  }

  reloadWorkspaceState();
  selectedClientId = null;
  search.value = "";
  showAuthMessage("", "error");
  setView("funil");
  setAuthState();
  render();
  openOnboarding();
  showToast("Workspace criado para " + currentSession.workspace + ".");
}

function requestRecovery(email) {
  if (!email) {
    showAuthMessage("Informe o e-mail para recuperar o acesso.", "error");
    return;
  }

  NexoApi.requestPasswordRecovery(email);
  showAuthMessage("Instrucoes simuladas geradas para " + email + ".", "success");
}

function signOut() {
  NexoApi.clearSession();
  currentSession = null;
  selectedClientId = null;
  closeModal();
  closeDetails();
  setAuthState();
  showToast("Sessao encerrada.");
}

function setCurrentRole(role) {
  if (!currentSession) return;

  currentSession.role = role;
  NexoApi.saveSession(currentSession, true);
  const currentMember = members.find(member => member.email === currentSession.email);

  if (currentMember) {
    currentMember.role = role;
    saveMembers();
  }

  setAuthState();
  if (currentView === "relatorios" && !can("viewReports")) {
    setView("funil");
  }
  render();
  showToast("Papel alterado para " + role + ".");
}

function showAuthMessage(message, tone = "error") {
  loginMessage.textContent = message;
  loginMessage.classList.toggle("success", tone === "success");
}

function setAuthMode(mode) {
  const copy = {
    login: ["Login", "Acesse com seu e-mail corporativo ou use a demo."],
    signup: ["Criar conta", "Crie um workspace local para apresentar o fluxo SaaS."],
    recovery: ["Recuperar acesso", "Simule o envio de instrucoes sem conectar banco ou e-mail real."]
  };

  document.querySelectorAll("[data-auth-mode]").forEach(button => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });

  document.querySelectorAll("[data-auth-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.authPanel === mode);
  });

  authCardTitle.textContent = copy[mode][0];
  authCardText.textContent = copy[mode][1];
  showAuthMessage("", "error");
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
  const quotes = clients.filter(client => client.stage === "orcamento");
  const criticalReminders = clients.filter(client => ["late", "today"].includes(reminderStatus(client)));
  const pipeline = active.reduce((sum, client) => sum + Number(client.value || 0), 0);

  document.getElementById("activeCount").textContent = active.length;
  document.getElementById("quoteCount").textContent = quotes.length;
  document.getElementById("reminderCount").textContent = criticalReminders.length;
  document.getElementById("pipelineValue").textContent = money(pipeline);

  document.getElementById("activeHint").textContent = active.length === 1
    ? "1 oportunidade ainda precisa de acompanhamento"
    : `${active.length} oportunidades ainda precisam de acompanhamento`;
  document.getElementById("quoteHint").textContent = quotes.length
    ? `${money(quotes.reduce((sum, client) => sum + Number(client.value || 0), 0))} em propostas abertas`
    : "Nenhuma proposta aberta neste momento";
  document.getElementById("reminderHint").textContent = criticalReminders.length
    ? "Use esta lista para mostrar urgencia comercial"
    : "Sem retorno critico agora";
  document.getElementById("pipelineHint").textContent = pipeline
    ? "Valor que justifica a rotina e a mensalidade"
    : "Cadastre leads para demonstrar potencial";
}

function renderClientsTable() {
  const rows = document.getElementById("clientRows");
  const visible = filteredClients();

  rows.innerHTML = visible.map(client => `
    <tr>
      <td data-label="Nome"><button class="link-btn js-details" type="button" data-id="${client.id}">${escapeHtml(client.name)}</button></td>
      <td data-label="WhatsApp">${escapeHtml(client.phone)}</td>
      <td data-label="Interesse">${escapeHtml(client.service)}</td>
      <td data-label="Origem">${escapeHtml(client.source || "-")}</td>
      <td data-label="Prioridade"><span class="stage-pill priority-${String(client.priority || "").toLowerCase()}">${escapeHtml(client.priority || "Media")}</span></td>
      <td data-label="Responsavel">${escapeHtml(client.owner || "-")}</td>
      <td data-label="Etapa"><span class="stage-pill">${stageLabel(client.stage)}</span></td>
      <td data-label="Retorno"><span class="stage-pill ${reminderStatus(client)}">${escapeHtml(reminderText(client))}</span></td>
      <td data-label="Valor">${money(client.value)}</td>
      <td data-label="Acoes">
        <div class="row-actions">
          <button class="mini-btn js-edit" type="button" data-id="${client.id}">Editar</button>
          <button class="mini-btn js-assist" type="button" data-id="${client.id}">Assistente</button>
          <button class="mini-btn danger js-delete" type="button" data-id="${client.id}" ${can("deleteClient") ? "" : "disabled"}>Excluir</button>
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

  rows.querySelectorAll(".js-assist").forEach(button => {
    button.addEventListener("click", () => openAssistantForClient(Number(button.dataset.id)));
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

function renderMembers() {
  const rows = document.getElementById("memberRows");
  if (!rows) return;

  rows.innerHTML = members.map(member => `
    <tr>
      <td data-label="Nome">${escapeHtml(member.name)}</td>
      <td data-label="E-mail">${escapeHtml(member.email)}</td>
      <td data-label="Papel"><span class="stage-pill">${escapeHtml(member.role)}</span></td>
      <td data-label="Status">${escapeHtml(member.status || "Convidado")}</td>
      <td data-label="Acoes">
        <button class="mini-btn danger js-remove-member" type="button" data-id="${member.id}" ${can("manageTeam") && member.email !== currentSession?.email ? "" : "disabled"}>Remover</button>
      </td>
    </tr>
  `).join("");

  rows.querySelectorAll(".js-remove-member").forEach(button => {
    button.addEventListener("click", () => removeMember(Number(button.dataset.id)));
  });
}

function renderPermissions() {
  const list = document.getElementById("permissionList");
  if (!list) return;

  const items = [
    ["Excluir clientes", "deleteClient"],
    ["Exportar base", "exportClients"],
    ["Recarregar demo", "reloadDemo"],
    ["Gerenciar equipe", "manageTeam"],
    ["Ver relatorios", "viewReports"],
    ["Editar configuracoes", "editSettings"]
  ];

  list.innerHTML = items.map(([label, key]) => `
    <div class="permission-item ${can(key) ? "" : "blocked"}">
      <span>${label}</span>
      <strong>${can(key) ? "Liberado" : "Bloqueado"}</strong>
    </div>
  `).join("");
}

function renderSettings() {
  const companyName = document.getElementById("companyName");
  if (!companyName) return;

  companyName.value = workspaceSettings.companyName || currentSession?.workspace || "";
  document.getElementById("companySegment").value = workspaceSettings.segment || "";
  document.getElementById("companyPlan").value = workspaceSettings.plan || "Plano demo";
  document.getElementById("defaultOwner").value = workspaceSettings.defaultOwner || "";
  document.getElementById("autoReminder").checked = Boolean(workspaceSettings.autoReminder);
  document.getElementById("restrictDelete").checked = workspaceSettings.restrictDelete !== false;
  document.getElementById("whatsappTemplate").value = workspaceSettings.whatsappTemplate || "";
  currentRole.value = currentSession?.role || "Admin";

  document.getElementById("inviteMemberBtn").classList.toggle("is-disabled", !can("manageTeam"));
  settingsForm.querySelectorAll("input, select, textarea, button").forEach(field => {
    field.disabled = !can("editSettings");
  });
}

function renderPermissionState() {
  document.getElementById("exportClientsBtn").classList.toggle("is-disabled", !can("exportClients"));
  document.getElementById("demoDataBtn").classList.toggle("is-disabled", !can("reloadDemo"));
  document.querySelector('[data-view="relatorios"]').classList.toggle("is-disabled", !can("viewReports"));
}

function renderApiConfig() {
  if (!apiMode || !window.NexoHttpApi) return;

  const config = window.NexoHttpApi.loadConfig();
  apiMode.value = config.mode;
  apiBaseUrl.value = config.baseUrl;
  apiStatus.textContent = config.mode === "mock"
    ? "Modo atual: backend mock configurado."
    : "Modo atual: local do navegador.";
  apiStatus.classList.remove("ok", "error");
}

function saveApiConfig() {
  if (!window.NexoHttpApi) return;

  window.NexoHttpApi.saveConfig({
    mode: apiMode.value,
    baseUrl: apiBaseUrl.value.trim() || "http://127.0.0.1:3333"
  });
  renderApiConfig();
}

function openOnboarding() {
  if (!currentSession) return;

  document.getElementById("onboardingCompany").value = workspaceSettings.companyName || currentSession.workspace || "";
  document.getElementById("onboardingSegment").value = workspaceSettings.segment || "";
  onboardingBackdrop.classList.add("open");
}

function closeOnboarding() {
  onboardingBackdrop.classList.remove("open");
  onboardingForm.reset();
}

function applyOnboarding(data) {
  workspaceSettings = {
    ...workspaceSettings,
    companyName: data.get("company") || workspaceSettings.companyName,
    segment: data.get("segment") || workspaceSettings.segment,
    defaultOwner: currentSession?.name || workspaceSettings.defaultOwner,
    plan: workspaceSettings.plan || "Plano inicial"
  };

  if (currentSession) {
    currentSession.workspace = workspaceSettings.companyName;
    currentSession.plan = workspaceSettings.plan;
    NexoApi.saveSession(currentSession, true);
  }

  const clientName = String(data.get("client") || "").trim();
  if (clientName) {
    clients.unshift({
      id: Date.now(),
      name: clientName,
      phone: "",
      service: data.get("interest") || "Interesse inicial",
      source: data.get("channel") || "WhatsApp",
      priority: "Alta",
      owner: workspaceSettings.defaultOwner || currentSession?.name || "",
      tags: ["Onboarding"],
      stage: "novo",
      value: 0,
      reminderAt: workspaceSettings.autoReminder ? todayAt(17, 0) : "",
      note: "Primeiro lead criado no onboarding.",
      history: ["Lead criado durante os primeiros passos."]
    });
    save();
  }

  saveWorkspaceSettings();
  closeOnboarding();
  render();
  showToast("Onboarding configurado.");
}

function renderPlans() {
  const usageGrid = document.getElementById("usageGrid");
  const planGrid = document.getElementById("planGrid");
  if (!usageGrid || !planGrid) return;

  const plan = currentPlan();
  const activeClients = clients.filter(client => !["fechado", "perdido"].includes(client.stage)).length;
  const leadPercent = usagePercent(clients.length, plan.leads);
  const userPercent = usagePercent(members.length, plan.users);

  usageGrid.innerHTML = `
    <div>
      <strong>${escapeHtml(plan.name)}</strong>
      <span>Plano atual do workspace</span>
    </div>
    <div>
      <strong>${members.length}/${formatLimit(plan.users)}</strong>
      <span>Usuarios da equipe</span>
      <div class="usage-bar ${userPercent >= 85 ? "limit" : ""}"><div style="width: ${userPercent}%"></div></div>
    </div>
    <div>
      <strong>${clients.length}/${formatLimit(plan.leads)}</strong>
      <span>Clientes cadastrados</span>
      <div class="usage-bar ${leadPercent >= 85 ? "limit" : ""}"><div style="width: ${leadPercent}%"></div></div>
    </div>
    <div>
      <strong>${activeClients}</strong>
      <span>Oportunidades ativas</span>
    </div>
  `;

  planGrid.innerHTML = planOrder.map(planName => {
    const option = planRules[planName];
    const current = option.name === plan.name;

    return `
      <article class="plan-card ${current ? "current" : ""}">
        <div>
          <h3>${escapeHtml(option.name)}</h3>
          <span>${escapeHtml(option.maintenance)}</span>
        </div>
        <div class="plan-price">${escapeHtml(option.price)}</div>
        <span>${formatLimit(option.users)} usuarios • ${formatLimit(option.leads)} leads</span>
        <span>${escapeHtml(option.support)}</span>
        <ul class="plan-features">
          ${option.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
        <button class="${current ? "secondary" : "primary"} js-plan-change" type="button" data-plan="${escapeHtml(option.name)}">
          ${current ? "Plano atual" : "Simular upgrade"}
        </button>
      </article>
    `;
  }).join("");

  planGrid.querySelectorAll(".js-plan-change").forEach(button => {
    button.addEventListener("click", () => changePlan(button.dataset.plan));
  });
}

function selectedAssistantClient() {
  const id = Number(assistantClient?.value || 0);
  return clients.find(client => client.id === id) || sortedReminders(clients)[0] || clients[0] || null;
}

function clientPain(client) {
  const note = String(client?.note || "").toLowerCase();
  if (note.includes("retorno") || note.includes("perde")) return "perda de retornos no WhatsApp";
  if (note.includes("orcamento") || note.includes("proposta")) return "controle de propostas abertas";
  if (note.includes("equipe") || note.includes("atendente")) return "organizacao da equipe comercial";
  return client?.service || "organizacao dos atendimentos";
}

function clientSummary(client) {
  if (!client) return "Nenhum cliente selecionado.";

  return `${client.name} veio de ${client.source || "origem nao informada"}, esta na etapa ${stageLabel(client.stage)} e tem prioridade ${client.priority || "Media"}. Interesse: ${client.service}. Dor principal: ${clientPain(client)}. Valor estimado: ${money(client.value)}. Retorno: ${reminderText(client)}.`;
}

function suggestedMessage(client, extra = "") {
  if (!client) return "Selecione um cliente para gerar a mensagem.";

  const status = reminderStatus(client);
  const pain = clientPain(client);
  const stage = client.stage;
  let message = `Oi, ${client.name}! Tudo bem?`;

  if (stage === "novo") {
    message += ` Vi seu interesse em ${client.service} e queria entender melhor como voces lidam hoje com ${pain}.`;
  } else if (stage === "conversa") {
    message += ` Passando para seguir nossa conversa sobre ${client.service}. Pelo que entendi, o ponto principal e ${pain}.`;
  } else if (stage === "orcamento") {
    message += ` Conseguiu avaliar a proposta sobre ${client.service}? Posso tirar alguma duvida para avancarmos?`;
  } else if (stage === "fechado") {
    message += ` Obrigado pela confianca. Vou deixar os proximos passos organizados para a implantacao.`;
  } else {
    message += ` Sei que talvez agora nao seja o melhor momento, mas posso te chamar quando fizer sentido retomar ${client.service}?`;
  }

  if (status === "late") message += " Vi que nosso retorno ficou pendente, entao quis te chamar por aqui.";
  if (extra) message += `\n\nAjuste solicitado: ${extra}`;

  return message;
}

function nextAction(client) {
  if (!client) return "Cadastre ou selecione um cliente para receber uma sugestao.";

  if (reminderStatus(client) === "late") {
    return `Prioridade alta: chamar ${client.name} agora, porque o retorno esta atrasado. Use uma mensagem curta e direta sobre ${clientPain(client)}.`;
  }

  if (client.stage === "novo") return `Mover ${client.name} para conversa depois do primeiro contato e registrar a dor principal.`;
  if (client.stage === "conversa") return `Marcar retorno com ${client.name} e transformar a conversa em proposta objetiva.`;
  if (client.stage === "orcamento") return `Fazer follow-up com ${client.name}, reforcando valor e removendo duvidas antes do fechamento.`;
  if (client.stage === "fechado") return `Registrar proximos passos de implantacao para ${client.name}.`;
  return `Agendar reativacao futura para ${client.name}, sem insistir agora.`;
}

function priorityList() {
  const scored = clients.map(client => {
    let score = 0;
    if (client.priority === "Alta") score += 3;
    if (reminderStatus(client) === "late") score += 4;
    if (reminderStatus(client) === "today") score += 2;
    if (client.stage === "orcamento") score += 2;
    if (client.stage === "conversa") score += 1;
    return { client, score };
  }).sort((first, second) => second.score - first.score);

  const top = scored.filter(item => item.score > 0).slice(0, 4);
  if (!top.length) return "Nenhuma prioridade critica agora. Foque em novos leads e mantenha retornos agendados.";

  return top.map((item, index) => {
    const client = item.client;
    return `${index + 1}. ${client.name} - ${stageLabel(client.stage)}, ${statusLabel(client)}, ${money(client.value)}. Acao: ${nextAction(client)}`;
  }).join("\n\n");
}

function systemHelp(question) {
  const text = String(question || "").toLowerCase();
  if (text.includes("export")) return "Para exportar, use o botao Exportar no topo. Admin e Gestor podem exportar; Atendente fica bloqueado nesta demo.";
  if (text.includes("equipe") || text.includes("usuario")) return "Abra Equipe para adicionar membros, mudar papeis e testar permissoes simuladas.";
  if (text.includes("plano")) return "Abra Planos para ver limites, uso atual e simular upgrade entre Inicial, Profissional e Premium.";
  if (text.includes("excluir")) return "A exclusao depende do papel e da preferencia Bloquear exclusao para atendentes, em Config.";
  return "Use o funil para mover oportunidades, Clientes para consultar a base, Lembretes para retornos, Equipe para permissoes e Config para preferencias do workspace.";
}

function assistantResponse(intent, client, question = "") {
  if (intent === "summary") return clientSummary(client);
  if (intent === "next") return nextAction(client);
  if (intent === "priority") return priorityList();
  if (intent === "help") return systemHelp(question);
  return suggestedMessage(client, question);
}

function renderAssistant() {
  if (!assistantClient) return;

  const previous = assistantClient.value;
  assistantClient.innerHTML = clients.map(client => `
    <option value="${client.id}">${escapeHtml(client.name)} - ${escapeHtml(stageLabel(client.stage))}</option>
  `).join("");

  if (clients.some(client => String(client.id) === previous)) {
    assistantClient.value = previous;
  }

  const client = selectedAssistantClient();
  assistantContext.innerHTML = client ? `
    <div><span>Etapa</span><strong>${escapeHtml(stageLabel(client.stage))}</strong></div>
    <div><span>Prioridade</span><strong>${escapeHtml(client.priority || "Media")}</strong></div>
    <div><span>Retorno</span><strong>${escapeHtml(reminderText(client))}</strong></div>
    <div><span>Valor</span><strong>${money(client.value)}</strong></div>
  ` : `<div><span>Status</span><strong>Nenhum cliente cadastrado</strong></div>`;
}

function runAssistant(intent = assistantIntent.value, question = assistantQuestion.value) {
  const client = selectedAssistantClient();
  assistantIntent.value = intent;
  const response = assistantResponse(intent, client, question);

  const titles = {
    message: "Mensagem pronta",
    summary: "Resumo do cliente",
    next: "Proxima acao sugerida",
    priority: "Prioridade de atendimento",
    help: "Ajuda do sistema"
  };

  assistantAnswer.innerHTML = `
    <span class="eyebrow">${escapeHtml(titles[intent] || "Resposta do assistente")}</span>
    <p>${escapeHtml(response)}</p>
  `;
  assistantAnswer.classList.add("ready");
  renderAssistant();
}

function openAssistantForClient(id, intent = "message") {
  setView("assistente");
  renderAssistant();
  assistantClient.value = String(id);
  assistantIntent.value = intent;
  runAssistant(intent, assistantQuestion.value);
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
      <button class="secondary" type="button" id="detailAssist">Assistente</button>
      <button class="secondary danger" type="button" id="detailDelete">Excluir</button>
    </div>
    <div class="history-list">
      <h3>Historico</h3>
      ${(client.history || []).map(item => `<div class="summary-item"><span>${escapeHtml(item)}</span></div>`).join("")}
    </div>
  `;

  document.getElementById("detailWhatsapp").addEventListener("click", () => openWhatsApp(client));
  document.getElementById("detailEdit").addEventListener("click", () => openModal(client.id));
  document.getElementById("detailAssist").addEventListener("click", () => {
    closeDetails();
    openAssistantForClient(client.id);
  });
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

  if (!can("deleteClient")) {
    showToast("Seu papel atual nao permite excluir clientes.");
    return;
  }

  if (!window.confirm("Excluir " + client.name + "?")) return;

  clients = clients.filter(item => item.id !== id);
  save();
  closeDetails();
  render();
  showToast("Cliente excluido.");
}

function setView(view) {
  if (view === "relatorios" && !can("viewReports")) {
    showToast("Atendente nao acessa relatorios nesta demo.");
    return;
  }

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
  setAuthState();
  renderPermissionState();
  renderMetrics();
  renderBoard();
  renderAside();
  renderClientsTable();
  renderReminderCards();
  renderReports();
  renderMembers();
  renderPermissions();
  renderSettings();
  renderPlans();
  renderAssistant();
  renderApiConfig();

  if (selectedClientId && clients.some(client => client.id === selectedClientId)) {
    openDetails(selectedClientId);
  }
}

function addMember(name, email, role) {
  if (!can("manageTeam")) {
    showToast("Seu papel atual nao permite gerenciar equipe.");
    return;
  }

  if (!hasCapacity("users")) {
    showToast("Limite de usuarios do plano atingido.");
    setView("planos");
    return;
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (members.some(member => member.email === normalizedEmail)) {
    showToast("Este e-mail ja esta na equipe.");
    return;
  }

  members.push({
    id: Date.now(),
    name: String(name || "").trim(),
    email: normalizedEmail,
    role,
    status: "Convidado"
  });

  saveMembers();
  render();
  showToast("Membro adicionado a equipe.");
}

function removeMember(id) {
  if (!can("manageTeam")) {
    showToast("Seu papel atual nao permite remover membros.");
    return;
  }

  members = members.filter(member => member.id !== id);
  saveMembers();
  render();
  showToast("Membro removido.");
}

function changePlan(planName) {
  if (workspaceSettings.plan === planName) {
    showToast("Este ja e o plano atual.");
    return;
  }

  workspaceSettings.plan = planName;
  if (currentSession) {
    currentSession.plan = planName;
    NexoApi.saveSession(currentSession, true);
  }

  saveWorkspaceSettings();
  render();
  showToast("Plano alterado para " + planName + ".");
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
  } else {
    document.getElementById("owner").value = workspaceSettings.defaultOwner || currentSession?.name || "";
    if (workspaceSettings.autoReminder) {
      document.getElementById("reminder").value = todayAt(17, 0);
    }
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

document.querySelectorAll("[data-view-target]").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.viewTarget));
});

document.getElementById("openModal").addEventListener("click", () => openModal());
document.getElementById("openModalClients").addEventListener("click", () => openModal());
document.getElementById("exportClientsBtn").addEventListener("click", () => {
  if (!can("exportClients")) {
    showToast("Seu papel atual nao permite exportar clientes.");
    return;
  }

  exportClients();
});
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
document.getElementById("closeDrawer").addEventListener("click", closeDetails);
document.getElementById("drawerBackdrop").addEventListener("click", closeDetails);

document.getElementById("demoDataBtn").addEventListener("click", () => {
  if (!can("reloadDemo")) {
    showToast("Seu papel atual nao permite recarregar a demo.");
    return;
  }

  clients = demoClients.map(client => ({ ...client, history: [...client.history] }));
  save();
  closeDetails();
  render();
  showToast("Dados ficticios recarregados.");
});

document.querySelectorAll("[data-auth-mode]").forEach(button => {
  button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
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

signupForm.addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(signupForm);
  signUp(
    data.get("name"),
    data.get("email"),
    data.get("password"),
    data.get("workspace")
  );
});

recoveryForm.addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(recoveryForm);
  requestRecovery(data.get("email"));
});

memberForm.addEventListener("submit", event => {
  event.preventDefault();

  const data = new FormData(memberForm);
  addMember(data.get("name"), data.get("email"), data.get("role"));
  memberForm.reset();
});

settingsForm.addEventListener("submit", event => {
  event.preventDefault();

  if (!can("editSettings")) {
    showToast("Seu papel atual nao permite editar configuracoes.");
    return;
  }

  const data = new FormData(settingsForm);
  workspaceSettings = {
    ...workspaceSettings,
    companyName: data.get("companyName"),
    segment: data.get("segment"),
    plan: data.get("plan"),
    defaultOwner: data.get("defaultOwner")
  };

  if (currentSession) {
    currentSession.workspace = workspaceSettings.companyName;
    currentSession.plan = workspaceSettings.plan;
    NexoApi.saveSession(currentSession, true);
  }

  saveWorkspaceSettings();
  render();
  showToast("Configuracoes salvas.");
});

document.getElementById("savePreferencesBtn").addEventListener("click", () => {
  if (!can("editSettings")) {
    showToast("Seu papel atual nao permite editar preferencias.");
    return;
  }

  workspaceSettings = {
    ...workspaceSettings,
    autoReminder: document.getElementById("autoReminder").checked,
    restrictDelete: document.getElementById("restrictDelete").checked,
    whatsappTemplate: document.getElementById("whatsappTemplate").value
  };

  saveWorkspaceSettings();
  render();
  showToast("Preferencias salvas.");
});

currentRole.addEventListener("change", () => setCurrentRole(currentRole.value));

document.getElementById("askAssistantBtn").addEventListener("click", () => runAssistant());

document.querySelectorAll("[data-assistant-preset]").forEach(button => {
  button.addEventListener("click", () => {
    const intent = button.dataset.assistantPreset;
    if (intent === "message" && !assistantQuestion.value.trim()) {
      assistantQuestion.value = "Mensagem objetiva e amigavel";
    }
    runAssistant(intent, assistantQuestion.value);
  });
});

apiMode.addEventListener("change", saveApiConfig);
apiBaseUrl.addEventListener("change", saveApiConfig);

document.getElementById("testApiBtn").addEventListener("click", async () => {
  saveApiConfig();
  try {
    const health = await window.NexoHttpApi.health();
    apiStatus.textContent = `API online: ${health.mode}. Banco: ${health.database}.`;
    apiStatus.classList.add("ok");
    apiStatus.classList.remove("error");
  } catch (error) {
    apiStatus.textContent = "Nao foi possivel conectar na API mock.";
    apiStatus.classList.add("error");
    apiStatus.classList.remove("ok");
  }
});

document.getElementById("importApiBtn").addEventListener("click", async () => {
  saveApiConfig();
  try {
    const login = await window.NexoHttpApi.login({
      email: "demo@nexocrm.com",
      password: "demo123",
      workspace: "NexoCRM Demo"
    });
    window.NexoHttpApi.saveConfig({ token: login.token, mode: "mock" });
    const remoteClients = await window.NexoHttpApi.clients();
    clients = remoteClients.map(client => ({ ...client, history: client.history || ["Importado da API mock."] }));
    save();
    render();
    apiStatus.textContent = "Clientes importados da API mock para a demo local.";
    apiStatus.classList.add("ok");
    apiStatus.classList.remove("error");
  } catch (error) {
    apiStatus.textContent = "Falha ao importar dados da API mock.";
    apiStatus.classList.add("error");
    apiStatus.classList.remove("ok");
  }
});

document.getElementById("closeOnboarding").addEventListener("click", closeOnboarding);
document.getElementById("skipOnboarding").addEventListener("click", closeOnboarding);
onboardingBackdrop.addEventListener("click", event => {
  if (event.target === onboardingBackdrop) closeOnboarding();
});
onboardingForm.addEventListener("submit", event => {
  event.preventDefault();
  applyOnboarding(new FormData(onboardingForm));
});

document.getElementById("copyAssistantBtn").addEventListener("click", async () => {
  const text = assistantAnswer.innerText.replace("Sugestao", "").trim();
  if (!text) {
    showToast("Gere uma sugestao primeiro.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast("Resposta copiada.");
  } catch (error) {
    showToast("Nao foi possivel copiar automaticamente.");
  }
});

document.querySelectorAll("[data-assistant-shortcut]").forEach(button => {
  button.addEventListener("click", () => {
    const shortcut = button.dataset.assistantShortcut;
    if (shortcut === "late") {
      const late = clients.find(client => reminderStatus(client) === "late") || selectedAssistantClient();
      if (late) assistantClient.value = String(late.id);
      assistantQuestion.value = "Mensagem curta para retorno atrasado";
      runAssistant("message", assistantQuestion.value);
      return;
    }

    if (shortcut === "proposal") {
      const proposal = clients.find(client => client.stage === "orcamento") || selectedAssistantClient();
      if (proposal) assistantClient.value = String(proposal.id);
      assistantQuestion.value = "Follow-up de proposta enviada";
      runAssistant("message", assistantQuestion.value);
      return;
    }

    runAssistant(shortcut === "help" ? "help" : "priority", shortcut === "help" ? "Como usar o CRM?" : "");
  });
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
    if (!hasCapacity("leads")) {
      closeModal();
      setView("planos");
      showToast("Limite de clientes do plano atingido.");
      return;
    }

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
