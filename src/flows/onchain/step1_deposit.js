const { guideBtns } = require("../../ui/keyboards");
const { ROUTES } = require("../../data/routes");

function step1_deposit({ route, lang, amount, CONFIG }) {
  const r = ROUTES[route] || ROUTES.eurbrl;
  const text = [
    "🟦 Étape 1 — Déposer et acheter USDC",
    "",
    "• Dépôt "+(r.from==="EUR"?"SEPA":"Pix")+" en "+r.from,
    "• Achat "+(r.from+"→USDC")+" (ordre Market recommandé au début)",
  ].join("\n");
  return { text, reply_markup: guideBtns(`guide=2.1&route=${route}&amount=${amount||""}&lang=${lang}`, null) };
}
module.exports = { step1_deposit };
