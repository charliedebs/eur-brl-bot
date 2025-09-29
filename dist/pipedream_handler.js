// ========================================================
// PIPEDREAM HANDLER (bundle généré)
// Source of truth: repo Git eur-brl-bot
// Fichier généré par tools/build-pipedream.ps1
// ========================================================

const globalThis = (function(){ return this || global || window; })();
// ---- ui/keyboards.js
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
globalThis.guideBtns = guideBtns;

// ---- flows/onchain/*.js
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



const { guideBtns } = require("../../ui/keyboards");
const { ROUTES } = require("../../data/routes");

/**
 * Étape 3 — Conversion & retrait local (sous-étapes 3.1 → 3.4)
 * 3.1 : Vendre USDC -> devise locale
 * 3.2 : Préparer le retrait (Pix/SEPA)
 * 3.3 : Confirmation / réception
 * 3.4 : Wrap-up (géré dans step4_wrap, mais on laisse un pont)
 */
function step3_cashout({ route, lang, amount, CONFIG, step, estimation = "" }) {
  const r = ROUTES[route] || ROUTES.eurbrl;
  const withdrawRail = (r.to === "BRL") ? "Pix" : "SEPA";

  // 3.1 — Vendre USDC -> devise locale
  if (String(step) === "3.1") {
    const t = [
      `🟩 Étape 3 — Vendre USDC→${r.to}`,
      "",
      `• Va sur le marché USDC/${r.to} (menu « Marché/Trader »)`,
      "• Choisis l’ordre Market (simple, immédiat) et vends tes USDC",
      "• Les frais de trading sont en général ~0,20%",
      estimation
    ].join("\n");
    return {
      text: t,
      reply_markup: guideBtns(`guide=3.2&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=2.4&route=${route}&amount=${amount||""}&lang=${lang}`)
    };
  }

  // 3.2 — Retrait local
  if (String(step) === "3.2") {
    const extraPix = (withdrawRail === "Pix")
      ? [
          "• Frais Pix : souvent très bas (parfois ~R$3,50) — honnêtement ça devrait être gratuit, mais bon… 😉",
          "• D’ailleurs : une clé Pix, c’est juste un identifiant de paiement local — là, tu sais faire tout(e) seul(e) 😉"
        ].join("\n")
      : "• Frais SEPA : généralement gratuits ou très faibles selon ta banque";

    const t = [
      `🟩 Étape 3 — Retrait ${withdrawRail}`,
      "",
      `• Ouvre « Retrait ${r.to} » / « ${withdrawRail} »`,
      "• Montant : choisis ce que tu veux retirer",
      extraPix,
      "• Confirme le retrait"
    ].join("\n");
    return {
      text: t,
      reply_markup: guideBtns(`guide=3.3&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=3.1&route=${route}&amount=${amount||""}&lang=${lang}`)
    };
  }

  // 3.3 — Confirmation / réception
  if (String(step) === "3.3") {
    const t = [
      "🟩 Étape 3 — Confirmation",
      "",
      `• Le ${withdrawRail} arrive généralement en quelques secondes/minutes`,
      `• Vérifie ton compte bancaire ${r.to==="BRL"?"brésilien":"européen"}`,
      "",
      "🎉 Top, bonne conversion !"
    ].join("\n");
    return {
      text: t,
      reply_markup: guideBtns(`guide=3.4&route=${route}&amount=${amount||""}&lang=${lang}`, `guide=3.2&route=${route}&amount=${amount||""}&lang=${lang}`)
    };
  }

  // Par défaut, on renvoie vers 3.1
  return step3_cashout({ route, lang, amount, CONFIG, step: "3.1", estimation });
}



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



// ---- app/router.js
const { step1_deposit }  = require("../flows/onchain/step1_deposit");
const { step2_transfer } = require("../flows/onchain/step2_transfer");
const { step3_cashout }  = require("../flows/onchain/step3_cashout");
const { step4_wrap }     = require("../flows/onchain/step4_wrap");

/**
 * routeGuide — Routeur d’écrans de guide on-chain
 * params: { route, lang, amount, step, estimation }
 */
function routeGuide(params){
  const { step } = params;

  if (step === "1")     return step1_deposit(params);
  if (step === "4")     return step4_wrap(params);

  // Sous-étapes Étape 2
  if (step === "2.1" || step === "2.2" || step === "2.3" || step === "2.4") {
    return step2_transfer(params);
  }
  // Sous-étapes Étape 3
  if (step === "3.1" || step === "3.2" || step === "3.3") {
    return step3_cashout(params);
  }
  if (step === "3.4")  return step4_wrap(params);

  // Fallback: commencer par Étape 1
  return step1_deposit({ ...params, step: "1" });
}

globalThis.routeGuide = routeGuide;

// ---- app/main.js
/**
 * main.js — handler minimal qui route les callbacks "guide="
 * Entrée: { update, state, CONFIG }
 * Sortie: { chatId, text, reply_markup, parse_mode }
 */
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

// ---- Export unique pour Pipedream
exports.handler = async function pdStep({ steps, $ }) {
  try {
    const update = (steps && steps.trigger && steps.trigger.event && steps.trigger.event.body) || {};
    const state  = $.checkpoint || {};
    const CONFIG = (steps && steps.config && steps.config.) || {};

    const res = globalThis.handleUpdate
      ? globalThis.handleUpdate({ update, state, CONFIG })
      : { chatId:null, text:"Handler indisponible." };

    $.checkpoint = state;
    return res;
  } catch (e) {
    return { chatId:null, text: "Erreur handler: " + (e && e.message || e) };
  }
}
