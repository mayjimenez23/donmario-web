# Empanadas Don Mario · Web

Landing page de una sola página para Empanadas Don Mario, con carrito que arma el pedido y lo abre directo en WhatsApp.

**Stack:** HTML + CSS + JS vanilla. Sin frameworks, sin build, sin dependencias.
Cualquier hosting estático sirve (GitHub Pages, Netlify, Cloudflare Pages).

---

## ⚠️ Antes de publicar — editar el número de WhatsApp

Abrir `script.js` y editar la constante:

```js
const WHATSAPP_NUMBER = "595XXXXXXXXX"; // <-- editar acá
```

**Formato:** código de país + número, **sin** `+`, sin espacios, sin guiones.
Paraguay = `595` + número sin el `0` inicial.

Ejemplo: si tu celular es `0981 123 456` → poné `"595981123456"`.

---

## Cómo correrla localmente

Abrir `index.html` directo en el navegador funciona, pero las tipografías de Google Fonts pueden tardar 1s en cargar. Si querés un server local:

```bash
# Si tenés Python instalado
python -m http.server 8000

# Si tenés Node
npx serve .
```

Abrí http://localhost:8000

---

## Editar el menú

El menú está hardcoded en `script.js`, en la constante `MENU`. Cada ítem es:

```js
{
  id: "nombre-unico",
  name: "Texto visible",
  priceGs: 1000,     // null si es "consultar"
  type: "unit",      // "unit" (Gs/u) o "kg" (kilos, paso 0.25)
  badge: "bajo pedido" // opcional, pill que se muestra al lado
}
```

Para agregar/quitar productos, modificás el array correspondiente (`MENU.bocaditos` o `MENU.milanesas`).

---

## Deploy a GitHub Pages

1. Crear un repo nuevo en GitHub, ej. `donmario-web`.
2. Push de esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "feat: landing inicial"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario>/donmario-web.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Source: Deploy from branch → main / (root)** → Save.
4. En 1 minuto la página queda live en `https://<tu-usuario>.github.io/donmario-web/`.

## Deploy a Netlify (alternativa, sin git)

1. Entrar a https://app.netlify.com/drop
2. Arrastrar la carpeta entera al rectángulo
3. Listo — Netlify devuelve una URL del estilo `https://<random>.netlify.app`. Podés cambiarla en Settings.

---

## Estructura

```
donmario-web/
├── index.html      ← 5 secciones: hero, nosotros, menú, cómo pedir, footer
├── styles.css      ← tokens, layout, componentes, responsive
├── script.js       ← render del menú + lógica del carrito + WhatsApp
├── assets/
│   └── logo.png    ← el logo del negocio
└── README.md
```

---

## Tipografías

- **Fraunces** (display serif) → títulos y números
- **Manrope** (sans cálida) → body y UI
- **Caveat** (handwritten) → slogan

Las 3 vienen de Google Fonts, cargan en una sola request al `<head>` del HTML.

---

## Paleta de colores

| Variable      | Color    | Uso                       |
|---------------|----------|---------------------------|
| `--cream`     | `#FBF3DF`| fondo principal           |
| `--orange`    | `#D17A2A`| acento, CTA primario      |
| `--orange-dark`| `#B35F1A`| hover, énfasis           |
| `--gold`      | `#F5C57F`| highlights, underlines    |
| `--brown`     | `#5C2E0E`| texto, paneles oscuros    |
| `--olive`     | `#6B6A2A`| labels secundarios        |
| `--green-wa`  | `#25D366`| botón de WhatsApp         |
