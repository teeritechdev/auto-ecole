#!/bin/bash
# ==============================================================================
# Script de lancement du Backend Spring Boot (Auto-École) sur Ubuntu / Linux
# ==============================================================================

set -e

echo "🚀 Démarrage du Backend Auto-École..."

cd "$(dirname "$0")/backend"

# Vérification de Java 21
if ! command -v java &> /dev/null; then
    echo "❌ Erreur: Java n'est pas installé. Veuillez installer OpenJDK 21 :"
    echo "   sudo apt update && sudo apt install -y openjdk-21-jdk"
    exit 1
fi

JAVA_VER=$(java -version 2>&1 | head -n 1)
echo "☕ Java détecté: $JAVA_VER"

# Compilation et exécution via Maven
if command -v mvn &> /dev/null; then
    echo "📦 Lancement via Maven..."
    mvn spring-boot:run
else
    echo "❌ Erreur: Maven n'est pas installé. Veuillez installer Maven :"
    echo "   sudo apt install -y maven"
    exit 1
fi
