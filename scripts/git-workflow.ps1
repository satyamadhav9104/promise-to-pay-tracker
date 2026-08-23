<#
.SYNOPSIS
    Git Architecture Automation CLI for Promise-to-Pay Tracker.
.DESCRIPTION
    Automates feature branching, release staging, hotfixing, and back-syncing.
.EXAMPLE
    .\scripts\git-workflow.ps1 feature-start login
    .\scripts\git-workflow.ps1 release-start 1.2.0
    .\scripts\git-workflow.ps1 hotfix-start 1.1.1
#>

param (
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet("feature-start", "feature-finish", "release-start", "release-finish", "hotfix-start", "hotfix-finish", "sync-develop", "status-graph")]
    [string]$Action,

    [Parameter(Mandatory=$false, Position=1)]
    [string]$Name
)

switch ($Action) {
    "feature-start" {
        if (-not $Name) { Write-Host "[ERROR] Feature name required (e.g. login, payment, profile)" -ForegroundColor Red; exit 1 }
        Write-Host "[*] Starting feature branch 'feature/$Name' from develop..." -ForegroundColor Cyan
        git checkout develop
        git pull origin develop
        git checkout -b "feature/$Name"
        Write-Host "[SUCCESS] Created branch feature/$Name. Happy coding!" -ForegroundColor Green
    }

    "feature-finish" {
        if (-not $Name) { Write-Host "[ERROR] Feature name required (e.g. login, payment, profile)" -ForegroundColor Red; exit 1 }
        Write-Host "[*] Merging feature/$Name into develop..." -ForegroundColor Cyan
        git checkout develop
        git pull origin develop
        git merge --no-ff "feature/$Name" -m "merge: PR feature/$Name into develop"
        Write-Host "[SUCCESS] Merged feature/$Name into develop successfully." -ForegroundColor Green
    }

    "release-start" {
        if (-not $Name) { Write-Host "[ERROR] Release version required (e.g. 1.2.0)" -ForegroundColor Red; exit 1 }
        $version = $Name.TrimStart("v")
        Write-Host "[*] Cutting release branch 'release/v$version' from develop..." -ForegroundColor Cyan
        git checkout develop
        git pull origin develop
        git checkout -b "release/v$version"
        Write-Host "[SUCCESS] Created branch release/v$version for QA and version bumping." -ForegroundColor Green
    }

    "release-finish" {
        if (-not $Name) { Write-Host "[ERROR] Release version required (e.g. 1.2.0)" -ForegroundColor Red; exit 1 }
        $version = $Name.TrimStart("v")
        Write-Host "[*] Finalizing release v$version into main and develop..." -ForegroundColor Cyan
        
        # Merge into main
        git checkout main
        git pull origin main
        git merge --no-ff "release/v$version" -m "release: v$version -- Production Release"
        git tag -a "v$version" -m "Release v${version} - Production deployment"

        # Sync back to develop
        git checkout develop
        git merge --no-ff "release/v$version" -m "merge: sync release v$version back to develop"
        
        Write-Host "[SUCCESS] Release v$version merged to main (tagged) and synced back to develop!" -ForegroundColor Green
    }

    "hotfix-start" {
        if (-not $Name) { Write-Host "[ERROR] Hotfix version required (e.g. 1.0.1)" -ForegroundColor Red; exit 1 }
        $version = $Name.TrimStart("v")
        Write-Host "[*] Cutting hotfix branch 'hotfix/v$version' from main..." -ForegroundColor Cyan
        git checkout main
        git pull origin main
        git checkout -b "hotfix/v$version"
        Write-Host "[SUCCESS] Created branch hotfix/v$version for urgent patch." -ForegroundColor Green
    }

    "hotfix-finish" {
        if (-not $Name) { Write-Host "[ERROR] Hotfix version required (e.g. 1.0.1)" -ForegroundColor Red; exit 1 }
        $version = $Name.TrimStart("v")
        Write-Host "[*] Finalizing hotfix v$version into main and develop..." -ForegroundColor Cyan
        
        # Merge into main
        git checkout main
        git merge --no-ff "hotfix/v$version" -m "hotfix: v$version emergency production patch"
        git tag -a "v$version" -m "Hotfix v${version} - Emergency production patch"

        # Sync back to develop
        git checkout develop
        git merge --no-ff "hotfix/v$version" -m "merge: sync hotfix v$version back to develop"

        Write-Host "[SUCCESS] Hotfix v$version merged to main (tagged) and synced back to develop!" -ForegroundColor Green
    }

    "sync-develop" {
        Write-Host "[*] Synchronizing main into develop..." -ForegroundColor Cyan
        git checkout develop
        git merge --no-ff main -m "merge: sync latest main into develop"
        Write-Host "[SUCCESS] develop synchronized with main." -ForegroundColor Green
    }

    "status-graph" {
        git log --graph --oneline --decorate --tags --all -n 25
    }
}
