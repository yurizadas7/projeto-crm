(function registerPwa() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("../sw.js").catch(() => {
      // Instalacao opcional: se o navegador bloquear, o sistema segue normal.
    });
  });
}());
