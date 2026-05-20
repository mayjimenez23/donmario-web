/* ============================================================
   EMPANADAS DON MARIO · Lógica de la landing
   - Renderiza el menú desde una constante (fácil de editar)
   - Mantiene el carrito en memoria
   - Arma el mensaje de WhatsApp y abre wa.me/<numero>?text=...
   ============================================================ */

const WHATSAPP_NUMBER = "595976961326"; // 0976 961 326 sin el 0 inicial

/* ===================== MENÚ =====================
   Editar acá para cambiar productos / precios.
   - type "unit" → cantidad entera, suma como Gs/u
   - type "kg"   → cantidad en kg con paso 0.25
   - badge       → opcional, se muestra como pill (ej: "bajo pedido")
   =============================================== */
const MENU = {
  empanadas: [
    { id: "carne",      name: "Carne",      priceGs: 1000, type: "unit" },
    { id: "pollo",      name: "Pollo",      priceGs: 1000, type: "unit" },
    { id: "choclo",     name: "Choclo",     priceGs: 1000, type: "unit" },
    { id: "jq",         name: "J&Q",        priceGs: 1000, type: "unit" },
    { id: "picante",    name: "Picante",    priceGs: 1000, type: "unit" },
    { id: "catupollo",  name: "Catupollo",  priceGs: 1000, type: "unit" },
    { id: "huevo",      name: "Huevo",      priceGs: 1000, type: "unit" },
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
   Estado del carrito
   ============================================================ */
const cart = new Map(); // id → { item, qty }

const formatGs = (n) =>
  new Intl.NumberFormat("es-PY").format(Math.round(n));

const formatKg = (n) =>
  (Math.round(n * 100) / 100).toString().replace(".", ",");

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
  if (item.type === "unit") {
    p.textContent = `Gs. ${formatGs(item.priceGs)} c/u`;
  } else {
    p.textContent = item.priceGs == null
      ? "consultar precio del día"
      : `Gs. ${formatGs(item.priceGs)} / kg`;
  }
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
  subtotal.textContent = item.priceGs == null ? "—" : "Gs. 0";
  row.appendChild(subtotal);
  card.appendChild(row);

  const step = item.type === "kg" ? 0.25 : 1;

  function setQty(newQty) {
    const clamped = Math.max(0, newQty);
    if (clamped <= 0) {
      cart.delete(item.id);
    } else {
      cart.set(item.id, { item, qty: clamped });
    }
    qty.textContent = item.type === "kg"
      ? (clamped === 0 ? "0" : formatKg(clamped))
      : String(clamped);

    if (item.priceGs != null) {
      subtotal.textContent = `Gs. ${formatGs(item.priceGs * clamped)}`;
      subtotal.classList.toggle("card__subtotal--muted", clamped === 0);
    }
    card.classList.toggle("card--active", clamped > 0);
    minus.disabled = clamped <= 0;
    renderCart();
    renderGroupSummaries();
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
   Resúmenes por grupo (en el <summary> de cada bloque expandible)
   ============================================================ */
function groupTotals(groupKey) {
  const ids = new Set(MENU[groupKey].map((it) => it.id));
  let count = 0;
  let gs = 0;
  for (const { item, qty } of cart.values()) {
    if (!ids.has(item.id)) continue;
    if (item.type === "unit") count += qty;
    else count += 1;
    if (item.priceGs != null) gs += item.priceGs * qty;
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
      tag.textContent = t.gs > 0 ? `${unit} · Gs. ${formatGs(t.gs)}` : unit;
      tag.classList.add("group__count--on");
    }
  });
}

/* ============================================================
   Carrito sticky
   ============================================================ */
const cartEl = document.getElementById("cart");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const cartCta = document.getElementById("cartCta");

function totals() {
  let units = 0, kg = 0, totalGs = 0;
  for (const { item, qty } of cart.values()) {
    if (item.type === "unit") units += qty;
    else kg += qty;
    if (item.priceGs != null) totalGs += item.priceGs * qty;
  }
  return { units, kg, totalGs };
}

function renderCart() {
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
  const label = parts.join(" · ");

  cartCount.innerHTML =
    `<span>${cart.size}</span> ${cart.size === 1 ? "ítem" : "ítems"} · ${label}`;

  cartTotal.textContent = `Gs. ${formatGs(t.totalGs)}`;
}

/* ============================================================
   Construcción del mensaje de WhatsApp
   ============================================================ */
function buildWhatsAppMessage() {
  const lines = [];
  lines.push("🥟 *Pedido para Empanadas Don Mario*");
  lines.push("");

  const empanadas = [];
  const otros = [];   // milanesitas + croquetitas
  const kilos = [];

  for (const { item, qty } of cart.values()) {
    if (item.type === "kg") {
      kilos.push({ item, qty });
    } else if (MENU.empanadas.some((e) => e.id === item.id)) {
      empanadas.push({ item, qty });
    } else {
      otros.push({ item, qty });
    }
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
      const sub = item.priceGs ? ` — Gs. ${formatGs(item.priceGs * qty)}` : "";
      lines.push(`• ${formatKg(qty)} kg de ${item.name}${tag}${sub}`);
    }
    lines.push("");
  }

  const t = totals();
  lines.push(`*Total estimado:* Gs. ${formatGs(t.totalGs)}`);
  lines.push("");
  lines.push("¡Gracias! Confirmo hora de retiro por acá.");

  return lines.join("\n");
}

function openWhatsApp(prefilled) {
  const text = prefilled
    ? buildWhatsAppMessage()
    : "Hola Don Mario, me gustaría hacer un pedido.";
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}

cartCta.addEventListener("click", (e) => {
  e.preventDefault();
  openWhatsApp(true);
});

document.getElementById("navCta").addEventListener("click", (e) => {
  e.preventDefault();
  openWhatsApp(cart.size > 0);
});

document.getElementById("footerWa").addEventListener("click", (e) => {
  e.preventDefault();
  openWhatsApp(false);
});

/* ============================================================
   Pequeños toques
   ============================================================ */
document.getElementById("year").textContent = new Date().getFullYear();

// Muestra el número de WhatsApp formateado en el footer
(function showFormattedPhone() {
  const num = WHATSAPP_NUMBER.replace(/^595/, "");
  const pretty = "+595 " + num.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3");
  document.getElementById("footerWa").textContent = pretty;
})();

renderCart();
renderGroupSummaries();
