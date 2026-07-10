window.NexoHttpApi = (() => {
  const CONFIG_KEY = "nexocrm-api-config";
  const DEFAULT_CONFIG = {
    mode: "local",
    baseUrl: "http://127.0.0.1:3333",
    token: ""
  };

  function loadConfig() {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}") };
    } catch (error) {
      localStorage.removeItem(CONFIG_KEY);
      return { ...DEFAULT_CONFIG };
    }
  }

  function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...loadConfig(), ...config }));
  }

  async function request(path, options = {}) {
    const config = loadConfig();
    const headers = {
      "content-type": "application/json",
      ...(options.headers || {})
    };

    if (config.token) headers.authorization = "Bearer " + config.token;

    const response = await fetch(config.baseUrl.replace(/\/$/, "") + path, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Erro na API mock.");
    return payload;
  }

  return {
    loadConfig,
    saveConfig,
    request,
    health: () => request("/health"),
    login: data => request("/auth/login", { method: "POST", body: data }),
    clients: () => request("/clients"),
    team: () => request("/team"),
    settings: () => request("/settings"),
    plans: () => request("/plans"),
    assistant: data => request("/assistant/suggest", { method: "POST", body: data })
  };
})();
