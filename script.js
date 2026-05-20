/* ============================================================
   EMPANADAS DON MARIO · Lógica de la landing
   - Renderiza el menú desde una constante
   - Mantiene el carrito en memoria
   - Modal de checkout (nombre + hora de retiro)
   - Arma el mensaje de WhatsApp y abre wa.me/<numero>?text=...
   ============================================================ */

const WHATSAPP_NUMBER = "595976961326"; // 0976 961 326 sin el 0 inicial

/* ===================== MENÚ ===================== */
const MENU = {
  empanadas: [
    { id: "carne",      name: "Carne",      priceGs: 1000, type: "unit" },
    { id: "pollo",      name: "Pollo",      priceGs: 1000, type: "unit" },
    { id: "choclo",     name: "Choclo",     priceGs: 1000, type: "unit" },
    { id: "jq",         name: "J&Q",        priceGs: 1000, type: "unit" },
    { id: "picante",    name: "Picante",    priceGs: 1000, type: "unit" },
    { id: "catupollo",  name: "Catupollo",  priceGs: 1000, type: "unit" },
    { id: "huevo",      name: "Huevo",      priceGs: 1000, type: "unit" },
    { id: "mandioca",   name: "Mandioca",   priceGs: 2000, type: "unit" },
    { id: "napolitana", name: "Napolitana", priceGs: 1000, type: "unit" }, 
  ],
  milanesitas: [
    { id: "milanesita", name: "Milanesita", priceGs: 1000, type: "unit" },
  ],
  croquetitas: [
    { id: "croquetita", name: "Croquetita", priceGs: 1000, type: "unit" },
  ],
  milanesasKg: [
    { id: "mila-pollo",    name: "Milanesa de Pollo",    priceGs: 25000, type: "kg" },
    { id: "mila-mondongo", name: "Milanesa de Mondongo", priceGs: 35000, type: "kg" },
    { id: "mila-carne",    name: "Milanesa de Carne",    priceGs: 50000, type: "kg", badge: "bajo pedido" },
  ],
};

/* ============================================================
   Estado
   ============================================================ */
const cart = new Map();
let firstAdd = true; // para disparar pulse al primer agregado

const formatGs = (n) => new Intl.NumberFormat("es-PY").format(Math.round(n));
const formatKg = (n) => (Math.round(n * 100) / 100).toString().replace(".", ",");

/* ============================================================
   Render de cards
   ============================================================ */
function buildCard(item) {
  const card = document.createElement("article");
  card.className = "card" + (item.type === "kg" ? " card--kg" : "");
  card.dataset.id = item.id;

  const head = document.createElement("div");
  head.className = "card__head";

  const titleBlock = document.createElement("div");
  const h = document.createElement("h4");
  h.className = "card__name";
  h.textContent = item.name;
  titleBlock.appendChild(h);

  const p = document.createElement("p");
  p.className = "card__price";
  p.textContent = item.type === "unit"
    ? `Gs. ${formatGs(item.priceGs)} c/u`
    : `Gs. ${formatGs(item.priceGs)} / kg`;
  titleBlock.appendChild(p);
  head.appendChild(titleBlock);

  if (item.badge) {
    const badge = document.createElement("span");
    badge.className = "card__badge";
    badge.textContent = item.badge;
    head.appendChild(badge);
  }
  card.appendChild(head);

  const row = document.createElement("div");
  row.className = "card__stepper";

  const stepper = document.createElement("div");
  stepper.className = "stepper";

  const minus = document.createElement("button");
  minus.className = "stepper__btn";
  minus.type = "button";
  minus.setAttribute("aria-label", `Quitar ${item.name}`);
  minus.textContent = "−";

  const qty = document.createElement("span");
  qty.className = "stepper__qty";
  qty.setAttribute("aria-live", "polite");
  qty.textContent = "0";

  const plus = document.createElement("button");
  plus.className = "stepper__btn";
  plus.type = "button";
  plus.setAttribute("aria-label", `Agregar ${item.name}`);
  plus.textContent = "+";

  stepper.append(minus, qty, plus);
  row.appendChild(stepper);

  const subtotal = document.createElement("span");
  subtotal.className = "card__subtotal card__subtotal--muted";
  subtotal.textContent = "Gs. 0";
  row.appendChild(subtotal);
  card.appendChild(row);

  const step = item.type === "kg" ? 0.25 : 1;

  function setQty(newQty) {
    const wasEmpty = cart.size === 0;
    const clamped = Math.max(0, newQty);
    if (clamped <= 0) {
      cart.delete(item.id);
    } else {
      cart.set(item.id, { item, qty: clamped });
    }
    qty.textContent = item.type === "kg"
      ? (clamped === 0 ? "0" : formatKg(clamped))
      : String(clamped);

    subtotal.textContent = `Gs. ${formatGs(item.priceGs * clamped)}`;
    subtotal.classList.toggle("card__subtotal--muted", clamped === 0);
    card.classList.toggle("card--active", clamped > 0);
    minus.disabled = clamped <= 0;

    renderCart(wasEmpty && cart.size > 0);
    renderGroupSummaries();
    renderNavBadge();
  }

  minus.addEventListener("click", () => {
    const current = cart.get(item.id)?.qty ?? 0;
    setQty(current - step);
  });
  plus.addEventListener("click", () => {
    const current = cart.get(item.id)?.qty ?? 0;
    setQty(current + step);
  });
  minus.disabled = true;

  return card;
}

