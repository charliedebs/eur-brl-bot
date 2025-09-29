/**
 * main.js — handler minimal qui route les callbacks "guide="
 * Entrée: { update, state, CONFIG }
 * Sortie: { chatId, text, reply_markup, parse_mode }
 */
const { routeGuide } = require("./router");

function parseCallbackData(data) {
  // data ex: "guide=2.1&route=eurbrl&amount=1000&lang=fr"
  const p = new URLSearchParams(data || "");
  const obj = {};
  for (const [k,v] of p.entries()) obj[k] = v;
  return obj;
}

function handleUpdate({ update, state = {}, CONFIG = {} }) {
  const msg = update && update.message;
  const cbq = update && update.callback_query;

  const chatId =
    (cbq && cbq.message && cbq.message.chat && cbq.message.chat.id) ||
    (msg && msg.chat && msg.chat.id) || 0;

  // Par défaut, on montre un “hello” simple
  const defaultReply = {
    chatId,
    text: "👋 Prêt pour le guide on-chain ?\nAppuie sur un bouton ‘Guide’ (guide=...).",
    parse_mode: "HTML"
  };

  // Callback mode: on route seulement les calls "guide="
  if (cbq && cbq.data && /(^|&)guide=/.test(cbq.data)) {
    const params = parseCallbackData(cbq.data);
    const step   = params.guide || "1";
    const route  = params.route || "eurbrl";
    const amount = parseFloat(params.amount || "1000") || 1000;
    const lang   = (params.lang || "fr").toLowerCase();

    const screen = routeGuide({
      step, route, amount, lang, CONFIG,
      estimation: ""  // on branchera l’estimation live plus tard
    });

    return {
      chatId,
      text: (screen && screen.text) || "…",
      reply_markup: (screen && screen.reply_markup) || undefined,
      parse_mode: "HTML",
      disable_web_page_preview: true
    };
  }

  // Pas de callback guide → message d’accueil minimal
  return defaultReply;
}

module.exports = { handleUpdate };
