const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3333);

const stages = [
  { id: "novo", label: "Novo" },
  { id: "conversa", label: "Em conversa" },
  { id: "orcamento", label: "Orcamento enviado" },
  { id: "fechado", label: "Fechado" },
  { id: "perdido", label: "Perdido" }
];

const planRules = {
  "Plano inicial": { users: 2, leads: 100 },
  "Plano profissional": { users: 10, leads: 2000 },
  "Plano premium": { users: Infinity, leads: Infinity }
};

const state = {
  sessions: new Map(),
  workspaces: new Map()
};

function slug(value) {
  return String(value || "demo")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "demo";
}

function seedWorkspace(workspaceName = "NexoCRM Demo", email = "demo@nexocrm.com", name = "Usuario Demo") {
  const workspaceId = slug(workspaceName);

  if (!state.workspaces.has(workspaceId)) {
    state.workspaces.set(workspaceId, {
      id: workspaceId,
      settings: {
        companyName: workspaceName,
        segment: "Vendas pelo WhatsApp",
        plan: "Plano inicial",
        defaultOwner: name,
        autoReminder: true,
        restrictDelete: true,
        whatsappTemplate: "Ola, {{nome}}. Tudo bem? Estou retornando sobre {{interesse}}."
      },
      users: [{ id: Date.now(), name, email, password: "demo123", role: "Admin", status: "Ativo" }],
      clients: demoClients(name)
    });
  }

  return state.workspaces.get(workspaceId);
}

function demoClients(owner) {
  return [
    { id: 1, name: "Clara Andrade - Studio Glow", phone: "11984321002", service: "Pacote de CRM para estetica", source: "Instagram", priority: "Alta", owner, stage: "novo", value: 349.99, reminderAt: "", note: "Tem muitos pedidos no direct e perde retornos pelo WhatsApp.", tags: ["Lead quente", "Estetica"], history: ["Lead criado para demonstracao comercial."] },
    { id: 2, name: "Clinica Bella Forma", phone: "11977118822", service: "Implantacao com treinamento", source: "Indicacao", priority: "Alta", owner, stage: "conversa", value: 899.90, reminderAt: "", note: "Dona pediu uma proposta para duas atendentes acompanharem os leads.", tags: ["Alto potencial", "Equipe"], history: ["Lead recebido por indicacao."] },
    { id: 3, name: "Rafael Lima - Oficina Prime", phone: "11966442210", service: "CRM para orcamentos de oficina", source: "WhatsApp", priority: "Media", owner, stage: "orcamento", value: 499.90, reminderAt: "", note: "Aguardando aprovacao do socio.", tags: ["Orcamento enviado"], history: ["Orcamento enviado."] }
  ];
}

function json(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type, authorization"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise(resolve => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function currentWorkspace(req) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const session = state.sessions.get(token);
  if (!session) return null;

  return {
    token,
    session,
    workspace: state.workspaces.get(session.workspaceId)
  };
}

function createSession(user, workspace) {
  const token = crypto.randomUUID();
  const session = {
    token,
    email: user.email,
    name: user.name,
    role: user.role,
    workspace: workspace.settings.companyName,
    workspaceId: workspace.id,
    plan: workspace.settings.plan
  };
  state.sessions.set(token, session);
  return session;
}

function report(workspace) {
  const total = workspace.clients.length || 1;
  const closed = workspace.clients.filter(client => client.stage === "fechado");
  return {
    conversionRate: Math.round((closed.length / total) * 100),
    clientsByStage: stages.map(stage => ({
      stage: stage.label,
      count: workspace.clients.filter(client => client.stage === stage.id).length
    })),
    openValue: workspace.clients
      .filter(client => !["fechado", "perdido"].includes(client.stage))
      .reduce((sum, client) => sum + Number(client.value || 0), 0)
  };
}