function mount(gridId, items) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  items.forEach((it) => grid.appendChild(buildCard(it)));
}

mount("grid-empanadas",   MENU.empanadas);
mount("grid-milanesitas", MENU.milanesitas);
mount("grid-croquetitas", MENU.croquetitas);
mount("grid-milanesas",   MENU.milanesasKg);

/* ============================================================
   Totales por grupo (chip en cada <summary>)
   ============================================================ */
function groupTotals(groupKey) {
  const ids = new Set(MENU[groupKey].map((it) => it.id));
  let count = 0, gs = 0;
  for (const { item, qty } of cart.values()) {
    if (!ids.has(item.id)) continue;
    if (item.type === "unit") count += qty;
    else count += 1;
    gs += item.priceGs * qty;
  }
  return { count, gs };
}

function renderGroupSummaries() {
  document.querySelectorAll("[data-group]").forEach((el) => {
    const key = el.dataset.group;
    const t = groupTotals(key);
    const tag = el.querySelector(".group__count");
    if (!tag) return;
    if (t.count === 0) {
      tag.textContent = "";
      tag.classList.remove("group__count--on");
    } else {
      const unit = key === "milanesasKg"
        ? (t.count === 1 ? "1 ítem" : `${t.count} ítems`)
        : (t.count === 1 ? "1 unidad" : `${t.count} unidades`);
      tag.textContent = `${unit} · Gs. ${formatGs(t.gs)}`;
      tag.classList.add("group__count--on");
    }
  });
}

/* ============================================================
   Totales globales + sticky cart + badge del nav
   ============================================================ */
const cartEl = document.getElementById("cart");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const cartCta = document.getElementById("cartCta");
const navCta = document.getElementById("navCta");
const navBadge = document.getElementById("navBadge");

function totals() {
  let units = 0, kg = 0, totalGs = 0;
  for (const { item, qty } of cart.values()) {
    if (item.type === "unit") units += qty;
    else kg += qty;
    totalGs += item.priceGs * qty;
  }
  return { units, kg, totalGs };
}

function renderCart(justBecameNonEmpty) {
  if (cart.size === 0) {
    cartEl.classList.remove("cart--visible");
    return;
  }
  cartEl.classList.add("cart--visible");
  cartEl.removeAttribute("hidden");

  const t = totals();
  const parts = [];
  if (t.units > 0) parts.push(`${t.units} u`);
  if (t.kg > 0)    parts.push(`${formatKg(t.kg)} kg`);

  cartCount.innerHTML =
    `<span>${cart.size}</span> ${cart.size === 1 ? "ítem" : "ítems"} · ${parts.join(" · ")}`;

  cartTotal.textContent = `Gs. ${formatGs(t.totalGs)}`;

  // Pulse animado la primera vez que aparece el carrito en cada sesión.
  if (justBecameNonEmpty && firstAdd) {
    firstAdd = false;
    cartEl.classList.remove("cart--pulse");
    // forzar reflow para reiniciar la animación
    void cartEl.offsetWidth;
    cartEl.classList.add("cart--pulse");
    setTimeout(() => cartEl.classList.remove("cart--pulse"), 1400);
  }
}

function renderNavBadge() {
  if (cart.size === 0) {
    navBadge.hidden = true;
    navBadge.textContent = "";
    navCta.classList.remove("nav__cta--filled");
    return;
  }
  const t = totals();
  navBadge.textContent = `Gs. ${formatGs(t.totalGs)}`;
  navBadge.hidden = false;
  navCta.classList.add("nav__cta--filled");
}

/* ============================================================
   Modal de checkout (nombre + hora)
   ============================================================ */
const modal = document.getElementById("checkoutModal");
const form = document.getElementById("checkoutForm");
const inputName = document.getElementById("customerName");
const inputTime = document.getElementById("pickupTime");
const modalSummary = document.getElementById("modalSummary");
const modalSubmit = document.getElementById("modalSubmit");

