/**
 * ui/keyboards.js
 * Builders d’inline keyboards Telegram
 */
function guideBtns(nextCb, prevCb){
  const rows = [];
  if (nextCb) rows.push([{ text: "✅ OK, suivant", callback_data: nextCb }]);
  if (prevCb) rows.push([{ text: "⬅️ Retour", callback_data: prevCb }]);
  return JSON.stringify({ inline_keyboard: rows });
}
module.exports = { guideBtns };
