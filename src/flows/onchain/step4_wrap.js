const { guideBtns } = require("../../ui/keyboards");
function step4_wrap({ route, lang, amount, CONFIG }) {
  const text = [
    "🚀 Bravo !",
    "• Créer une alerte de taux",
    "• Découvrir Premium",
    "• Laisser une suggestion"
  ].join("\n");
  // On mettra ici les bons boutons (alertes/premium)
  return { text, reply_markup: guideBtns(null, `guide=3.3&route=${route}&amount=${amount||""}&lang=${lang}`) };
}
module.exports = { step4_wrap };
