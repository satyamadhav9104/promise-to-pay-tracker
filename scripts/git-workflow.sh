#!/usr/bin/env bash
# Git Architecture Automation CLI for Promise-to-Pay Tracker
set -e

ACTION=$1
NAME=$2

case "$ACTION" in
    feature-start)
        if [ -z "$NAME" ]; then echo "Error: Feature name required (e.g. login, payment, profile)"; exit 1; fi
        echo "🚀 Starting feature branch 'feature/$NAME' from develop..."
        git checkout develop
        git pull origin develop
        git checkout -b "feature/$NAME"
        echo "✅ Created branch feature/$NAME. Happy coding!"
        ;;
    feature-finish)
        if [ -z "$NAME" ]; then echo "Error: Feature name required (e.g. login, payment, profile)"; exit 1; fi
        echo "🔀 Merging feature/$NAME into develop..."
        git checkout develop
        git pull origin develop
        git merge --no-ff "feature/$NAME" -m "merge: PR feature/$NAME into develop"
        echo "✅ Merged feature/$NAME into develop successfully."
        ;;
    release-start)
        if [ -z "$NAME" ]; then echo "Error: Release version required (e.g. 1.2.0)"; exit 1; fi
        VERSION=${NAME#v}
        echo "📦 Cutting release branch 'release/v$VERSION' from develop..."
        git checkout develop
        git pull origin develop
        git checkout -b "release/v$VERSION"
        echo "✅ Created branch release/v$VERSION for QA and version bumping."
        ;;
    release-finish)
        if [ -z "$NAME" ]; then echo "Error: Release version required (e.g. 1.2.0)"; exit 1; fi
        VERSION=${NAME#v}
        echo "🚢 Finalizing release v$VERSION into main and develop..."
        git checkout main
        git pull origin main
        git merge --no-ff "release/v$VERSION" -m "release: v$VERSION — Production Release"
        git tag -a "v$VERSION" -m "Release v$VERSION: Production deployment"
        git checkout develop
        git merge --no-ff "release/v$VERSION" -m "merge: sync release v$VERSION back to develop"
        echo "✅ Release v$VERSION merged to main (tagged) and synced back to develop!"
        ;;
    hotfix-start)
        if [ -z "$NAME" ]; then echo "Error: Hotfix version required (e.g. 1.0.1)"; exit 1; fi
        VERSION=${NAME#v}
        echo "🔥 Cutting hotfix branch 'hotfix/v$VERSION' from main..."
        git checkout main
        git pull origin main
        git checkout -b "hotfix/v$VERSION"
        echo "✅ Created branch hotfix/v$VERSION for urgent patch."
        ;;
    hotfix-finish)
        if [ -z "$NAME" ]; then echo "Error: Hotfix version required (e.g. 1.0.1)"; exit 1; fi
        VERSION=${NAME#v}
        echo "🚒 Finalizing hotfix v$VERSION into main and develop..."
        git checkout main
        git merge --no-ff "hotfix/v$VERSION" -m "hotfix: v$VERSION emergency production patch"
        git tag -a "v$VERSION" -m "Hotfix v$VERSION: Emergency production patch"
        git checkout develop
        git merge --no-ff "hotfix/v$VERSION" -m "merge: sync hotfix v$VERSION back to develop"
        echo "✅ Hotfix v$VERSION merged to main (tagged) and synced back to develop!"
        ;;
    sync-develop)
        echo "🔄 Synchronizing main into develop..."
        git checkout develop
        git merge --no-ff main -m "merge: sync latest main into develop"
        echo "✅ develop synchronized with main."
        ;;
    status-graph)
        git log --graph --oneline --decorate --tags --all -n 25
        ;;
    *)
        echo "Usage: ./scripts/git-workflow.sh <command> [name/version]"
        echo "Commands:"
        echo "  feature-start <name>     Start a new feature branch from develop"
        echo "  feature-finish <name>    Merge feature branch into develop"
        echo "  release-start <version>  Start a release branch from develop (e.g. 1.1.0)"
        echo "  release-finish <version> Merge release into main & develop with tag"
        echo "  hotfix-start <version>   Start an emergency hotfix from main (e.g. 1.0.1)"
        echo "  hotfix-finish <version>  Merge hotfix into main & develop with tag"
        echo "  sync-develop             Sync latest main back into develop"
        echo "  status-graph             View ASCII git graph"
        ;;
esac
