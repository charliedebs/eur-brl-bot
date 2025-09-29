/**
 * data/routes.js
 * Métadonnées par route (symétriques)
 */
const ROUTES = {
  eurbrl: {
    code: "eurbrl",
    from: "EUR",
    to: "BRL",
    networkHint: "Polygon (MATIC)",
    outCurrencySymbol: "R$",
    note: "UE→BR : SEPA → USDC → Pix"
  },
  brleur: {
    code: "brleur",
    from: "BRL",
    to: "EUR",
    networkHint: "Polygon (MATIC)",
    outCurrencySymbol: "€",
    note: "BR→UE : Pix → USDC → SEPA"
  }
};
module.exports = { ROUTES };
