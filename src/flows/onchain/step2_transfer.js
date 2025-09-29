const { guideBtns } = require("../../ui/keyboards");
const { ROUTES } = require("../../data/routes");

/**
 * Étape 2 — Transférer USDC (sous-étapes 2.1 → 2.4)
 * On choisit le texte selon params.step ("2.1" | "2.2" | "2.3" | "2.4")
 * Reco réseau : on NE force rien, on recommande (Polygon).
 */
function step2_transfer({ route, lang, amount, CONFIG, step }) {
  const r = ROUTES[route] || ROUTES.eurbrl;
  const netReco = r.networkHint; // "Polygon (MATIC)"

  // 2.1 — Récupérer l’adresse de dépôt côté destination
  if (String(step) === "2.1") {
    const t = [
      "🔗 Étape 2 — Transférer tes USDC",
      "2.1) Récupérer ton adresse de dépôt 🇧🇷/🇪🇺 (côté destination)",
      "",
      "• Dans ton exchange de destination, ouvre « Dépôt / Crypto »",
      "• Choisis USDC comme crypto à déposer",
      `• Choisis le réseau de transfert (ex. recommandé : ${netReco})`,
      "• Copie soigneusement l’adresse",
      "💡 Imagine que c’est comme ton IBAN bancaire, mais version blockchain (une longue suite de lettres et chiffres)."
    ].join("\n");
    return {
      text: t,
      reply_markup: guideBtns(`guide=2.2&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=1&route=${route}&amount=${amount||""}&lang=${lang}`)
    };
  }

  // 2.2 — Préparer l’envoi depuis la source (UE ou BR)
  if (String(step) === "2.2") {
    const t = [
      "🔗 Étape 2 — Transférer tes USDC",
      "2.2) Préparer l’envoi depuis ton exchange source",
      "",
      "• Va dans « Retrait / Withdraw » → USDC",
      "• Colle l’adresse copiée (celle de l’exchange de destination)",
      `• Vérifie / choisis le réseau (ex. recommandé : ${netReco})`,
      "• Entre le montant à envoyer",
      "  💡 Tu peux commencer par un petit test (ex. 10 USDC).",
      "     Ça double les frais fixes, mais c’est une bonne pratique très répandue en crypto."
    ].join("\n");
    return {
      text: t,
      reply_markup: guideBtns(`guide=2.3&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=2.1&route=${route}&amount=${amount||""}&lang=${lang}`)
    };
  }

  // 2.3 — Vérifier puis confirmer l’envoi
  if (String(step) === "2.3") {
    const t = [
      "🔗 Étape 2 — Transférer tes USDC",
      "2.3) Vérifier puis confirmer l’envoi",
      "",
      "✅ Vérifie trois fois :",
      "• L’adresse (un seul caractère faux = fonds perdus)",
      `• Le réseau choisi (ex. ${netReco}) — pense « choisir la bonne voie du train »`,
      "",
      "Une fois sûr(e), tu peux confirmer le transfert."
    ].join("\n");
    return {
      text: t,
      reply_markup: guideBtns(`guide=2.4&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=2.2&route=${route}&amount=${amount||""}&lang=${lang}`)
    };
  }

  // 2.4 — Attendre l’arrivée
  const t = [
    "🔗 Étape 2 — Transférer tes USDC",
    "2.4) Attendre l’arrivée",
    "",
    "• En général, la transaction prend 1–2 minutes, parfois jusqu’à 10",
    "• Tu verras ton solde USDC apparaître côté destination",
    "",
    "✅ Résultat : tes USDC sont bien arrivés — on passe à l’étape 3 (conversion + retrait local)."
  ].join("\n");
  return {
    text: t,
    reply_markup: guideBtns(`guide=3.1&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=2.3&route=${route}&amount=${amount||""}&lang=${lang}`)
  };
}

module.exports = { step2_transfer };
