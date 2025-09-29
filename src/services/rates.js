/**
 * services/rates.js
 * Fetch des taux (CoinGecko + Wise)
 */
const fetch = require("node-fetch");
const { ensureNumber } = require("../utils/helpers");

async function fetchCoinGeckoUSDC() {
  const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=brl,eur");
  if (!r.ok) throw new Error("CoinGecko error");
  return r.json();
}

async function fetchWiseComparison(opts, token) {
  try {
    if (!token) return null;
    const sourceCurrency = opts.route === "brleur" ? "BRL" : "EUR";
    const targetCurrency = opts.route === "brleur" ? "EUR" : "BRL";
    const srcAmt = Math.max(1, Math.round((opts.amount || 1000) * 100) / 100);
    const body = { sourceCurrency, targetCurrency, sourceAmount: srcAmt };
    const r = await fetch("https://api.wise.com/v4/comparisons", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error("Wise API " + r.status);
    const json = await r.json();
    const keep = ["Wise", "Remitly", "Instarem", "BNP"];
    const providers = (json?.providers || [])
      .filter(p => keep.includes(p?.name))
      .map(p => {
        const provider = p.name;
        const out = ensureNumber(p?.targetAmount);
        const rate = ensureNumber(p?.rate) || (out && body.sourceAmount ? (out / body.sourceAmount) : null);
        return (out && rate) ? { provider, rate, out } : null;
      })
      .filter(Boolean)
      .sort((a,b)=> b.out - a.out);
    const bestBank = providers[0] || null;
    return { bestBank, providers, timestamp: new Date().toISOString() };
  } catch {
    return null;
  }
}

module.exports = { fetchCoinGeckoUSDC, fetchWiseComparison };
