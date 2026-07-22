const API_URL = "http://127.0.0.1:3000";

const abrirLogin = document.getElementById("abrirLogin");
const modal = document.getElementById("modalLogin");
const fechar = document.querySelector(".fechar");
const abrirCozinha = document.getElementById("abrirCozinha");
const abrirEntregador = document.getElementById("abrirEntregador");
const codigoInput = document.getElementById("codigo");
const pinInput = document.getElementById("pin");
const btnEntrar = document.getElementById("btnEntrar");
const loginMessage = document.getElementById("loginMessage");

function setLoginMessage(message, type = "error") {
  loginMessage.textContent = message;
  loginMessage.className = `login-message ${type}`;
}

function abrirModal() {
  modal.classList.add("ativo");
  modal.setAttribute("aria-hidden", "false");
  setLoginMessage("", "");
  codigoInput.focus();
}

function fecharModal() {
  modal.classList.remove("ativo");
  modal.setAttribute("aria-hidden", "true");
}

function entrarNaCozinha() {
  window.location.href = "../cozinha/index.html";
}

function entrarNasEntregas() {
  window.location.href = "../entregador/index.html";
}

async function validarRestaurante() {
  const codigo = codigoInput.value.trim().toUpperCase();
  const pin = pinInput.value;

  if (!codigo || !pin) {
    setLoginMessage("Informe codigo da loja e PIN.");
    return;
  }

  btnEntrar.disabled = true;
  btnEntrar.textContent = "Entrando...";
  setLoginMessage("Conectando ao servidor...", "info");

  try {
    const resposta = await fetch(`${API_URL}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, pin })
    });
    const data = await resposta.json();

    if (!resposta.ok) throw new Error(data.error || "Codigo ou PIN invalido.");

    sessionStorage.setItem("yulipeAdminStore", data.loja || codigo);
    sessionStorage.setItem("yulipeAdminToken", data.token);
    window.location.href = "../admin/index.html";
  } catch (error) {
    const isNetworkError = error instanceof TypeError || /fetch|network/i.test(error.message || "");
    setLoginMessage(
      isNetworkError
        ? "Nao consegui conectar na API em 127.0.0.1:3000. Inicie o backend e tente novamente."
        : error.message || "Nao foi possivel autenticar no backend."
    );
  } finally {
    btnEntrar.disabled = false;
    btnEntrar.textContent = "Entrar no painel";
  }
}

document.body.classList.add("dark");

abrirLogin.addEventListener("click", abrirModal);
abrirCozinha.addEventListener("click", entrarNaCozinha);
abrirEntregador.addEventListener("click", entrarNasEntregas);
fechar.addEventListener("click", fecharModal);

modal.addEventListener("click", event => {
  if (event.target === modal) fecharModal();
});

btnEntrar.addEventListener("click", validarRestaurante);

pinInput.addEventListener("keydown", event => {
  if (event.key === "Enter") validarRestaurante();
});

codigoInput.addEventListener("keydown", event => {
  if (event.key === "Enter") pinInput.focus();
});
