window.NexoUtils = (() => {
  function toInputDateTime(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

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

  function workspaceSlug(value) {
    return String(value || "demo")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "demo";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function money(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function parseMoney(value) {
    const normalized = String(value || "0")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    return Number(normalized || 0);
  }

  return {
    addDaysAt,
    escapeHtml,
    money,
    parseMoney,
    todayAt,
    toInputDateTime,
    workspaceSlug
  };
})();
