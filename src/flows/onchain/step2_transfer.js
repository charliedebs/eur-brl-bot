const { guideBtns } = require("../../ui/keyboards");
const { ROUTES } = require("../../data/routes");

function step2_transfer({ route, lang, amount, CONFIG }) {
  const r = ROUTES[route] || ROUTES.eurbrl;
  const text = [
    "🔗 Étape 2 — Transférer tes USDC",
    "2.1) Récupérer l’adresse de dépôt côté destination",
    "2.2) Préparer l’envoi (adresse + réseau "+r.networkHint+")",
    "2.3) Vérifier adresse & réseau, puis confirmer",
    "2.4) Attendre l’arrivée (1–2 min, parfois 10)"
  ].join("\n");
  return { text, reply_markup: guideBtns(`guide=3.1&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=1&route=${route}&amount=${amount||""}&lang=${lang}`) };
}
module.exports = { step2_transfer };
