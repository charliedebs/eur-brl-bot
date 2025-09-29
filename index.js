export default defineComponent({
  async run({ steps, $ }) {
    const CONFIG = steps.config && steps.config.$return_value;
    if (!CONFIG) return { text: "⚠️ Config absente. Ajoute d'abord le step 'config'.", chatId: null };

    // =========================
    // Helpers
    // =========================
    function fmt(n, d, loc) {
      d = (typeof d === "number") ? d : 2;
      loc = loc || "fr-FR";
      return (typeof n === "number" && isFinite(n))
        ? Number(n).toLocaleString(loc, { minimumFractionDigits:d, maximumFractionDigits:d })
        : "—";
    }
    function r4(n, loc) { return fmt(n, 4, loc); }
    function locOf(lang) { return lang === "pt" ? "pt-BR" : (lang === "en" ? "en-US" : "fr-FR"); }
    function tsLocal(iso, lang) {
      try {
        const d = iso ? new Date(iso) : new Date();
        return d.toLocaleString(locOf(lang), { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
      } catch { return ""; }
    }
    function ensureNumber(x) { return (typeof x === "number" && isFinite(x)) ? x : null; }
    function clamp(x, lo, hi){ return Math.max(lo, Math.min(hi, x)); }
    function htmlEscape(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

    // Parse float in user text (FR/BR styles)
    function parseNumberLike(s){
      if (!s) return null;
      // keep last block of digits, commas, dots
      const m = String(s).match(/-?\d[\d\.\,\s]*/);
      if (!m) return null;
      const raw = m[0].replace(/\s/g,"");
      // If there are both '.' and ',', assume '.' thousand sep and ',' decimal
      if (raw.includes(",") && raw.includes(".")) {
        return parseFloat(raw.replace(/\./g,"").replace(",","."));
      }
      // If only ',', treat as decimal
      if (raw.includes(","))
        return parseFloat(raw.replace(",","."));
      return parseFloat(raw);
    }

    // =========================
    // i18n (FR principal, EN/PT fallback simple)
    // =========================
    function I18N(lang) {
      const loc = locOf(lang);

      // ---- Intro bilingue (FR+PT)
      const INTRO_TEXT = [
        "👋 <b>Oi !</b>",
        "",
        "🌐 <b>Escolha o idioma para começar · Choisis ta langue pour commencer · Choose your language to start</b> 👇"
      ].join("\n");

      const L = {
        INTRO_TEXT,
        pickLang: "🌐 Choisis ta langue · Escolha o idioma · Choose your language:",
        title: (lang==="pt") ? "<b>💱 Comparação EUR → BRL</b>" : (lang==="en") ? "<b>💱 Compare EUR → BRL</b>" : "<b>💱 Comparaison EUR → BRL</b>",
        ref: (rate, ts)=> (lang==="pt")?("📊 Taxa de referência : "+rate+" • "+ts):(lang==="en")?("📊 Reference rate : "+rate+" • "+ts):("📊 Taux de référence : "+rate+" • "+ts),
        lineOnAmt: (amt,out)=> (lang==="pt")?("🌍 On-chain (Pix recebido)\n- €"+fmt(amt,0,loc)+" → R$ "+fmt(out,2,loc)):(lang==="en")?("🌍 On-chain (Pix received)\n- €"+fmt(amt,0,loc)+" → R$ "+fmt(out,2,loc)):"🌍 On-chain (Pix reçu)\n- €"+fmt(amt,0,loc)+" → R$ "+fmt(out,2,loc),
        lineOnRate: (rate)=> (lang==="pt")?("🌍 On-chain: "+fmt(rate,4,loc)):(lang==="en")?("🌍 On-chain: "+fmt(rate,4,loc)):"🌍 On-chain : "+fmt(rate,4,loc),
        lineOnEff: (rate)=> (lang==="pt")?("Taxa efetiva: "+fmt(rate,4,loc)):(lang==="en")?("Effective rate: "+fmt(rate,4,loc)):"Taux effectif : "+fmt(rate,4,loc),
        lineBkAmt: (name,amt,out)=> (lang==="pt")?("🏦 Melhor off-chain ("+name+")\n- €"+fmt(amt,0,loc)+" → R$ "+fmt(out,2,loc)):(lang==="en")?("🏦 Best off-chain ("+name+")\n- €"+fmt(amt,0,loc)+" → R$ "+fmt(out,2,loc)):"🏦 Meilleure option off-chain ("+name+")\n- €"+fmt(amt,0,loc)+" → R$ "+fmt(out,2,loc),
        lineBkEff: (rate)=> (lang==="pt")?("Taxa efetiva: "+fmt(rate,4,loc)):(lang==="en")?("Effective rate: "+fmt(rate,4,loc)):"Taux effectif : "+fmt(rate,4,loc),
        othersHdr: (lang==="pt")?"Outros:":(lang==="en")?"Others:":"Autres :",
        delta: (sign,pct)=> (lang==="pt")?("Δ: "+sign+fmt(pct,1,loc)+"% a favor de "):(lang==="en")?("Δ: "+sign+fmt(pct,1,loc)+"% in favor of "):("Δ : "+sign+fmt(pct,1,loc)+"% en faveur de "),
        howProceed: (lang==="pt") ? "<b>Como você quer continuar?</b>" : (lang==="en" ? "<b>How do you want to proceed?</b>" : "<b>Comment veux-tu continuer ?</b>"),
        promptAmt: (lang==="pt") ? "💬 Envie um valor (ex.: <b>1000</b>) ou escolha uma rota."
                 : (lang==="en") ? "💬 Send an amount (e.g., <b>1000</b>) or pick a route."
                                  : "💬 Envoie un montant (ex. <b>1000</b>) ou choisis une route.",
        // Buttons
        btn: {
          langFR:"🇫🇷 Français", langPT:"🇧🇷 Português", langEN:"🇬🇧 English",
          eurbrl:(amt)=>"🇪🇺 EUR → 🇧🇷 BRL (Pix) · €"+fmt(amt,0,loc),
          brleur:(amt)=>"🇧🇷 BRL → 🇪🇺 EUR (SEPA) · R$"+fmt(amt,0,loc),
          stayOff:(lang==="pt")?"🏦 Ficar off-chain":(lang==="en")?"🏦 Stay off-chain":"🏦 Je préfère rester off-chain",
          contOn:(lang==="pt")?"🚀 Continuar on-chain":(lang==="en")?"🚀 Continue on-chain":"🚀 Continuer on-chain",
          gotAll:(lang==="pt")?"✅ Já tenho tudo":(lang==="en")?"✅ I’ve got what I need":"✅ J’ai tout ce qu’il me faut",
          change:(lang==="pt")?"✏️ Alterar valor":(lang==="en")?"✏️ Change amount":"✏️ Changer le montant",
          back:(lang==="pt")?"⬅️ Voltar":(lang==="en")?"⬅️ Back":"⬅️ Retour",
          seeOffDetails:(lang==="pt")?"🔎 Ver ofertas off-chain":(lang==="en")?"🔎 See off-chain offers":"🔎 Voir offres off-chain",
          setAlert:(lang==="pt")?"⏰ Criar alerta":(lang==="en")?"⏰ Create alert":"⏰ Créer une alerte",
          premium:(lang==="pt")?"🚀 Premium":(lang==="en")?"🚀 Premium":"🚀 Premium",
          langSwitch:(lang==="pt")?"🌐 Idioma":(lang==="en")?"🌐 Language":"🌐 Langue",
          help:(lang==="pt")?"🆘 Ajuda":(lang==="en")?"🆘 Help":"🆘 Aide",
          legal:(lang==="pt")?"ℹ️ Informações":(lang==="en")?"ℹ️ Info":"ℹ️ Infos & mentions",
        },
        // Short static pedago/legal/help (FR primary)
        EDU_USDC: "🪙 Pourquoi USDC ?\n\nUSDC = stablecoin adossé au dollar (≈1 USDC = 1 USD).\n• Régulé et largement accepté\n• Frais bas, transfert rapide (ex. Polygon)\n• Bonne liquidité pour changer EUR↔BRL\n\nEn bref : pratique pour déplacer la valeur entre 🇪🇺 et 🇧🇷.",
        EDU_MVSL: "📈 Ordre Market vs Limit\n\n• Market (au marché) : exécution immédiate au prix du moment → simple, recommandé pour débuter\n• Limit (limite) : tu fixes TON prix → utile pour gros montants / optimiser le taux\n\nAstuce : si tu veux “juste échanger”, choisis Market.",
        EDU_STABLE: "🏷️ C’est quoi un stablecoin ?\n\nUne crypto conçue pour garder une valeur stable (ex. 1 USDC ≈ 1 USD).\n• Utile pour transférer de l’argent\n• Moins volatil que d’autres cryptos\n• Sert d’étape intermédiaire EUR↔BRL\n\nC’est l’outil clé pour des transferts rapides et peu coûteux.",
        HELP_FAQ: "❓ Aide rapide\n\n• C’est quoi on-chain ? → Transfert via blockchain (rapide, peu coûteux)\n• Et si je me trompe d’adresse ? → En crypto, pas de SAV. Vérifie 3 fois avant d’envoyer.\n• Pourquoi USDC ? → Stablecoin (≈1 USD), rapide, frais bas, très accepté.\n• Combien de temps ? → 1–2 min, parfois jusqu’à 10.\n• Frais ? → Achat/vente ~0,1–0,2%. Réseau ~1 USDC (Polygon). Pix ~R$3,50.",
        LEGAL_INFO: "ℹ️ Infos & mentions\n\n• Bot pédagogique, sans conseil financier.\n• Risques blockchain : erreur d’adresse/réseau = perte définitive.\n• Comparaisons off-chain via Wise (si dispo).\n• Liens affiliés : gratuit pour toi, ça finance le service (parfois bonus).\n\nEn l’utilisant, tu confirmes avoir compris ces points.",
      };
      return { L, loc };
    }

    // =========================
    // Intro bilingue (FR+PT)
    // =========================
    const INTRO_TEXT = I18N("fr").L.INTRO_TEXT;

    // =========================
    // Input
    // =========================
    const update = steps.trigger && steps.trigger.event && steps.trigger.event.body ? steps.trigger.event.body : {};
    const msg = update.message;
    const cbq = update.callback_query;
    const chatId = (cbq && cbq.message && cbq.message.chat && cbq.message.chat.id) || (msg && msg.chat && msg.chat.id) || null;
    const userId = (msg && msg.from && msg.from.id) || (cbq && cbq.from && cbq.from.id) || chatId;
    const textRaw = (msg && msg.text) ? String(msg.text).trim() : "";
    const text = textRaw.toLowerCase();

    // =========================
    // State (checkpoint)
    // =========================
    let state = $.checkpoint || {};
    // keys
    const kUser = "lang:user:" + String(userId);
    const kChat = "lang:chat:" + String(chatId);
    const sKey = (k)=> "user:"+userId+":"+k;
    // Persist helpers
    function setS(key, val){ state[sKey(key)] = val; $.checkpoint = state; }
    function getS(key){ return state[sKey(key)]; }
    function delS(key){ delete state[sKey(key)]; $.checkpoint = state; }

    // Language
    const tgCode = (msg && msg.from && msg.from.language_code) || (cbq && cbq.from && cbq.from.language_code) || "";
    function lc2lang(code){
      const c = String(code || "").toLowerCase();
      if (c.startsWith("fr")) return "fr";
      if (c.startsWith("en")) return "en";
      if (c.startsWith("pt")) return "pt";
      return "fr";
    }
    let lang = state[kUser] || state[kChat] || lc2lang(tgCode);

    // read lang from callback data if present
    if (cbq && cbq.data) {
      const p = new URLSearchParams(cbq.data);
      const l = p.get("lang") || (p.has("lang") ? p.getAll("lang")[0] : null);
      if (l && ["fr","pt","en"].includes(l)) lang = l;
    }
    // persist
    state[kUser] = lang;
    state[kChat] = lang;
    $.checkpoint = state;

    let { L, loc } = I18N(lang);
    function setLang(x){
      lang = x; state[kUser] = x; state[kChat] = x; $.checkpoint = state;
      const i = I18N(lang); L = i.L; loc = i.loc;
    }

    // =========================
    // Commands: /start /lang /aide /help /legal
    // =========================
    const isStart = /^\/start$/.test(text);
    const isHello = /^(hi|hello|hey|bonjour|salut|oi|olá|ola|bom\s?dia|boa\s?tarde|boa\s?noite)$/i.test(textRaw);
    if (isStart || isHello) {
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: L.btn.langFR, callback_data: "lang=fr" },
        { text: L.btn.langPT, callback_data: "lang=pt" },
        { text: L.btn.langEN, callback_data: "lang=en" },
      ]]});
      return { chatId, text: INTRO_TEXT, parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }

    // /lang and lang=...
    const mLang = text.match(/^\/lang(uage|ue)?\s*(fr|pt|en)?$/i);
    if (mLang) {
      const ll = (mLang[2]||"").toLowerCase();
      if (["fr","pt","en"].includes(ll)) setLang(ll);
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: L.btn.langFR, callback_data: "lang=fr" },
        { text: L.btn.langPT, callback_data: "lang=pt" },
        { text: L.btn.langEN, callback_data: "lang=en" },
      ]]});
      return { chatId, text: L.pickLang, parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }
    if (cbq && cbq.data && /^lang=/.test(cbq.data)) {
      const newLang = cbq.data.split("=")[1];
      if (["fr","pt","en"].includes(newLang)) setLang(newLang);
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: L.btn.eurbrl(CONFIG.UI.DEFAULT_EUR), callback_data: "route=eurbrl&amount="+CONFIG.UI.DEFAULT_EUR+"&lang="+lang },
        { text: L.btn.brleur(CONFIG.UI.DEFAULT_BRL), callback_data: "route=brleur&amount="+CONFIG.UI.DEFAULT_BRL+"&lang="+lang },
      ]]});
      return { chatId, text: L.promptAmt, parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }

    if (/^\/(aide|help)$/i.test(text)) {
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "💬 Contacter", callback_data: "help=contact&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      return { chatId, text: L.HELP_FAQ, parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }
    if (/^\/(legal|mentions|info)$/i.test(text)) {
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "✅ Compris", callback_data: "legal=ok&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      return { chatId, text: L.LEGAL_INFO, parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }

    // =========================
    // Quick mini infos & pedagogy
    // =========================
    if (cbq && cbq.data && /^info=/.test(cbq.data)) {
      const key = cbq.data.split("=")[1];
      const map = {
        exchanges: "🔎 <b>Exchanges UE/BR</b>\n• <a href=\""+CONFIG.LINKS.EU_EXCHANGE+"\">Compte UE</a>\n• <a href=\""+CONFIG.LINKS.BR_EXCHANGE+"\">Compte BR</a>\n💡 Service gratuit — merci d’utiliser nos liens 🙏",
        usdc: L.EDU_USDC,
        polygon: "🔗 Réseau Polygon : frais bas, rapide ; vérifie réseau/adresse.",
        trade: "📈 Marché : USDC/BRL, Market (simple) ou Limit (prix fixé).",
        withdraw: "🏦 Retraits : BR = Pix ; UE = SEPA.",
      };
      return { chatId, text: (map[key] || "ℹ️"), parse_mode:"HTML", disable_web_page_preview:false };
    }
    if (cbq && cbq.data && /^edu=/.test(cbq.data)) {
      const key = cbq.data.split("=")[1];
      const map = { usdc:L.EDU_USDC, marketlimit:L.EDU_MVSL, stablecoin:L.EDU_STABLE };
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "🔗 Voir la route on-chain", callback_data: "mode=onchain&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      return { chatId, text: (map[key]||"ℹ️"), parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }

    if (cbq && cbq.data && /^legal=/.test(cbq.data)) {
      return { chatId, text: "✅ Merci, c’est noté.", parse_mode:"HTML" };
    }
    if (cbq && cbq.data && /^help=/.test(cbq.data)) {
      const key = cbq.data.split("=")[1];
      if (key==="contact") {
        setS("awaiting_support_text", true);
        return { chatId, text: "💬 Dis-moi ton message (souci, étape, détail).", parse_mode:"HTML" };
      }
    }
    if (getS("awaiting_support_text") && textRaw) {
      delS("awaiting_support_text");
      // Here you would forward to your support channel/email
      return { chatId, text: "Merci ! Ton message a bien été transmis ✅", parse_mode:"HTML" };
    }

    // =========================
    // Parse montant & route depuis texte libre
    // =========================
    let route = "eurbrl";
    let amount = null;
    if (cbq && cbq.data) {
      const p = new URLSearchParams(cbq.data);
      if (p.get("route")) route = p.get("route");
      if (p.get("amount")) amount = parseFloat(String(p.get("amount")).replace(",", "."));
    }
    // amount from text
    if (amount === null && textRaw) {
      const moneyPattern = /(?:€\s*([\d.,]+)|([\d.,]+)\s*€|r\$\s*([\d.,]+)|([\d.,]+)\s*r\$|([\d.,]+)\s*(?:eur|euro?s?)|([\d.,]+)\s*(?:brl|reais?))/i;
      const m = textRaw.match(moneyPattern) || text.match(/([\d][\d.,]*)/);
      if (m) {
        const val = String((m[1]||m[2]||m[3]||m[4]||m[5]||m[6]||m[0]||"")).replace(/\s/g,"").replace(/\./g,"").replace(",",".");
        const num = parseFloat(val);
        if (isFinite(num) && num>0) amount = num;
      }
      const wantsEURtoBRL =
        ((/eur|€|euro/.test(text) && /(brl|r\$|real|reais)/.test(text)) ||
         /(send|envoyer|enviar).*(brl|r\$)/.test(text) ||
         /(to|vers|para)\s*(brl|r\$|real|reais)/.test(text));
      const wantsBRLtoEUR =
        ((/(brl|r\$|real|reais)/.test(text) && /(eur|€|euro)/.test(text)) ||
         /(send|envoyer|enviar).*(eur|€|euro)/.test(text) ||
         /(to|vers|para)\s*(eur|€|euro)/.test(text));
      if (wantsEURtoBRL && !wantsBRLtoEUR) route = "eurbrl";
      else if (wantsBRLtoEUR && !wantsEURtoBRL) route = "brleur";
    }

    // =========================
    // Live fetches
    // =========================
    async function fetchCoinGeckoUSDC() {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=brl,eur");
      if (!r.ok) throw new Error("CoinGecko error");
      return r.json();
    }
    async function fetchWiseComparison(opts) {
      try {
        const token = CONFIG.TOKENS.WISE_API_TOKEN;
        if (!token) return null;
        const sourceCurrency = opts.route === "brleur" ? "BRL" : "EUR";
        const targetCurrency = opts.route === "brleur" ? "EUR" : "BRL";
        const srcAmt = Math.max(1, Math.round((opts.amount || (opts.route==="brleur"?CONFIG.UI.DEFAULT_BRL:CONFIG.UI.DEFAULT_EUR)) * 100) / 100);
        const body = { sourceCurrency, targetCurrency, sourceAmount: srcAmt };
        const r = await fetch("https://api.wise.com/v4/comparisons", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error("Wise API " + r.status);
        const json = await r.json();
        const keep = ["Wise", "Remitly", "Instarem"];
        const providers = (json && json.providers ? json.providers : [])
          .filter(p => keep.indexOf(p && p.name) >= 0)
          .map(p => {
            const provider = p.name;
            const out = ensureNumber(p && p.targetAmount);
            const rate = ensureNumber(p && p.rate) || (out && body.sourceAmount ? (out / body.sourceAmount) : null);
            return (out && rate) ? { provider, rate, out } : null;
          })
          .filter(Boolean)
          .sort((a,b)=> b.out - a.out);
        const bestBank = providers[0] || null;
        return { bestBank, providers, timestamp: new Date().toISOString() };
      } catch { return null; }
    }

    let cg=null, wiseData=null;
    try {
      [cg, wiseData] = await Promise.all([
        fetchCoinGeckoUSDC().catch(()=>null),
        fetchWiseComparison({ amount: amount || (route==="brleur"?CONFIG.UI.DEFAULT_BRL:CONFIG.UI.DEFAULT_EUR), route }).catch(()=>null),
      ]);
    } catch {}

    const c_brl = cg && cg["usd-coin"] && cg["usd-coin"].brl;
    const c_eur = cg && cg["usd-coin"] && cg["usd-coin"].eur;
    if (!c_brl || !c_eur) {
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "🔄 Réessayer", callback_data: "action=refresh&route="+route+"&amount="+(amount||"")+"&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      return { chatId, text: "⚠️ Taux live indisponibles pour l’instant.\nRéessaie dans un instant. (On garde tes infos, rien n’est perdu.)", parse_mode:"HTML", reply_markup: rk };
    }

    const eur_usdc = 1 / c_eur;
    const cross_eur_brl = eur_usdc * c_brl;

    // On-chain prudent calcs
    const F = CONFIG.FEES;
    function toBRL(eur_in) {
      const usdc_from_eur = eur_in * (1 - F.TRADE_EU) * eur_usdc;
      const usdc_after_net = Math.max(0, usdc_from_eur - F.NETWORK_USDC_FIXED);
      const brl_after_trade = usdc_after_net * (1 - F.TRADE_BR) * (1 - F.SAFETY_DISCOUNT) * c_brl;
      const brl_net = Math.max(0, brl_after_trade - F.WITHDRAW_BRL_FIXED);
      return { eur_in, brl_net, onchainRate: brl_net / eur_in };
    }
    function toEUR(brl_in) {
      const usdc_from_brl = (brl_in / c_brl) * (1 - F.TRADE_BR) * (1 - F.SAFETY_DISCOUNT);
      const usdc_after_net = Math.max(0, usdc_from_brl - F.NETWORK_USDC_FIXED);
      const eur_out = (usdc_after_net / eur_usdc) * (1 - F.TRADE_EU);
      const eur_net = Math.max(0, eur_out);
      return { brl_in, eur_net, onchainRate: eur_net / brl_in };
    }

    // ----- Estimation line helper -----
    function estimationLine(route, amount) {
      if (!amount || !isFinite(amount)) return "";
      if (route === "brleur") {
        const on = toEUR(amount);
        return "\n\n<b>Estimation de ton solde</b> : € " + fmt(on.eur_net||0, 2, loc)
             + "\n<i>Estimation proche du live, de légères variations sont possibles.</i>";
      } else {
        const on = toBRL(amount);
        return "\n\n<b>Estimation de ton solde</b> : R$ " + fmt(on.brl_net||0, 2, loc)
             + "\n<i>Estimation proche du live, de légères variations sont possibles.</i>";
      }
    }

    
    // =========================
    // Buttons builders
    // =========================
    function mainButtons(amt, route) {
      return JSON.stringify({ inline_keyboard: [[
        { text: L.btn.gotAll, callback_data: "mode=ready&route="+route+"&amount="+(amt||"")+"&lang="+lang },
      ],[
        { text: L.btn.contOn, callback_data: "mode=onchain&route="+route+"&amount="+(amt||"")+"&lang="+lang },
        { text: L.btn.stayOff, callback_data: "mode=offchain&route="+route+"&amount="+(amt||"")+"&lang="+lang },
      ],[
        { text: L.btn.seeOffDetails, callback_data: "action=see_offers&route="+route+"&amount="+(amt||"")+"&lang="+lang },
        { text: L.btn.change,  callback_data: "action=change_amount&route="+route+"&lang="+lang },
      ],[
        { text: L.btn.setAlert, callback_data: "alerts=start&route="+route+"&amount="+(amt||"")+"&lang="+lang },
        { text: L.btn.premium, callback_data: "premium=open&lang="+lang },
      ],[
        { text: L.btn.help, callback_data: "help=open&lang="+lang },
        { text: L.btn.legal, callback_data: "legal=open&lang="+lang },
      ]]});
    }

    function readyButtons(amt, route) {
      return JSON.stringify({ inline_keyboard: [[
        { text: L.btn.setAlert,  callback_data: "alerts=start&route="+route+"&amount="+(amt||"")+"&lang="+lang },
        { text: "🔄 Actualiser", callback_data: "action=refresh&route="+route+"&amount="+(amt||"")+"&lang="+lang },
      ],[
        { text: "🚀 Découvrir Premium ✨", callback_data: "premium=open&lang="+lang },
        { text: L.btn.back,       callback_data: "action=back_main&route="+route+"&amount="+(amt||"")+"&lang="+lang },
      ]]});
    }

    // =========================
    // Comparo card (adaptée)
    // =========================
    function buildComparoCard(opts) {
      const route = opts.route, amount = opts.amount;
      let onOut = null, onRate = null, header;
      header = (route==="brleur") ? "<b>💱 Comparaison BRL → EUR</b>" : "<b>💱 Comparaison EUR → BRL</b>";

      if (route === "brleur") {
        const on = amount ? toEUR(amount) : { eur_net: null, onchainRate: 1 / cross_eur_brl };
        onOut = on.eur_net; onRate = on.onchainRate;
      } else {
        const on = amount ? toBRL(amount) : { brl_net: null, onchainRate: cross_eur_brl };
        onOut = on.brl_net; onRate = on.onchainRate;
      }

      let bankName, bankOut = null, bankRate = null;
      if (wiseData && wiseData.bestBank) {
        bankName = wiseData.bestBank.provider;
        bankOut  = amount ? wiseData.bestBank.out  : null;
        bankRate = wiseData.bestBank.rate || null;
      } else {
        bankName = "Wise (est.)";
        bankRate = cross_eur_brl * 0.98;
        bankOut  = amount ? amount * bankRate : null;
      }

      const ref = L.ref(r4(cross_eur_brl, locOf(lang)), tsLocal(null, lang));
      const lOn = amount
        ? L.lineOnAmt(amount, onOut || 0) + "\n" + L.lineOnEff(onRate || cross_eur_brl)
        : L.lineOnRate(onRate || cross_eur_brl);
      const lBk = (amount
        ? L.lineBkAmt(bankName, amount, bankOut || 0)
        : ("🏦 " + bankName + " : " + L.lineBkEff(bankRate || 0))) + "\n" + L.lineBkEff(bankRate || 0);

      // Others list (if providers)
      const others = [];
      if (wiseData && wiseData.providers) {
        for (const p of wiseData.providers.slice(0,3)) {
          if (p && p.provider && (p.provider!==bankName)) {
            const out = amount ? p.out : null;
            const rate = p.rate;
            others.push("• "+p.provider+" : "+ (amount ? ( (route==="brleur")? ("R$ "+fmt(amount,0,loc)+" → € "+fmt(out||0,2,loc)) : ("€ "+fmt(amount,0,loc)+" → R$ "+fmt(out||0,2,loc)) ) : "") + (rate?(" ("+fmt(rate,4,loc)+")"):""));
          }
        }
      }

      let deltaPct = 0;
      if (amount && bankOut && onOut) deltaPct = ((onOut - bankOut) / bankOut) * 100;
      else if (!amount && bankRate && onRate) deltaPct = ((onRate - bankRate) / bankRate) * 100;
      const sign = deltaPct >= 0 ? "+" : "−";
      const winner = (deltaPct>=0) ? (lang==="pt"?"on-chain":(lang==="en")?"on-chain":"on-chain") : bankName;

      const parts = [
        header, "",
        ref, "",
        lOn, "",
        L.lineBkAmt(bankName, (amount|| (route==="brleur"?CONFIG.UI.DEFAULT_BRL:CONFIG.UI.DEFAULT_EUR)), bankOut || 0),
        L.lineBkEff(bankRate || 0),
      ];
      if (others.length) {
        parts.push("", L.othersHdr, ...others);
      }
      parts.push("", L.delta(sign, Math.abs(deltaPct)) + winner);
      parts.push("", "Données off-chain via Wise Comparisons. Parrainage : gratuit pour toi (parfois bonus), ça finance le service.");

      return { text: parts.join("\n"), reply_markup: mainButtons(amount, route) };
    }

    // =========================
    // ACTIONS (routeur callbacks)
    // =========================
    function askAmountScreen(route){
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: L.btn.back, callback_data: "action=back_main&route="+route+"&lang="+lang },
      ]]});
      return { chatId, text: "✏️ Entre un montant (ex. 1000 ou “€ 1 000” / “R$ 1.000”).\nTu peux aussi préciser la route dans la même phrase.", parse_mode:"HTML", reply_markup: rk };
    }
    function routeAmbiguityScreen(montant){
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "🇪🇺 EUR → 🇧🇷 BRL (Pix)", callback_data: "route=eurbrl&amount="+(montant||"")+"&lang="+lang },
        { text: "🇧🇷 BRL → 🇪🇺 EUR (SEPA)", callback_data: "route=brleur&amount="+(montant||"")+"&lang="+lang },
      ],[
        { text: "✏️ Changer le montant", callback_data: "action=change_amount&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      return { chatId, text: "Tu veux faire quoi avec "+(montant?("<b>"+montant+"</b>"):"ce montant")+" ?", parse_mode:"HTML", reply_markup: rk };
    }

    // Pedagogy shortcuts (already handled by edu=...)

    // Premium open
    if (cbq && cbq.data && /^premium=open/.test(cbq.data)) {
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "✨ Je suis intéressé", callback_data: "premium=interest&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      const t = "🚀 Premium\n\nPour aller plus loin :\n• Multi-alertes (plusieurs seuils par paire)\n• Multi-devises (EUR/BRL/USD/…)\n• Vérifs plus rapides (rafraîchissement + fréquent)\n\nIntéressé ? Dis-moi et je te réserverai l’accès prioritaire.";
      return { chatId, text: t, parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }
    if (cbq && cbq.data && /^premium=interest/.test(cbq.data)) {
      // Store interest flag
      setS("premium_interest", true);
      return { chatId, text: "Merci ! Ton intérêt pour Premium est noté ✅\nTu seras contacté en priorité lors de l’ouverture.", parse_mode:"HTML" };
    }

    // Alerts flow (texte libre + fallback)
    function parseAlertFreeText(s){
      if (!s) return null;
      const ss = s.toLowerCase();
      // Pair
      let pair = null;
      if (ss.includes("eur") && (ss.includes("brl") || ss.includes("r$") || ss.includes("real")))
        pair = "eurbrl";
      if ((ss.includes("brl") || ss.includes("r$") || ss.includes("real")) && ss.includes("eur"))
        pair = "brleur";
      // Sens
      let sens = null;
      if (ss.includes(">") || /(au\s?dessus|acima|above)/.test(ss)) sens = ">";
      if (ss.includes("<") || /(en\s?dessous|abaixo|below)/.test(ss)) sens = sens || "<";
      // Threshold
      const th = parseNumberLike(s);
      const seuil = (th && isFinite(th)) ? th : null;

      if (!pair && /(eur.*brl|eur\/brl|eur->brl)/.test(ss)) pair = "eurbrl";
      if (!pair && /(brl.*eur|brl\/eur|brl->eur)/.test(ss)) pair = "brleur";

      if (pair && sens && seuil) return { pair, sens, seuil: seuil };
      return null;
    }

    if (cbq && cbq.data && /^alerts=start/.test(cbq.data)) {
      setS("awaiting_alert_text", true);
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "❓Aide (créer)", callback_data: "alerts=help&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      const t = "⏰ Créer une alerte de taux\n\nDis-moi en une phrase, par ex. :\n• “Alerte EUR→BRL si > 6,20”\n• “Préviens-moi BRL→EUR sous 0,17”\n• “Alerte 6,30 sur EUR/BRL à la hausse”";
      return { chatId, text: t, parse_mode:"HTML", reply_markup: rk };
    }
    if (cbq && cbq.data && /^alerts=help/.test(cbq.data)) {
      setS("alerts_help", true);
      // We will collect stepwise via buttons; for MVP we just show guidance with buttons
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "EUR→BRL", callback_data: "alerts:p=eurbrl&lang="+lang },
        { text: "BRL→EUR", callback_data: "alerts:p=brleur&lang="+lang },
      ],[
        { text: ">", callback_data: "alerts:s=>&lang="+lang },
        { text: "<", callback_data: "alerts:s=<&lang="+lang },
      ],[
        { text: "OK", callback_data: "alerts=ok&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      const t = "Choisis ta paire, le sens et le seuil :\n1) Paire : EUR→BRL ou BRL→EUR\n2) Sens : au-dessus (>) ou en-dessous (<)\n3) Seuil : ex. 6,20\n\nExemple : EUR→BRL, >, 6,20";
      return { chatId, text: t, parse_mode:"HTML", reply_markup: rk };
    }
    if (cbq && cbq.data && /^alerts:p=/.test(cbq.data)) {
      const pair = cbq.data.split("alerts:p=")[1].split("&")[0];
      setS("alert_pair", pair);
      return { chatId, text: "Paire enregistrée : "+(pair==="eurbrl"?"EUR→BRL":"BRL→EUR")+" ✅\nEntre maintenant un seuil (ex. 6,20) ou choisis le sens.", parse_mode:"HTML" };
    }
    if (cbq && cbq.data && /^alerts:s=/.test(cbq.data)) {
      const sens = cbq.data.split("alerts:s=")[1].split("&")[0];
      setS("alert_sens", sens);
      return { chatId, text: "Sens enregistré : "+sens+" ✅\nEntre maintenant un seuil (ex. 6,20).", parse_mode:"HTML" };
    }
    if (cbq && cbq.data && /^alerts=ok/.test(cbq.data)) {
      const pair = getS("alert_pair"), sens = getS("alert_sens"), seuil = getS("alert_seuil");
      if (pair && sens && seuil) {
        setS("alert_ready", true);
        const rk = JSON.stringify({ inline_keyboard: [[
          { text: "✅ Activer", callback_data: "alerts=activate&lang="+lang },
          { text: "✏️ Modifier", callback_data: "alerts=start&lang="+lang },
        ],[
          { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
        ]]});
        const t = "✅ Alerte prête :\n• Paire : "+(pair==="eurbrl"?"EUR→BRL":"BRL→EUR")+"\n• Condition : "+sens+" "+fmt(seuil,4,loc)+"\n\nJe t’enverrai un message dès que la condition est atteinte.";
        return { chatId, text: t, parse_mode:"HTML", reply_markup: rk };
      } else {
        return { chatId, text: "Il manque des infos. Choisis la paire, le sens et entre le seuil (ex. 6,20).", parse_mode:"HTML" };
      }
    }
    if (cbq && cbq.data && /^alerts=activate/.test(cbq.data)) {
      if (getS("alert_ready")) {
        // Persist alert (for MVP just save in checkpoint)
        setS("alert_active", JSON.stringify({pair:getS("alert_pair"), sens:getS("alert_sens"), seuil:getS("alert_seuil")}));
        delS("alert_ready");
        const rk = JSON.stringify({ inline_keyboard: [[
          { text: "📜 Voir mes alertes", callback_data: "alerts=list&lang="+lang },
          { text: "➕ Nouvelle alerte", callback_data: "alerts=start&lang="+lang },
        ],[
          { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
        ]]});
        const a = JSON.parse(getS("alert_active")||"{}");
        const t = "⏰ Alerte activée !\n• "+(a.pair==="eurbrl"?"EUR→BRL":"BRL→EUR")+" • "+a.sens+" "+fmt(a.seuil,4,loc)+"\nTu peux en créer une autre à tout moment (1 alerte active par paire/utilisateur).";
        return { chatId, text: t, parse_mode:"HTML", reply_markup: rk };
      }
      return { chatId, text: "Rien à activer pour l’instant.", parse_mode:"HTML" };
    }
    if (cbq && cbq.data && /^alerts=list/.test(cbq.data)) {
      const a = JSON.parse(getS("alert_active")||"{}");
      const label = (a && a.pair) ? ((a.pair==="eurbrl"?"EUR→BRL":"BRL→EUR")+" — "+a.sens+" "+fmt(a.seuil,4,loc)+" — ✅ active") : "Aucune alerte.";
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: (a&&a.pair)?"⛔ Désactiver "+(a.pair==="eurbrl"?"EUR→BRL":"BRL→EUR"):"—", callback_data: "alerts=disable&lang="+lang, disabled: !(a&&a.pair) },
        { text: "➕ Nouvelle alerte", callback_data: "alerts=start&lang="+lang },
      ],[
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      return { chatId, text: "🔔 Mes alertes\n• "+label, parse_mode:"HTML", reply_markup: rk };
    }
    if (cbq && cbq.data && /^alerts=disable/.test(cbq.data)) {
      delS("alert_active");
      return { chatId, text: "Alerte désactivée ✅", parse_mode:"HTML" };
    }

    if (getS("awaiting_alert_text") && textRaw) {
      // try parse
      const parsed = parseAlertFreeText(textRaw);
      if (parsed) {
        delS("awaiting_alert_text");
        setS("alert_pair", parsed.pair);
        setS("alert_sens", parsed.sens);
        setS("alert_seuil", parsed.seuil);
        setS("alert_ready", true);
        const rk = JSON.stringify({ inline_keyboard: [[
          { text: "✅ Activer", callback_data: "alerts=activate&lang="+lang },
          { text: "✏️ Modifier", callback_data: "alerts=start&lang="+lang },
        ],[
          { text: "📜 Voir mes alertes", callback_data: "alerts=list&lang="+lang },
          { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
        ]]});
        const t = "✅ Alerte prête :\n• Paire : "+(parsed.pair==="eurbrl"?"EUR→BRL":"BRL→EUR")+"\n• Condition : "+parsed.sens+" "+fmt(parsed.seuil,4,loc)+"\n\nJe t’enverrai un message dès que la condition est atteinte.";
        return { chatId, text: t, parse_mode:"HTML", reply_markup: rk };
      } else {
        const rk = JSON.stringify({ inline_keyboard: [[
          { text: "❓Aide (créer)", callback_data: "alerts=help&lang="+lang },
          { text: "➕ Nouvelle alerte", callback_data: "alerts=start&lang="+lang },
        ],[
          { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
        ]]});
        const t = "😕 Je n’ai pas compris ta demande.\nTu peux réessayer en précisant :\n• Paire (EUR→BRL / BRL→EUR)\n• Sens (> ou <)\n• Seuil (ex. 6,20)\n\nOu utilise l’aide.";
        return { chatId, text: t, parse_mode:"HTML", reply_markup: rk };
      }
    }
    if (getS("alerts_help") && textRaw) {
      const n = parseNumberLike(textRaw);
      if (n) { setS("alert_seuil", n); return { chatId, text: "Seuil enregistré : "+fmt(n,4,loc)+" ✅\nClique OK pour récapituler.", parse_mode:"HTML" }; }
    }

    // =========================
    // Off-chain offers extended
    // =========================
    if (cbq && cbq.data && /^action=see_offers/.test(cbq.data)) {
      const amt = amount || (route==="brleur"?CONFIG.UI.DEFAULT_BRL:CONFIG.UI.DEFAULT_EUR);
      const providers = (wiseData && wiseData.providers) ? wiseData.providers : [];
      const lines = ["<b>🏦 Off-chain — détails</b>"];
      if (providers.length) {
        for (const p of providers) {
          if (!p) continue;
          const out = p.out;
          if (route==="brleur") {
            lines.push("• "+p.provider+": R$ "+fmt(amt,0,loc)+" → € "+fmt(out||0,2,loc)+" ("+fmt(p.rate||0,4,loc)+")");
          } else {
            lines.push("• "+p.provider+": € "+fmt(amt,0,loc)+" → R$ "+fmt(out||0,2,loc)+" ("+fmt(p.rate||0,4,loc)+")");
          }
        }
      } else {
        const estRate = cross_eur_brl * 0.98;
        if (route==="brleur") {
          lines.push("Wise (est.) R$ "+fmt(amt,0,loc)+" → € "+fmt((amt/estRate)||0,2,loc)+" ("+fmt(1/estRate,4,loc)+")");
        } else {
          lines.push("Wise (est.) € "+fmt(amt,0,loc)+" → R$ "+fmt((amt*estRate)||0,2,loc)+" ("+fmt(estRate,4,loc)+")");
        }
        lines.push("⚠️ Liste live indisponible (ajoute le token Wise).");
      }
      lines.push("\n📊 Données off-chain via Wise Comparisons.\n🙏 Liens de parrainage : gratuits pour toi (parfois bonus), ça finance le service.");
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "🔗 Ouvrir Wise", url: CONFIG.LINKS.WISE },
        { text: "🔗 Ouvrir Remitly", url: CONFIG.LINKS.REMITLY },
      ],[
        { text: "🔗 Ouvrir Instarem", url: CONFIG.LINKS.INSTAREM },
        { text: "🚀 Revenir on-chain", callback_data: "mode=onchain&route="+route+"&amount="+(amt||"")+"&lang="+lang },
      ],[
        { text: L.btn.back, callback_data: "action=back_main&route="+route+"&amount="+(amt||"")+"&lang="+lang },
      ]]});
      return { chatId, text: lines.join("\n"), parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }

    // =========================
    // On-chain route entry (pedago + links EU/BR)
    // =========================
    if (cbq && cbq.data && cbq.data.includes("mode=onchain")) {
      const t = [
        "🚀 Route on-chain (recommandée)",
        "",
        "L’idée est simple : tu envoies tes euros et tu reçois des reais par Pix.",
        "Ça passe par une étape intermédiaire avec l’USDC (un dollar numérique).",
        "",
        "En pratique :",
        "1️⃣ En Europe → tu changes tes EUR en USDC.",
        "2️⃣ Transfert → tu envoies tes USDC par la blockchain (rapide et peu cher).",
        "3️⃣ Au Brésil → tu changes tes USDC en BRL et tu reçois par Pix.",
        "",
        "ℹ️ Il te faut :",
        "• un compte d’exchange en Europe,",
        "• un compte d’exchange au Brésil.",
        "",
        "🙏 Liens de parrainage vers des plateformes sûres (frais souvent excellents). C’est gratuit pour toi et ça finance ce service (parfois bonus)."
      ].join("\n");
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "🇪🇺 Ouvrir compte UE (Kraken)", url: CONFIG.LINKS.KRAKEN },
        { text: "🇧🇷 Ouvrir compte BR (Binance BR)", url: CONFIG.LINKS.BINANCE_BR },
      ],[
        { text: "▶️ Démarrer le guide", callback_data: "guide=start&route="+(route||"eurbrl")+"&amount="+(amount||"")+"&lang="+lang },
      ],[
        { text: "🪙 Qu’est-ce que l’USDC ?", callback_data: "edu=usdc&lang="+lang },
        { text: "📈 Market vs Limit", callback_data: "edu=marketlimit&lang="+lang },
      ],[
        { text: "🏷️ C’est quoi un stablecoin ?", callback_data: "edu=stablecoin&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&route="+(route||"eurbrl")+"&amount="+(amount||"")+"&lang="+lang },
      ]]});
      return { chatId, text: t, parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }

        // ===== EUR→BRL GUIDE =====
    if (cbq && cbq.data && /^guide=start/.test(cbq.data)) {
      const p = new URLSearchParams(cbq.data);
      const amt = parseFloat(p.get("amount")) || CONFIG.UI.DEFAULT_EUR;
      const t = [
        "✅ Tu as (ou tu vas avoir) :",
        "• Un compte 🇪🇺 pour déposer tes EUR (SEPA → USDC)",
        "• Un compte 🇧🇷 pour retirer tes BRL (USDC → Pix)",
        "",
        "🔗 Entre les deux : on transfère les USDC « on-chain ».",
        "",
        "✨ Tu vas maintenant utiliser la blockchain.",
        "Ça peut sembler nouveau et c’est normal d’avoir une petite appréhension.",
        "Mais c’est aussi excitant : tu découvres ce que beaucoup d’institutions utilisent déjà au quotidien.",
        "",
        "🚀 Tu vas voir, ce n’est pas si compliqué — je t’accompagne pas à pas.",
        "Résultat : un transfert rapide, sûr et peu coûteux, directement entre l’Europe et le Brésil."
      ].join("\n") + estimationLine("eurbrl", amt);
      return { chatId, text: t, parse_mode:"HTML",
        reply_markup: guideBtns("guide=1&route=eurbrl&amount="+amt+"&lang="+lang) };
    }

    // 1) Dépôt EUR + achat USDC (UE)
    if (cbq && cbq.data && /^guide=1\b/.test(cbq.data)) {
      const p = new URLSearchParams(cbq.data);
      const amt = parseFloat(p.get("amount")) || CONFIG.UI.DEFAULT_EUR;
      const t = [
        "🟦 Étape 1 — Déposer des EUR et acheter de l’USDC (🇪🇺)",
        "",
        "1) Sur ton exchange UE, cherche la rubrique « Dépôt » en EUR (souvent appelé « FIAT »). Choisis SEPA.",
        "2) Une fois les EUR crédités, cherche le marché pour acheter de l’USDC (menu « Marché » / « Trader »).",
        "3) Type d’ordre :",
        "   • <b>Market</b> (au marché) = simple, immédiat → recommandé pour débuter",
        "   • <b>Limit</b> (limite) = tu fixes ton prix → utile pour gros montants/liquidité",
        "",
        "Astuce : si tu veux « juste échanger », choisis Market.",
      ].join("\n") + estimationLine("eurbrl", amt);
      return { chatId, text: t, parse_mode:"HTML",
        reply_markup: guideBtns("guide=2.1&route=eurbrl&amount="+amt+"&lang="+lang, "guide=start&route=eurbrl&amount="+amt+"&lang="+lang) };
    }

    // 2.1) Récupérer adresse dépôt BR (USDC)
    if (cbq && cbq.data && /^guide=2\.1\b/.test(cbq.data)) {
      const p = new URLSearchParams(cbq.data);
      const amt = parseFloat(p.get("amount")) || CONFIG.UI.DEFAULT_EUR;
      const t = [
        "🔗 Étape 2 — Transférer tes USDC",
        "2.1) Récupérer ton adresse de dépôt 🇧🇷",
        "",
        "• Dans ton exchange brésilien, ouvre « Dépôt / Crypto »",
        "• Choisis USDC comme crypto à déposer",
        "• Choisis le réseau <b>Polygon</b> (MATIC)",
        "• Copie soigneusement l’adresse",
        "💡 Une adresse, c’est comme un IBAN version blockchain (longue suite de lettres/chiffres)."
      ].join("\n");
      return { chatId, text: t, parse_mode:"HTML",
        reply_markup: guideBtns("guide=2.2&route=eurbrl&amount="+amt+"&lang="+lang, "guide=1&route=eurbrl&amount="+amt+"&lang="+lang) };
    }

    // 2.2) Préparer l’envoi depuis l’exchange UE
    if (cbq && cbq.data && /^guide=2\.2\b/.test(cbq.data)) {
      const p = new URLSearchParams(cbq.data);
      const amt = parseFloat(p.get("amount")) || CONFIG.UI.DEFAULT_EUR;
      const t = [
        "🔗 Étape 2 — Transférer tes USDC",
        "2.2) Préparer l’envoi depuis ton exchange 🇪🇺",
        "",
        "• Va dans « Retrait / Withdraw » → USDC",
        "• Colle l’adresse copiée (celle de l’exchange 🇧🇷)",
        "• Choisis le réseau <b>Polygon</b> (MATIC)",
        "• Entre le montant à envoyer (tu peux tester avec un petit montant d’abord —",
        "  ça double les frais fixes, mais c’est une bonne pratique très répandue)."
      ].join("\n");
      return { chatId, text: t, parse_mode:"HTML",
        reply_markup: guideBtns("guide=2.3&route=eurbrl&amount="+amt+"&lang="+lang, "guide=2.1&route=eurbrl&amount="+amt+"&lang="+lang) };
    }

    // 2.3) Vérifier puis confirmer l’envoi
    if (cbq && cbq.data && /^guide=2\.3\b/.test(cbq.data)) {
      const p = new URLSearchParams(cbq.data);
      const amt = parseFloat(p.get("amount")) || CONFIG.UI.DEFAULT_EUR;
      const t = [
        "🔗 Étape 2 — Transférer tes USDC",
        "2.3) Vérifier puis confirmer l’envoi",
        "",
        "✅ Vérifie <b>trois fois</b> :",
        "• L’<b>adresse</b> (un seul caractère faux = fonds perdus)",
        "• Le <b>réseau</b> (Polygon) — penser « choisir la bonne voie du train »",
        "",
        "Une fois sûr(e), tu peux confirmer le transfert."
      ].join("\n");
      return { chatId, text: t, parse_mode:"HTML",
        reply_markup: guideBtns("guide=2.4&route=eurbrl&amount="+amt+"&lang="+lang, "guide=2.2&route=eurbrl&amount="+amt+"&lang="+lang) };
    }

    // 2.4) Attente et arrivée
    if (cbq && cbq.data && /^guide=2\.4\b/.test(cbq.data)) {
      const p = new URLSearchParams(cbq.data);
      const amt = parseFloat(p.get("amount")) || CONFIG.UI.DEFAULT_EUR;
      const t = [
        "🔗 Étape 2 — Transférer tes USDC",
        "2.4) Attendre l’arrivée",
        "",
        "• En général 1–2 minutes (parfois jusqu’à 10)",
        "• Tu verras ton solde USDC apparaître côté 🇧🇷",
        "",
        "✅ Résultat : tes USDC sont bien arrivés — on passe à l’étape 3 (vente en BRL + Pix)."
      ].join("\n");
      return { chatId, text: t, parse_mode:"HTML",
        reply_markup: guideBtns("guide=3.1&route=eurbrl&amount="+amt+"&lang="+lang, "guide=2.3&route=eurbrl&amount="+amt+"&lang="+lang) };
    }

    // 3.1) Vendre USDC→BRL (BR)
    if (cbq && cbq.data && /^guide=3\.1\b/.test(cbq.data)) {
      const p = new URLSearchParams(cbq.data);
      const amt = parseFloat(p.get("amount")) || CONFIG.UI.DEFAULT_EUR;
      const t = [
        "🟩 Étape 3 — Vendre USDC→BRL (🇧🇷)",
        "",
        "• Va sur le marché USDC/BRL (menu « Marché/Trader »)",
        "• Choisis l’ordre <b>Market</b> (simple, immédiat) et vends tes USDC",
        "• Les frais de trading sont en général ~0,20%",
      ].join("\n") + estimationLine("eurbrl", amt);
      return { chatId, text: t, parse_mode:"HTML",
        reply_markup: guideBtns("guide=3.2&route=eurbrl&amount="+amt+"&lang="+lang, "guide=2.4&route=eurbrl&amount="+amt+"&lang="+lang) };
    }

    // 3.2) Retrait Pix
    if (cbq && cbq.data && /^guide=3\.2\b/.test(cbq.data)) {
      const p = new URLSearchParams(cbq.data);
      const amt = parseFloat(p.get("amount")) || CONFIG.UI.DEFAULT_EUR;
      const t = [
        "🟩 Étape 3 — Retrait Pix",
        "",
        "• Ouvre « Retrait BRL » / « Pix »",
        "• Montant : choisis ce que tu veux retirer",
        "• Frais Pix : souvent très bas (parfois ~R$3,50) — honnêtement ça devrait être gratuit, mais bon… 😉",
        "• Confirme le retrait",
        "",
        "D’ailleurs : une clé Pix, c’est juste un identifiant de paiement local — là, tu sais faire tout(e) seul(e) 😉"
      ].join("\n");
      return { chatId, text: t, parse_mode:"HTML",
        reply_markup: guideBtns("guide=3.3&route=eurbrl&amount="+amt+"&lang="+lang, "guide=3.1&route=eurbrl&amount="+amt+"&lang="+lang) };
    }

    // 3.3) Confirmation / réception
    if (cbq && cbq.data && /^guide=3\.3\b/.test(cbq.data)) {
      const p = new URLSearchParams(cbq.data);
      const amt = parseFloat(p.get("amount")) || CONFIG.UI.DEFAULT_EUR;
      const t = [
        "🟩 Étape 3 — Confirmation",
        "",
        "• Le Pix arrive généralement en quelques secondes/minutes",
        "• Vérifie ton compte bancaire brésilien",
        "",
        "🎉 Top, bonne conversion !"
      ].join("\n");
      return { chatId, text: t, parse_mode:"HTML",
        reply_markup: guideBtns("guide=3.4&route=eurbrl&amount="+amt+"&lang="+lang, "guide=3.2&route=eurbrl&amount="+amt+"&lang="+lang) };
    }

    // 3.4) Wrap-up : alertes + premium + feedback
    if (cbq && cbq.data && /^guide=3\.4\b/.test(cbq.data)) {
      const t = [
        "🚀 Bien joué ! Tu viens d’utiliser la blockchain pour un transfert réel.",
        "Tu as appris un truc qui va devenir de plus en plus courant — la prochaine fois ce sera encore plus simple 😉",
        "",
        "Ce que je peux faire pour toi maintenant :",
        "• ⏰ <b>Alerte de taux</b> pour être notifié dès qu’un seuil t’intéresse",
        "• 🚀 <b>Premium</b> : multi-alertes, multi-devises, vérifs plus rapides",
        "• 💬 <b>Question/suggestion</b> : je suis preneur de ton retour !"
      ].join("\n");
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: "⏰ Créer une alerte", callback_data: "alerts=start&lang="+lang },
        { text: "✨ En savoir plus (Premium)", callback_data: "premium=open&lang="+lang },
      ],[
        { text: "💬 Laisser une suggestion", callback_data: "help=open&lang="+lang },
        { text: L.btn.back, callback_data: "action=back_main&lang="+lang },
      ]]});
      return { chatId, text: t, parse_mode:"HTML", reply_markup: rk };
    }


    // Ready screen (I’ve got what I need)
    if (cbq && cbq.data && cbq.data.includes("mode=ready")) {
      const t = [
        "🙌 Nickel ! Si tu as tout ce qu’il te faut :",
        "",
        "• ⏰ Alerte de taux gratuite",
        "• 📊 Comparaisons en temps réel",
        "",
        "Pour aller plus loin avec 🚀 Premium :",
        "• Multi-alertes",
        "• Multi-devises",
        "• Vérifs plus rapides",
        "",
        "Tu peux aussi me laisser une suggestion à tout moment."
      ].join("\n");
      return { chatId, text: t, parse_mode:"HTML", reply_markup: readyButtons(amount, route), disable_web_page_preview:true };
    }

    // Change amount
    if (cbq && cbq.data && cbq.data.includes("action=change_amount")) {
      setS("awaiting_amount", true);
      return askAmountScreen(route);
    }
    if (getS("awaiting_amount") && textRaw) {
      delS("awaiting_amount");
      const val = parseNumberLike(textRaw);
      if (!val || !isFinite(val) || val<=0) {
        const rk = JSON.stringify({ inline_keyboard: [[
          { text: "↩️ Réessayer", callback_data: "action=change_amount&route="+route+"&lang="+lang },
          { text: L.btn.back, callback_data: "action=back_main&route="+route+"&lang="+lang },
        ]]});
        return { chatId, text: "⚠️ Montant invalide.\nExemples valides :\n• 1000\n• €1000\n• R$ 1.000", parse_mode:"HTML", reply_markup: rk };
      }
      // try infer route from same message
      let r = route;
      const tt = text;
      const wantsEURtoBRL = ((/eur|€|euro/.test(tt) && /(brl|r\$|real|reais)/.test(tt)));
      const wantsBRLtoEUR = (((/brl|r\$|real|reais/).test(tt) && /(eur|€|euro)/.test(tt)));
      if (wantsEURtoBRL && !wantsBRLtoEUR) r = "eurbrl";
      else if (wantsBRLtoEUR && !wantsEURtoBRL) r = "brleur";
      // if ambiguous
      if ((wantsEURtoBRL && wantsBRLtoEUR) || (!wantsEURtoBRL && !wantsBRLtoEUR)) {
        return routeAmbiguityScreen(val);
      }
      // else render comparo
      const built = buildComparoCard({ lang, route: r, amount: val });
      return { chatId, text: built.text, parse_mode:"HTML", reply_markup: built.reply_markup, disable_web_page_preview:true };
    }

    // Back to main comparo
    if (cbq && cbq.data && (cbq.data.includes("action=refresh") || cbq.data.includes("action=back_main"))) {
      const built = buildComparoCard({ lang, route, amount });
      return { chatId, text: built.text, parse_mode:"HTML", reply_markup: built.reply_markup, disable_web_page_preview:true };
    }

    // =========================
    // Default render (initial route choice if nothing)
    // =========================
    if (!(amount || (cbq && (cbq.data.includes("action=") || cbq.data.includes("mode=") || cbq.data.includes("onchain=") || cbq.data.includes("alerts=") || cbq.data.includes("premium=") || cbq.data.includes("edu="))))) {
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: L.btn.eurbrl(CONFIG.UI.DEFAULT_EUR), callback_data: "route=eurbrl&amount="+CONFIG.UI.DEFAULT_EUR+"&lang="+lang },
        { text: L.btn.brleur(CONFIG.UI.DEFAULT_BRL), callback_data: "route=brleur&amount="+CONFIG.UI.DEFAULT_BRL+"&lang="+lang },
      ],[
        { text: L.btn.langSwitch, callback_data: "lang="+lang },
        { text: L.btn.help, callback_data: "help=open&lang="+lang },
      ]]});
      return { chatId, text: L.promptAmt, parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }

    // =========================
    // Comparo render when amount exists
    // =========================
    if (amount) {
      const built = buildComparoCard({ lang, route, amount });
      return { chatId, text: built.text, parse_mode:"HTML", reply_markup: built.reply_markup, disable_web_page_preview:true };
    } else {
      // If user typed amount without route or ambiguous → show ambiguity choice
      if (textRaw && parseNumberLike(textRaw)) {
        const n = parseNumberLike(textRaw);
        return routeAmbiguityScreen(n);
      }
      const rk = JSON.stringify({ inline_keyboard: [[
        { text: L.btn.eurbrl(CONFIG.UI.DEFAULT_EUR), callback_data: "route=eurbrl&amount="+CONFIG.UI.DEFAULT_EUR+"&lang="+lang },
        { text: L.btn.brleur(CONFIG.UI.DEFAULT_BRL), callback_data: "route=brleur&amount="+CONFIG.UI.DEFAULT_BRL+"&lang="+lang },
      ]]});
      return { chatId, text: L.promptAmt, parse_mode:"HTML", reply_markup: rk, disable_web_page_preview:true };
    }
  }
});
