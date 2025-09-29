const { guideBtns } = require("../../ui/keyboards");
const { ROUTES } = require("../../data/routes");

/**
 * Étape 1 — Déposer et acheter USDC (UE ou BR selon la route)
 * Route-agnostique : on déduit "from" / rails (SEPA/Pix) via ROUTES.
 * Le calcul d’estimation est géré plus haut, on peut l’injecter via param.
 */
function step1_deposit({ route, lang, amount, CONFIG, estimation = "" }) {
  const r = ROUTES[route] || ROUTES.eurbrl;

  const rail = (r.from === "EUR") ? "SEPA" : "Pix";
  const text = [
    "🟦 Étape 1 — Déposer des " + r.from + " et acheter de l’USDC",
    "",
    `1) Sur ton exchange ${r.from==="EUR"?"UE":"BR"}, cherche la rubrique « Dépôt » en ${r.from} (${rail}).`,
    "2) Une fois les fonds crédités, cherche le marché pour acheter de l’USDC (menu « Marché » / « Trader »).",
    "3) Type d’ordre :",
    "   • Market (au marché) = simple, immédiat → recommandé pour débuter",
    "   • Limit (limite) = tu fixes ton prix → utile pour gros montants/liquidité",
    "",
    "Astuce : si tu veux « juste échanger », choisis Market.",
    estimation
  ].join("\n");

  // Vers Étape 2.1
  return {
    text,
    reply_markup: guideBtns(`guide=2.1&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=start&route=${route}&amount=${amount||""}&lang=${lang}`)
  };
}

module.exports = { step1_deposit };
