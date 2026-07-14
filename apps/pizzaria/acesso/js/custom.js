const abrirLogin = document.getElementById("abrirLogin");
const modal = document.getElementById("modalLogin");
const fechar = document.querySelector(".fechar");
const btnTema = document.getElementById("tema-btn");
const btnCliente = document.querySelector(".btn-cliente");
const codigoInput = document.getElementById("codigo");
const pinInput = document.getElementById("pin");

const lojas = [
  {
    codigo: "YULIPE-001",
    pin: "123456",
    painel: "../admin/index.html"
  },
  {
    codigo: "TESTE-001",
    pin: "654321",
    painel: "../admin/index.html"
  }
];

function abrirModal() {
  modal.classList.add("ativo");
  modal.setAttribute("aria-hidden", "false");
  codigoInput.focus();
}

function fecharModal() {
  modal.classList.remove("ativo");
  modal.setAttribute("aria-hidden", "true");
}

function entrarComoCliente() {
  window.location.href = "../cliente-login/index.html";
}

function validarRestaurante() {
  const codigo = codigoInput.value.trim().toUpperCase();
  const pin = pinInput.value;
  const acesso = lojas.find(loja => loja.codigo === codigo && loja.pin === pin);

  if (!acesso) {
    alert("Codigo ou PIN invalido.");
    return;
  }

  sessionStorage.setItem("yulipeAdminStore", acesso.codigo);
  window.location.href = acesso.painel;
}

function aplicarTemaSalvo() {
  if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark");
    btnTema.textContent = "Sol";
    return;
  }

  btnTema.textContent = "Lua";
}

btnCliente.addEventListener("click", entrarComoCliente);
abrirLogin.addEventListener("click", abrirModal);
fechar.addEventListener("click", fecharModal);

modal.addEventListener("click", event => {
  if (event.target === modal) fecharModal();
});

document.getElementById("btnEntrar").addEventListener("click", validarRestaurante);

pinInput.addEventListener("keydown", event => {
  if (event.key === "Enter") validarRestaurante();
});

codigoInput.addEventListener("keydown", event => {
  if (event.key === "Enter") pinInput.focus();
});

btnTema.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("tema", "dark");
    btnTema.textContent = "Sol";
    return;
  }

  localStorage.setItem("tema", "light");
  btnTema.textContent = "Lua";
});

aplicarTemaSalvo();