function pickupSuggestionTime() {
  // Sugerimos +30 min desde ahora, redondeado a múltiplos de 15 min,
  // pero dentro del horario 07:00-21:00.
  const now = new Date();
  let suggested = new Date(now.getTime() + 30 * 60_000);
  const min = suggested.getMinutes();
  const rounded = Math.ceil(min / 15) * 15;
  suggested.setMinutes(rounded, 0, 0);
  const h = suggested.getHours();
  if (h < 7) {
    suggested.setHours(7, 30, 0, 0);
  } else if (h >= 21) {
    suggested.setHours(20, 45, 0, 0);
  }
  const hh = String(suggested.getHours()).padStart(2, "0");
  const mm = String(suggested.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function openCheckout() {
  if (cart.size === 0) {
    // Si no eligió nada, lo mandamos al menú en vez de abrir el modal en vacío.
    document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
    return;
  }

  // Resumen visible dentro del modal para que el cliente vea qué está pidiendo.
  modalSummary.innerHTML = buildModalSummaryHtml();

  // Hora sugerida sólo si el cliente no ingresó una previa.
  if (!inputTime.value) inputTime.value = pickupSuggestionTime();

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
    modal.classList.add("modal--open-fallback");
  }
  // Foco en el primer campo
  setTimeout(() => inputName.focus(), 80);
}

function closeCheckout() {
  if (typeof modal.close === "function" && modal.open) modal.close();
  modal.classList.remove("modal--open-fallback");
  modal.removeAttribute("open");
}

document.querySelectorAll("[data-close-modal]").forEach((btn) =>
  btn.addEventListener("click", closeCheckout)
);
// Click en backdrop cierra
modal.addEventListener("click", (e) => {
  const rect = form.getBoundingClientRect();
  const inside =
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top  && e.clientY <= rect.bottom;
  if (!inside) closeCheckout();
});

function buildModalSummaryHtml() {
  const lines = [];
  let totalGs = 0;
  for (const { item, qty } of cart.values()) {
    const qtyStr = item.type === "kg" ? `${formatKg(qty)} kg` : `${qty} ×`;
    const sub = item.priceGs * qty;
    totalGs += sub;
    lines.push(
      `<li><span>${qtyStr} ${item.name}</span><strong>Gs. ${formatGs(sub)}</strong></li>`
    );
  }
  return `
    <p class="modal__summary-label">Tu pedido</p>
    <ul class="modal__summary-list">${lines.join("")}</ul>
    <p class="modal__summary-total"><span>Total estimado</span><strong>Gs. ${formatGs(totalGs)}</strong></p>
  `;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = inputName.value.trim();
  const time = inputTime.value;

  if (!name || !time) {
    if (!name) inputName.focus();
    else inputTime.focus();
    return;
  }

  closeCheckout();
  openWhatsApp({ name, time });
});

/* ============================================================
   Construcción del mensaje de WhatsApp
   ============================================================ */
function buildWhatsAppMessage({ name, time }) {
  const lines = [];
  lines.push("🥟 *Pedido para Empanadas Don Mario*");
  lines.push("");
  lines.push(`*Cliente:* ${name}`);
  lines.push(`*Retiro estimado:* ${time} hs`);
  lines.push("");

  const empanadas = [];
  const otros = [];
  const kilos = [];

  for (const { item, qty } of cart.values()) {
    if (item.type === "kg") kilos.push({ item, qty });
    else if (MENU.empanadas.some((e) => e.id === item.id)) empanadas.push({ item, qty });
    else otros.push({ item, qty });
  }

  if (empanadas.length > 0) {
    lines.push("*Empanadas (fritas)*");
    for (const { item, qty } of empanadas) {
      lines.push(`• ${qty} de ${item.name} — Gs. ${formatGs(item.priceGs * qty)}`);
    }
    lines.push("");
  }

  if (otros.length > 0) {
    lines.push("*Bocaditos*");
    for (const { item, qty } of otros) {
      lines.push(`• ${qty} × ${item.name} — Gs. ${formatGs(item.priceGs * qty)}`);
    }
    lines.push("");
  }

  if (kilos.length > 0) {
    lines.push("*Milanesas crudas (por kilo)*");
    for (const { item, qty } of kilos) {
      const tag = item.badge ? ` _(${item.badge})_` : "";
      lines.push(`• ${formatKg(qty)} kg de ${item.name}${tag} — Gs. ${formatGs(item.priceGs * qty)}`);
    }
    lines.push("");
  }

  const t = totals();
  lines.push(`*Total estimado:* Gs. ${formatGs(t.totalGs)}`);
  lines.push("");
  lines.push("¡Gracias!");

  return lines.join("\n");
}

function openWhatsApp({ name, time } = {}) {
  const text = name && time
    ? buildWhatsAppMessage({ name, time })
    : "Hola Don Mario, me gustaría hacer un pedido.";
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}

/* ============================================================
   Handlers de los botones "Pedir"
   ============================================================ */
cartCta.addEventListener("click", (e) => {
  e.preventDefault();
  openCheckout();
});

navCta.addEventListener("click", (e) => {
  e.preventDefault();
  openCheckout();
});

document.getElementById("footerWa").addEventListener("click", (e) => {
  e.preventDefault();
  openWhatsApp(); // sin pre-llenar, sólo abre el chat
});

/* ============================================================
   Toques finales
   ============================================================ */
document.getElementById("year").textContent = new Date().getFullYear();

(function showFormattedPhone() {
  const num = WHATSAPP_NUMBER.replace(/^595/, "");
  const pretty = "+595 " + num.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3");
  document.getElementById("footerWa").textContent = pretty;
})();

renderCart();
renderGroupSummaries();
renderNavBadge();
