const API_URL = "http://127.0.0.1:3000";
const CUSTOMER_PROFILE_KEY = "yulipeCustomerProfile";
const DELIVERY_AREAS = [
  { bairro: "Centro", km: 1.2, taxa: 5 },
  { bairro: "Vila Nova", km: 2.4, taxa: 7 },
  { bairro: "Jardim Europa", km: 3.1, taxa: 9 },
  { bairro: "Santa Luzia", km: 4.6, taxa: 12 },
  { bairro: "Parque das Aguas", km: 6.2, taxa: 16 },
  { bairro: "Residencial Primavera", km: 8.5, taxa: 22 },
  { bairro: "Jardim Imperial", km: 10.8, taxa: 28 },
  { bairro: "Distrito Industrial", km: 13.4, taxa: 34 },
  { bairro: "Chacaras Boa Vista", km: 16.8, taxa: 40 }
];
const form = document.getElementById("customerForm");
const formMessage = document.getElementById("formMessage");
const deliveryList = document.getElementById("deliveryNeighborhoods");
const deliveryFeePreview = document.getElementById("deliveryFeePreview");

function setFormMessage(message, type = "error") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_PROFILE_KEY)) || null;
  } catch (error) {
    return null;
  }
}

function saveProfile(profile) {
  localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function deliveryAreaFor(neighborhood) {
  const normalized = normalizeText(neighborhood);
  return DELIVERY_AREAS.find(area => normalizeText(area.bairro) === normalized) || null;
}

function kmLabel(value) {
  return String(value).replace(".", ",");
}

function renderDeliveryAreas() {
  deliveryList.innerHTML = DELIVERY_AREAS.map(area => (
    `<option value="${area.bairro}">${kmLabel(area.km)} km - ${money(area.taxa)}</option>`
  )).join("");
}

function updateDeliveryPreview() {
  const area = deliveryAreaFor(form.elements.neighborhood.value);
  if (!area) {
    deliveryFeePreview.textContent = "Bairro fora da tabela: sera usada a taxa padrao ate confirmar.";
    deliveryFeePreview.classList.add("warning");
    return;
  }

  deliveryFeePreview.textContent = `${area.bairro}: ${kmLabel(area.km)} km da pizzaria, entrega ${money(area.taxa)}.`;
  deliveryFeePreview.classList.remove("warning");
}

function fillForm(profile) {
  if (!profile) return;

  Object.entries(profile).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value || "";
  });
}

function profileFromForm() {
  const data = new FormData(form);
  const neighborhood = String(data.get("neighborhood") || "").trim();
  const area = deliveryAreaFor(neighborhood);

  return {
    name: String(data.get("name") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    neighborhood,
    street: String(data.get("street") || "").trim(),
    number: String(data.get("number") || "").trim(),
    complement: String(data.get("complement") || "").trim(),
    reference: String(data.get("reference") || "").trim(),
    deliveryFee: area?.taxa || 5,
    deliveryKm: area?.km || null
  };
}

async function syncProfile(profile) {
  const resposta = await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });
  const data = await resposta.json();

  if (!resposta.ok) throw new Error(data.error || "Nao foi possivel salvar o cliente.");

  return {
    ...profile,
    id_cliente: data.idCliente,
    id_endereco: data.idEndereco
  };
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const profile = profileFromForm();

  if (!profile.name || !profile.phone || !profile.neighborhood || !profile.street || !profile.number) {
    setFormMessage("Preencha nome, WhatsApp, bairro, rua e numero.");
    return;
  }

  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  button.textContent = "Salvando...";

  try {
    setFormMessage("Salvando seus dados...", "info");
    const syncedProfile = await syncProfile(profile);
    saveProfile(syncedProfile);
    window.location.href = "../cliente/index.html";
  } catch (error) {
    saveProfile({
      ...profile,
      sync_pending: true
    });
    setFormMessage("Backend offline. Salvei seu perfil neste navegador e vou abrir o cardapio.", "warning");
    setTimeout(() => {
      window.location.href = "../cliente/index.html";
    }, 700);
  } finally {
    button.disabled = false;
    button.textContent = "Entrar no cardapio";
  }
});

fillForm(loadProfile());
renderDeliveryAreas();
updateDeliveryPreview();
form.elements.neighborhood.addEventListener("input", updateDeliveryPreview);
