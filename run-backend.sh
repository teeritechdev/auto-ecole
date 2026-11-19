#!/bin/bash
# ==============================================================================
# Script de lancement du Backend Spring Boot (Auto-École) sur Ubuntu / Linux
# ==============================================================================

set -e

echo "🚀 Démarrage du Backend Auto-École..."

# 1. Vérification et démarrage automatique de PostgreSQL si nécessaire
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "⚠️  PostgreSQL n'est pas actif sur le port 5432. Tentative de démarrage..."
    if command -v systemctl &> /dev/null && systemctl is-system-running &> /dev/null; then
        sudo systemctl start postgresql 2>/dev/null || true
    else
        sudo service postgresql start 2>/dev/null || true
    fi
    sleep 2
fi

if pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "✅ Base de données PostgreSQL connectée."
else
    echo "ℹ️  Note: Si la connexion échoue, lancez: sudo service postgresql start"
fi

cd "$(dirname "$0")/backend"

# 2. Vérification de Java 21
if ! command -v java &> /dev/null; then
    echo "❌ Erreur: Java n'est pas installé. Veuillez installer OpenJDK 21 :"
    echo "   sudo apt update && sudo apt install -y openjdk-21-jdk"
    exit 1
fi

JAVA_VER=$(java -version 2>&1 | head -n 1)
echo "☕ Java détecté: $JAVA_VER"

# 3. Compilation et exécution via Maven
if command -v mvn &> /dev/null; then
    echo "📦 Lancement via Maven..."
    mvn spring-boot:run
else
    echo "❌ Erreur: Maven n'est pas installé. Veuillez installer Maven :"
    echo "   sudo apt install -y maven"
    exit 1
fi
