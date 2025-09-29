param(
  [string]$OutFile = "dist/pipedream_handler.js"
)

function Read-File($path) {
  if (!(Test-Path $path)) { throw "Fichier manquant: $path" }
  return [IO.File]::ReadAllText($path)
}

$router    = Read-File "src/app/router.js"
$step1     = Read-File "src/flows/onchain/step1_deposit.js"
$step2     = Read-File "src/flows/onchain/step2_transfer.js"
$step3     = Read-File "src/flows/onchain/step3_cashout.js"
$step4     = Read-File "src/flows/onchain/step4_wrap.js"
$keyboards = Read-File "src/ui/keyboards.js"
$main      = Read-File "src/app/main.js"

# Rewrites
$keyboards = $keyboards -replace 'module\.exports\s*=\s*{\s*guideBtns\s*}\s*;', 'globalThis.guideBtns = guideBtns;'
$router    = $router -replace 'const\s*{\s*guideBtns\s*}\s*=\s*require\(["'']\.\.\/ui\/keyboards["'']\);\s*', ''
$router    = $router -replace 'module\.exports\s*=\s*{\s*routeGuide\s*}\s*;', 'globalThis.routeGuide = routeGuide;'
$main      = $main   -replace 'const\s*{\s*routeGuide\s*}\s*=\s*require\(["'']\.\/router["'']\);\s*', ''
$step1     = $step1  -replace 'module\.exports\s*=\s*{[^}]*};', ''
$step2     = $step2  -replace 'module\.exports\s*=\s*{[^}]*};', ''
$step3     = $step3  -replace 'module\.exports\s*=\s*{[^}]*};', ''
$step4     = $step4  -replace 'module\.exports\s*=\s*{[^}]*};', ''

$banner = @"
// ========================================================
// PIPEDREAM HANDLER (bundle généré)
// Source of truth: repo Git eur-brl-bot
// Fichier généré par tools/build-pipedream.ps1
// ========================================================

const globalThis = (function(){ return this || global || window; })();

"@

$bundle = $banner + "// ---- ui/keyboards.js`n" + $keyboards + "`n" +
"// ---- flows/onchain/*.js`n" + $step1 + "`n" + $step2 + "`n" + $step3 + "`n" + $step4 + "`n" +
"// ---- app/router.js`n" + $router + "`n" +
"// ---- app/main.js`n" + $main + "`n" +
"// ---- Export unique pour Pipedream`n" + @"
exports.handler = async function pdStep({ steps, $ }) {
  try {
    const update = (steps && steps.trigger && steps.trigger.event && steps.trigger.event.body) || {};
    const state  = $.checkpoint || {};
    const CONFIG = (steps && steps.config && steps.config.$return_value) || {};

    const res = globalThis.handleUpdate
      ? globalThis.handleUpdate({ update, state, CONFIG })
      : { chatId:null, text:"Handler indisponible." };

    $.checkpoint = state;
    return res;
  } catch (e) {
    return { chatId:null, text: "Erreur handler: " + (e && e.message || e) };
  }
}
"@

$bundle | Set-Content -Encoding UTF8 $OutFile
Write-Host "✅ Bundle généré → $OutFile"
