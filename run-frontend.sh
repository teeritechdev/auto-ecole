#!/bin/bash
# ==============================================================================
# Script de lancement du Frontend Angular (Auto-École) sur Ubuntu / Linux
# ==============================================================================

set -e

echo "🚀 Démarrage du Frontend Auto-École..."

cd "$(dirname "$0")/frontend"

# Vérification de Node.js et npm
if ! command -v node &> /dev/null; then
    echo "❌ Erreur: Node.js n'est pas installé. Veuillez installer Node.js (v18+ ou v20+) :"
    echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "   sudo apt install -y nodejs"
    exit 1
fi

echo "🟢 Node.js $(node -v) & npm $(npm -v) détectés"

# Installation des dépendances si node_modules n'existe pas
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances npm..."
    npm install
fi

echo "🌐 Lancement du serveur Angular sur http://localhost:4200 ..."
npm start
