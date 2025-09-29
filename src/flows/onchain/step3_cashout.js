const { guideBtns } = require("../../ui/keyboards");
const { ROUTES } = require("../../data/routes");

function step3_cashout({ route, lang, amount, CONFIG }) {
  const r = ROUTES[route] || ROUTES.eurbrl;
  const text = [
    "🟩 Étape 3 — Convertir & retirer",
    "",
    `• Vendre USDC→${r.to} (ordre Market)`,
    `• Retrait ${(r.to==="BRL")?"Pix":"SEPA"}`
  ].join("\n");
  return { text, reply_markup: guideBtns(`guide=3.4&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=2.4&route=${route}&amount=${amount||""}&lang=${lang}`) };
}
module.exports = { step3_cashout };
