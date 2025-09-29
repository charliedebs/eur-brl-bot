/**
 * Internationalisation (i18n) — gestion multilingue
 * FR · PT · EN
 */
function locOf(lang) {
  if (lang === "pt") return "pt-BR";
  if (lang === "en") return "en-US";
  return "fr-FR";
}

function I18N(lang, CONFIG) {
  const loc = locOf(lang);
  const L = {
    pickLang: "🌐 Choisis ta langue · Escolha o idioma · Choose your language:",
    title: (lang==="pt") ? "<b>💱 EUR → BRL — Melhor taxa</b>" 
          : (lang==="en") ? "<b>💱 EUR → BRL — Best rate</b>" 
                          : "<b>💱 EUR → BRL — Meilleur taux</b>",
    ref: (rate, ts)=> (lang==="pt")?("📊 Referência (Yahoo): "+rate+" • "+ts)
                       :(lang==="en")?("📊 Reference (Yahoo): "+rate+" • "+ts)
                                     :("📊 Référence (Yahoo): "+rate+" • "+ts),

    // Boutons
    btn: {
      langFR:"🇫🇷 Français",
      langPT:"🇧🇷 Português",
      langEN:"🇬🇧 English",
      eurbrl:(amt)=>"🇪🇺 EUR → 🇧🇷 BRL (Pix) · €"+amt,
      brleur:(amt)=>"🇧🇷 BRL → 🇪🇺 EUR (SEPA) · R$"+amt,
      guideOn:(lang==="pt")?"1️⃣ Ser guiado (on-chain)"
              :(lang==="en")?"1️⃣ Guide me (on-chain)"
                            :"1️⃣ Être guidé (on-chain)",
      stayOff:(lang==="pt")?"2️⃣ Ficar off-chain"
              :(lang==="en")?"2️⃣ Stay off-chain"
                            :"2️⃣ Rester hors-chain",
      ready:(lang==="pt")?"✅ Já tenho tudo"
           :(lang==="en")?"✅ I’m already set"
                         :"✅ J’ai déjà tout",
      setAlert:(lang==="pt")?"⏰ Criar alerta"
               :(lang==="en")?"⏰ Create alert"
                             :"⏰ Créer une alerte",
      back:(lang==="pt")?"⬅️ Voltar"
          :(lang==="en")?"⬅️ Back"
                        :"⬅️ Retour"
    }
  };
  return { L, loc };
}

module.exports = { I18N, locOf };
