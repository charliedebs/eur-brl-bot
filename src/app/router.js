const { step1_deposit }  = require("../flows/onchain/step1_deposit");
const { step2_transfer } = require("../flows/onchain/step2_transfer");
const { step3_cashout }  = require("../flows/onchain/step3_cashout");
const { step4_wrap }     = require("../flows/onchain/step4_wrap");

function routeGuide(params){
  const { step } = params;
  if (step === "1")   return step1_deposit(params);
  if (step === "2")   return step2_transfer(params);
  if (step === "3")   return step3_cashout(params);
  if (step === "4")   return step4_wrap(params);
  // sous-étapes (2.1, 2.2, 2.3, 2.4, 3.1…): on peut mapper plus finement plus tard
  if (step?.startsWith("2")) return step2_transfer(params);
  if (step?.startsWith("3")) return step3_cashout(params);
  return step1_deposit(params);
}
module.exports = { routeGuide };
