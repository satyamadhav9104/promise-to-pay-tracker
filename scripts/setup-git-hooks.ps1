# PowerShell script to configure Git Hooks path to .githooks
Write-Host "🔧 Configuring Git hooks path to .githooks..." -ForegroundColor Cyan
git config core.hooksPath .githooks
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git hooks configured successfully! (core.hooksPath = .githooks)" -ForegroundColor Green
    Write-Host "   - commit-msg: Enforces Conventional Commits" -ForegroundColor Yellow
    Write-Host "   - pre-push:   Enforces Git Architecture Branch Naming rules" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to configure Git hooks." -ForegroundColor Red
}
