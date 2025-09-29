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

module.exports = { step3_cashout };
