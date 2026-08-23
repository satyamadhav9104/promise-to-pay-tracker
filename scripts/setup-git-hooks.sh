#!/usr/bin/env bash
# Bash script to configure Git Hooks path to .githooks
set -e

echo "🔧 Configuring Git hooks path to .githooks..."
git config core.hooksPath .githooks
chmod +x .githooks/* || true

echo "✅ Git hooks configured successfully! (core.hooksPath = .githooks)"
echo "   - commit-msg: Enforces Conventional Commits"
echo "   - pre-push:   Enforces Git Architecture Branch Naming rules"
