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

module.exports = { routeGuide };