function assistantSuggestion(workspace, body) {
  const client = workspace.clients.find(item => item.id === Number(body.clientId)) || workspace.clients[0];
  const intent = body.intent || "message";

  if (!client) return "Nenhum cliente disponivel para analisar.";
  if (intent === "summary") return `${client.name} esta em ${client.stage}, veio de ${client.source || "origem nao informada"} e tem interesse em ${client.service}.`;
  if (intent === "next") return `Proxima acao sugerida: chamar ${client.name} e confirmar interesse em ${client.service}.`;
  if (intent === "priority") return workspace.clients.slice(0, 3).map((item, index) => `${index + 1}. ${item.name} - ${item.stage}`).join("\n");
  if (intent === "help") return "Use funil, clientes, lembretes, equipe, configuracoes e planos para conduzir a demo.";
  return `Oi, ${client.name}! Tudo bem? Passando para seguir sobre ${client.service}. Posso te ajudar com alguma duvida?`;
}

seedWorkspace();

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});

  const url = new URL(req.url, `http://${req.headers.host}`);
  const body = ["POST", "PUT"].includes(req.method) ? await readBody(req) : {};
  const auth = currentWorkspace(req);

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, { ok: true, mode: "mock-memory", database: "disabled" });
    }

    if (req.method === "POST" && url.pathname === "/auth/register") {
      const workspace = seedWorkspace(body.workspace, body.email, body.name);
      const exists = workspace.users.some(user => user.email === body.email);
      if (!exists) {
        workspace.users.push({ id: Date.now(), name: body.name, email: body.email, password: body.password, role: "Admin", status: "Ativo" });
      }
      return json(res, 201, createSession(workspace.users.find(user => user.email === body.email), workspace));
    }

    if (req.method === "POST" && url.pathname === "/auth/login") {
      const workspace = seedWorkspace(body.workspace, body.email);
      const user = workspace.users.find(item => item.email === body.email);
      if (!user || user.password !== body.password) return json(res, 401, { error: "Credenciais invalidas" });
      return json(res, 200, createSession(user, workspace));
    }

    if (!auth?.workspace) return json(res, 401, { error: "Sessao obrigatoria" });

    if (req.method === "GET" && url.pathname === "/clients") return json(res, 200, auth.workspace.clients);
    if (req.method === "GET" && url.pathname === "/team") return json(res, 200, auth.workspace.users);
    if (req.method === "GET" && url.pathname === "/settings") return json(res, 200, auth.workspace.settings);
    if (req.method === "GET" && url.pathname === "/plans") return json(res, 200, planRules);
    if (req.method === "GET" && url.pathname === "/reports/summary") return json(res, 200, report(auth.workspace));

    if (req.method === "POST" && url.pathname === "/assistant/suggest") {
      return json(res, 200, { answer: assistantSuggestion(auth.workspace, body) });
    }

    if (req.method === "POST" && url.pathname === "/clients") {
      const limit = planRules[auth.workspace.settings.plan]?.leads || 100;
      if (limit !== Infinity && auth.workspace.clients.length >= limit) return json(res, 403, { error: "Limite de leads atingido" });
      const client = { id: Date.now(), ...body, history: ["Cliente criado pela API mock."] };
      auth.workspace.clients.unshift(client);
      return json(res, 201, client);
    }

    if (req.method === "POST" && url.pathname === "/team") {
      const limit = planRules[auth.workspace.settings.plan]?.users || 2;
      if (limit !== Infinity && auth.workspace.users.length >= limit) return json(res, 403, { error: "Limite de usuarios atingido" });
      const user = { id: Date.now(), ...body, status: "Convidado" };
      auth.workspace.users.push(user);
      return json(res, 201, user);
    }

    if (req.method === "PUT" && url.pathname === "/settings") {
      auth.workspace.settings = { ...auth.workspace.settings, ...body };
      return json(res, 200, auth.workspace.settings);
    }

    const clientMatch = url.pathname.match(/^\/clients\/(\d+)$/);
    if (clientMatch && req.method === "PUT") {
      const id = Number(clientMatch[1]);
      const client = auth.workspace.clients.find(item => item.id === id);
      if (!client) return json(res, 404, { error: "Cliente nao encontrado" });
      Object.assign(client, body);
      return json(res, 200, client);
    }

    if (clientMatch && req.method === "DELETE") {
      const id = Number(clientMatch[1]);
      auth.workspace.clients = auth.workspace.clients.filter(item => item.id !== id);
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: "Rota nao encontrada" });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`NexoCRM mock API rodando em http://127.0.0.1:${PORT}`);
  console.log("Sem banco de dados: os dados ficam em memoria e reiniciam com o servidor.");
});
