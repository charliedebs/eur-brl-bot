const { guideBtns } = require("../../ui/keyboards");

/**
 * Étape 4 — Wrap-up : garder l’utilisateur engagé (alertes, premium, feedback)
 * Les boutons spécifiques (alertes/premium/suggestion) sont construits côté bot,
 * ici on livre le texte validé + un "Retour" contextuel.
 */
function step4_wrap({ route, lang, amount, CONFIG }) {
  const text = [
    "🚀 Bien joué ! Tu viens d’utiliser la blockchain pour un transfert réel.",
    "Tu as appris un truc qui va devenir de plus en plus courant — la prochaine fois ce sera encore plus simple 😉",
    "",
    "Ce que je peux faire pour toi maintenant :",
    "• ⏰ Alerte de taux pour être notifié dès qu’un seuil t’intéresse",
    "• 🚀 Premium : multi-alertes, multi-devises, vérifs plus rapides",
    "• 💬 Question/suggestion : je suis preneur de ton retour !"
  ].join("\n");

  // On laisse le "Retour" vers 3.3 pour cohérence
  const rk = JSON.stringify({
    inline_keyboard: [
      [
        { text: "⏰ Créer une alerte", callback_data: `alerts=start&route=${route}&amount=${amount||""}&lang=${lang}` },
        { text: "✨ En savoir plus (Premium)", callback_data: `premium=open&lang=${lang}` }
      ],
      [
        { text: "💬 Laisser une suggestion", callback_data: `help=open&lang=${lang}` },
        { text: "⬅️ Retour", callback_data: `guide=3.3&route=${route}&amount=${amount||""}&lang=${lang}` }
      ]
    ]
  });

  return { text, reply_markup: rk };
}

module.exports = { step4_wrap };
