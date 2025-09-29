const { routeGuide } = require("../src/app/router");

function run(step, route="eurbrl", amount=1000, lang="fr") {
  const out = routeGuide({ step, route, amount, lang, CONFIG:{}, estimation:"" });
  const label = `${route} :: step=${step}`;
  console.log("----", label, "----");
  console.log((out && out.text) ? out.text.split("\n").slice(0,3).join("\n")+" ..." : "No text");
  console.log("reply_markup:", (out && out.reply_markup) ? "OK" : "missing");
  console.log();
}

try {
  // Étape 1
  run("1");
  // Étape 2.1 → 2.4
  run("2.1"); run("2.2"); run("2.3"); run("2.4");
  // Étape 3.1 → 3.4
  run("3.1"); run("3.2"); run("3.3"); run("3.4");

  // Symétrie BRL→EUR (3 appels)
  run("2.1", "brleur", 1000, "fr");
  run("3.1", "brleur", 1000, "fr");
  run("3.4", "brleur", 1000, "fr");

  console.log("✅ Smoke test terminé.");
} catch (e) {
  console.error("❌ Smoke test erreur:", e);
  process.exit(1);
}
