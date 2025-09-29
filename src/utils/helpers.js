/**
 * utils/helpers.js
 * Fonctions utilitaires communes
 */
function fmt(n, d=2, loc="fr-FR") {
  return (typeof n==="number" && isFinite(n))
    ? Number(n).toLocaleString(loc, { minimumFractionDigits:d, maximumFractionDigits:d })
    : "—";
}
function r4(n, loc){ return fmt(n, 4, loc); }
function locOf(lang){ return lang==="pt" ? "pt-BR" : (lang==="en" ? "en-US" : "fr-FR"); }
function tsLocal(iso, lang){
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleString(locOf(lang), { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
  } catch { return ""; }
}
function ensureNumber(x){ return (typeof x==="number" && isFinite(x)) ? x : null; }
function parseNumberLike(s){
  if (!s) return null;
  const m = String(s).match(/-?\d[\d\.\,\s]*/);
  if (!m) return null;
  const raw = m[0].replace(/\s/g,"");
  if (raw.includes(",") && raw.includes(".")) return parseFloat(raw.replace(/\./g,"").replace(",","."));
  if (raw.includes(",")) return parseFloat(raw.replace(",","."));
  return parseFloat(raw);
}
module.exports = { fmt, r4, locOf, tsLocal, ensureNumber, parseNumberLike };
