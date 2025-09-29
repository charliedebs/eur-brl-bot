param([string]$m = "update")

git add .
git commit -m "$m"
git pull --rebase origin main
git push origin main
