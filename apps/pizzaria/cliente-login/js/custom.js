const CUSTOMER_PROFILE_KEY = "yulipeCustomerProfile";
const form = document.getElementById("customerForm");

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

function fillForm(profile) {
  if (!profile) return;

  Object.entries(profile).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value || "";
  });
}

function profileFromForm() {
  const data = new FormData(form);

  return {
    name: String(data.get("name") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    neighborhood: String(data.get("neighborhood") || "").trim(),
    street: String(data.get("street") || "").trim(),
    number: String(data.get("number") || "").trim(),
    complement: String(data.get("complement") || "").trim(),
    reference: String(data.get("reference") || "").trim()
  };
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const profile = profileFromForm();

  if (!profile.name || !profile.phone || !profile.neighborhood || !profile.street || !profile.number) {
    alert("Preencha nome, WhatsApp, bairro, rua e numero.");
    return;
  }

  saveProfile(profile);
  window.location.href = "../cliente/index.html";
});

fillForm(loadProfile());
