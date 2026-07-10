(function () {
const { demoClients } = window.NexoConfig;
const { workspaceSlug } = window.NexoUtils;

const AUTH_KEY = "nexocrm-auth-session";
const USERS_KEY = "nexocrm-users";

window.NexoLocalApi = {
  loadSession() {
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
  },
  saveSession(session, remember) {
    const storage = remember ? localStorage : sessionStorage;

    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    storage.setItem(AUTH_KEY, JSON.stringify(session));
  },
  clearSession() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  },
  loadUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch (error) {
      localStorage.removeItem(USERS_KEY);
      return [];
    }
  },
  saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  findUser(email, workspaceId) {
    return this.loadUsers().find(user => user.email === email && user.workspaceId === workspaceId);
  },
  createSession({ email, name, workspace, role = "Admin", plan = "Plano demo" }) {
    return {
      email: String(email || "").trim().toLowerCase(),
      name: String(name || "").trim() || "Usuario",
      workspace: String(workspace || "").trim(),
      workspaceId: workspaceSlug(workspace),
      role,
      plan,
      signedAt: new Date().toISOString()
    };
  },
  signIn({ email, password, workspace, remember }) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const workspaceId = workspaceSlug(workspace);
    const user = this.findUser(normalizedEmail, workspaceId);

    if (user && user.password !== password) {
      throw new Error("Senha incorreta para este workspace.");
    }

    const session = user
      ? this.createSession(user)
      : this.createSession({ email: normalizedEmail, workspace, name: normalizedEmail.split("@")[0] });

    this.saveSession(session, remember);
    return session;
  },
  signUp({ name, email, password, workspace }) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const workspaceId = workspaceSlug(workspace);
    const users = this.loadUsers();

    if (users.some(user => user.email === normalizedEmail && user.workspaceId === workspaceId)) {
      throw new Error("Este e-mail ja existe neste workspace.");
    }

    const user = {
      name: String(name || "").trim(),
      email: normalizedEmail,
      password,
      workspace: String(workspace || "").trim(),
      workspaceId,
      role: "Admin",
      plan: "Plano inicial",
      createdAt: new Date().toISOString()
    };

    users.push(user);
    this.saveUsers(users);
    return this.createSession(user);
  },
  requestPasswordRecovery(email) {
    return {
      email: String(email || "").trim().toLowerCase(),
      requestedAt: new Date().toISOString()
    };
  },
  clientsKey(workspaceId) {
    return `nexocrm-clients:${workspaceId || "demo"}`;
  },
  settingsKey(workspaceId) {
    return `nexocrm-settings:${workspaceId || "demo"}`;
  },
  membersKey(workspaceId) {
    return `nexocrm-members:${workspaceId || "demo"}`;
  },
  loadClients(workspaceId) {
    const stored = JSON.parse(localStorage.getItem(this.clientsKey(workspaceId)) || "null");
    return stored || demoClients.map(client => ({ ...client }));
  },
  saveClients(workspaceId, items) {
    localStorage.setItem(this.clientsKey(workspaceId), JSON.stringify(items));
  },
  loadSettings(workspaceId, session) {
    const stored = JSON.parse(localStorage.getItem(this.settingsKey(workspaceId)) || "null");

    return {
      companyName: session?.workspace || "NexoCRM Demo",
      segment: "Vendas pelo WhatsApp",
      plan: session?.plan || "Plano demo",
      defaultOwner: session?.name || "Yurim",
      autoReminder: true,
      restrictDelete: true,
      whatsappTemplate: "Ola, {{nome}}. Tudo bem? Estou retornando sobre {{interesse}}.",
      ...stored
    };
  },
  saveSettings(workspaceId, settings) {
    localStorage.setItem(this.settingsKey(workspaceId), JSON.stringify(settings));
  },
  loadMembers(workspaceId, session) {
    const stored = JSON.parse(localStorage.getItem(this.membersKey(workspaceId)) || "null");
    if (stored) return stored;

    return [{
      id: Date.now(),
      name: session?.name || "Usuario principal",
      email: session?.email || "demo@nexocrm.com",
      role: session?.role || "Admin",
      status: "Ativo"
    }];
  },
  saveMembers(workspaceId, members) {
    localStorage.setItem(this.membersKey(workspaceId), JSON.stringify(members));
  }
};
})();
