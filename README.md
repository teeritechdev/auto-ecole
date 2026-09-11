 le nom# 🚗 Application Web de Gestion d'Auto-École

Application web complète pour la gestion administrative, pédagogique et financière d'une auto-école.

**Stack Technique :**
- **Backend :** Java 21 • Spring Boot 3.2.5 • Spring Data JPA • Spring Security (JWT) • Springdoc OpenAPI (Swagger UI) • OpenPDF • Apache POI
- **Frontend :** Angular 18 (Standalone Components) • TypeScript • RxJS • Chart.js • CSS Modern Responsive
- **Base de données :** PostgreSQL 16+
- **Environnement cible :** Ubuntu Linux / Windows / macOS
- **IDE & Outils recommandés :** IntelliJ IDEA • DBeaver Community Edition (DBeaver CE) • Postman / Swagger UI

---

## 📋 Table des Matières
1. [Fonctionnalités & Rôles](#-fonctionnalités--rôles)
2. [Prérequis sous Ubuntu](#-prérequis-sous-ubuntu)
3. [Configuration de la Base de Données (PostgreSQL & DBeaver CE)](#-configuration-de-la-base-de-données-postgresql--dbeaver-ce)
4. [Ouverture et Lancement dans IntelliJ IDEA](#-ouverture-et-lancement-dans-intellij-idea)
5. [Lancement du Frontend Angular](#-lancement-du-frontend-angular)
6. [Variables d'Environnement (Production)](#-variables-denvironnement-production)
7. [Comptes & Identifiants par Défaut](#-comptes--identifiants-par-défaut)
8. [Documentation API Swagger](#-documentation-api-swagger)
9. [Règles de Gestion Métier (RG01 - RG14)](#-règles-de-gestion-métier-rg01---rg14)
10. [Architecture du Projet](#-architecture-du-projet)
11. [Dépannage & Commandes Utiles](#-dépannage--commandes-utiles)

---

## ✨ Fonctionnalités & Rôles

Le système implémente une séparation stricte des responsabilités selon 4 profils utilisateurs :

| Rôle | Responsabilités Principales |
|---|---|
| 👑 **ADMIN** | Supervision générale, gestion des comptes utilisateurs, configuration des forfaits & catégories, journal d'audit, rapports globaux. |
| 📝 **SECRETAIRE** | Inscription des candidats, génération automatique des dossiers (`DOS-YYYY-XXXX`), suivi administratif et planification des épreuves. |
| 💳 **CAISSIERE** | Encaissement des versements, émission et impression des reçus (`REC-YYYY-XXXX`), gestion des mouvements de caisse (Entrées/Sorties), solde en direct. |
| 🚦 **MONITEUR** | Suivi pédagogique des candidats, saisie des résultats et notes d'examens (Code, Créneau, Circulation). |

---

## 🐧 Prérequis sous Ubuntu

Ouvrez un terminal sur votre machine Ubuntu et installez les outils requis :

### 1. Java 21 OpenJDK & Maven
```bash
sudo apt update
sudo apt install -y openjdk-21-jdk maven
java -version
mvn -version
```

### 2. Node.js (v20 LTS) & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3. PostgreSQL Server (ou Docker)
**Option A : Installation native PostgreSQL**
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

**Option B : Docker & Docker Compose** (recommandé si vous avez Docker)
```bash
# Lance PostgreSQL 16 en arrière-plan avec le port 5432 exposé
docker compose up -d
```

### 4. IntelliJ IDEA & DBeaver CE
```bash
# Installation via snap (recommandé sous Ubuntu)
sudo snap install intellij-idea-community --classic
sudo snap install dbeaver-ce
```

---

## 🗄️ Configuration de la Base de Données (PostgreSQL & DBeaver CE)

### Étape 1 : Création de la base de données dans PostgreSQL
Connectez-vous au serveur PostgreSQL (l'utilisateur système `postgres` est créé par l'installation) :
```bash
sudo -u postgres psql
```
Exécutez les commandes SQL suivantes :
```sql
CREATE DATABASE auto_ecole_db;

-- Définir le mot de passe de l'utilisateur postgres (exemple : postgres) :
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

> 💡 **Note :** PostgreSQL ne crée pas la base automatiquement au démarrage (contrairement à MySQL) — l'étape ci-dessus est donc obligatoire avant le premier lancement. Une fois la base créée, Spring Boot (`hibernate.ddl-auto: update`) crée automatiquement toutes les tables et relations.

---

### Étape 2 : Configuration de la Connexion dans DBeaver CE

1. **Lancez DBeaver CE** depuis le menu Ubuntu ou en ligne de commande (`dbeaver-ce`).
2. Cliquez sur **Nouvelle connexion** (icône prise électrique avec un `+`) ou faites `Ctrl + N` -> *Connexion à une base de données*.
3. Sélectionnez **PostgreSQL** puis cliquez sur **Suivant**.
4. Renseignez les paramètres de connexion :
   - **Hôte (Host) :** `localhost` (ou `127.0.0.1`)
   - **Port :** `5432`
   - **Base de données (Database) :** `auto_ecole_db`
   - **Nom d'utilisateur (Username) :** `postgres`
   - **Mot de passe (Password) :** votre mot de passe (`postgres` par défaut ci-dessus)

5. Cliquez sur **Tester la connexion** :
   - DBeaver téléchargera automatiquement le pilote JDBC officiel PostgreSQL si nécessaire.
   - Le message "Connecté" s'affiche avec succès.
6. Cliquez sur **Terminer**.

Vous pouvez maintenant visualiser l'arborescence des tables (`utilisateurs`, `candidats`, `paiements`, `recus`, `passages_examen`, `transactions_caisse`, `historique_actions`, etc.) et exécuter des requêtes SQL directement.

---

## 🚀 Ouverture et Lancement dans IntelliJ IDEA

### 1. Ouvrir le Projet dans IntelliJ IDEA
1. Lancez IntelliJ IDEA.
2. Cliquez sur **Open** (ou *File -> Open*).
3. Naviguez vers le dossier du projet `achille` et sélectionnez-le.

### 2. Définir le SDK Java 21
1. Allez dans le menu **File -> Project Structure** (ou `Ctrl + Alt + Shift + S`).
2. Dans l'onglet **Project** :
   - **SDK :** Choisissez **Java 21 (openjdk-21)**. Si absent, cliquez sur *Add SDK -> Download JDK...* ou *JDK on Disk* (`/usr/lib/jvm/java-21-openjdk-amd64`).
   - **Language level :** **21 - Sealed types, pattern matching, record patterns**.
3. Cliquez sur **Apply** puis **OK**.

### 3. Synchroniser les dépendances Maven
1. Ouvrez l'onglet latéral droit **Maven** dans IntelliJ.
2. Cliquez sur l'icône 🔄 **Reload All Maven Projects**.
3. Attendez quelques secondes que Maven télécharge et indexe les dépendances Spring Boot, Lombok, JJWT, Swagger, OpenPDF et Apache POI.

### 4. Vérifier la configuration `application.yml`
Ouvrez le fichier [application.yml](file:///backend/src/main/resources/application.yml) dans `backend/src/main/resources/` :
```yaml
server:
  port: 8080

spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/auto_ecole_db}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
```
Les valeurs après `:` sont les valeurs par défaut utilisées en local si aucune variable d'environnement n'est définie — rien à changer pour un usage en développement. Pour la production, voir [Variables d'environnement](#-variables-denvironnement-production) ci-dessous.

### 5. Démarrer le Backend
- **Option 1 (Graphique) :** Ouvrez la classe [AutoEcoleApplication.java](file:///backend/src/main/java/com/autoecole/AutoEcoleApplication.java), puis cliquez sur la flèche verte ▶️ à côté de `public class AutoEcoleApplication` -> **Run 'AutoEcoleApplication'**.
- **Option 2 (Terminal IntelliJ / Bash) :**
  ```bash
  ./run-backend.sh
  # ou
  cd backend && mvn spring-boot:run
  ```

Le backend s'initialise, crée les tables automatiquement, injecte les rôles et comptes par défaut, puis démarre sur **http://localhost:8080**.

---

## 🌐 Lancement du Frontend Angular

Dans un second onglet de terminal (dans IntelliJ IDEA ou terminal Ubuntu) :

```bash
cd frontend
npm install
npm start
```
Ou utilisez le script fourni :
```bash
./run-frontend.sh
```

Une fois compilé, ouvrez votre navigateur web sur :
👉 **http://localhost:4200**

---

## 🔐 Variables d'Environnement (Production)

En local, tout fonctionne sans rien configurer (valeurs par défaut de développement). **Avant tout déploiement en production**, définissez ces variables d'environnement :

| Variable | Rôle | Exemple |
|---|---|---|
| `JWT_SECRET` | Clé de signature des JWT. Le défaut est un placeholder **non sécurisé**, volontairement identifiable dans les logs au démarrage. | `openssl rand -base64 64` |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | Connexion PostgreSQL | — |
| `APP_SEED_ENABLED` | `false` désactive les comptes de démo (`admin/admin123`, etc.) et les données de démonstration. Un unique compte `admin` est alors créé avec un mot de passe aléatoire **affiché une seule fois** dans les logs au premier démarrage. | `false` |
| `APP_SWAGGER_PUBLIC` | `false` restreint Swagger UI / `/v3/api-docs` aux utilisateurs ADMIN authentifiés (au lieu d'un accès public). | `false` |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées à appeler l'API (liste séparée par des virgules) | `https://monapp.exemple.com` |
| `JWT_EXPIRATION_MS` | Durée de validité du token, en millisecondes (défaut : 2h) | `7200000` |

---

## 🔑 Comptes & Identifiants par Défaut

Lors du premier démarrage (avec `APP_SEED_ENABLED=true`, valeur par défaut), les comptes suivants sont créés automatiquement avec mot de passe haché par BCrypt :

| Rôle | Identifiant (Username) | Mot de Passe | Nom & Prénom | Téléphone |
|---|---|---|---|---|
| **Administrateur** | `admin` | `admin123` | Jean-Marc KOUASSI | 0701020304 |
| **Secrétaire** | `secretaire` | `secretaire123` | Aya Marie YAO | 0702030405 |
| **Caissière** | `caissiere` | `caissiere123` | Affoué Esther KOFFI | 0703040506 |
| **Moniteur** | `moniteur` | `moniteur123` | Ibrahim DIABATE | 0704050607 |

---

## 📖 Documentation API Swagger

L'API REST est entièrement documentée avec OpenAPI 3 et interactive via Swagger UI.

- **Interface Swagger UI :** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Spécification OpenAPI JSON :** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Endpoints Principaux :

| Module | Méthode | Endpoint | Description |
|---|---|---|---|
| **Authentification** | `POST` | `/api/auth/login` | Connexion utilisateur, émission JWT |
| | `GET` | `/api/auth/me` | Profil et rôle de l'utilisateur connecté |
| **Candidats** | `GET` | `/api/candidats` | Liste filtrée (recherche, statut, catégorie) |
| | `POST` | `/api/candidats` | Enregistrement d'un nouveau candidat |
| | `GET` | `/api/candidats/{id}` | Fiche détaillée candidat & solde |
| | `PUT` | `/api/candidats/{id}` | Modification candidat |
| | `DELETE` | `/api/candidats/{id}` | Suppression candidat (Admin) |
| **Paiements** | `POST` | `/api/paiements` | Enregistrement d'un versement & mise à jour caisse |
| | `GET` | `/api/paiements/recu/{numeroRecu}` | Consultation / impression reçu |
| | `PUT` | `/api/paiements/{id}/modifier` | Modification de paiement avec justification |
| | `PUT` | `/api/paiements/{id}/annuler` | Annulation de versement avec motif d'audit |
| **Examens** | `GET` | `/api/examens/candidat/{id}/bilan` | Bilan global des épreuves (Code, Créneau, Conduite) |
| | `POST` | `/api/examens/passage` | Enregistrement / notation d'un passage |
| **Caisse** | `GET` | `/api/caisse/solde` | Solde actuel, total entrées et total sorties |
| | `POST` | `/api/caisse/mouvement` | Saisie d'une dépense / sortie ou entrée manuelle |
| | `POST` | `/api/caisse/cloture` | Clôture de journée avec solde théorique |
| **Rapports & Exports** | `GET` | `/api/rapports/candidats/pdf` | Export PDF de la liste des candidats (OpenPDF) |
| | `GET` | `/api/rapports/candidats/excel` | Export Excel XLSX des candidats (Apache POI) |
| | `GET` | `/api/rapports/caisse/journalier/pdf` | Journal de caisse PDF |
| **Audit & Logs** | `GET` | `/api/audit` | Journal des actions sensibles |
| **Paramétrage** | `GET/POST`| `/api/parametrage/forfaits` | Gestion des forfaits (100k, 125k, etc.) |
| | `GET/POST`| `/api/parametrage/categories` | Gestion des catégories de permis (A1, B, C) |

---

## 📜 Règles de Gestion Métier (RG01 - RG14)

L'application applique rigoureusement les règles de gestion définies dans le cahier des charges :

- **RG01 (Forfaits) :** Deux forfaits pré-configurés : Forfait 1 (100 000 FCFA) et Forfait 2 (125 000 FCFA), éditables par l'Administrateur.
- **RG02 (Premier Versement) :** Premier versement obligatoire à l'inscription compris entre **35 000 FCFA** et **50 000 FCFA**.
- **RG03 (Versements Suivants) :** Versements libres selon les capacités financières du candidat jusqu'à concurrence du montant du forfait.
- **RG04 (Calcul Solde) :** `Solde Restant = Montant Forfait - Total Versé`. Le système bloque tout versement supérieur au solde restant.
- **RG05 (Émission Reçu) :** Tout versement validé génère immédiatement un reçu numéroté (`REC-YYYY-XXXX`) avec mentions légales, montant payé et reste à payer.
- **RG06 (Durée de Validité 8 Mois) :** La validité de l'inscription est de 8 mois. À l'échéance, le dossier passe automatiquement à `EXPIRE_NON_SOLDE` si le solde n'est pas soldé.
- **RG07 (Statut Soldé) :** Lorsque le reste à payer atteint 0 FCFA, le statut bascule automatiquement à `SOLDE`.
- **RG08 (Numérotation Dossier) :** Identifiant unique séquentiel annuel pour chaque candidat : `DOS-YYYY-XXXX`.
- **RG09 (Immutabilité & Traçabilité Financière) :** Aucune suppression physique de versement. Toute annulation ou modification exige un motif obligatoire et réajuste automatiquement la caisse et le solde du candidat.
- **RG10 (Ordre des Épreuves) :** Le cursus pédagogique suit l'ordre chronologique : Épreuve de Code ➔ Épreuve de Créneau ➔ Épreuve de Circulation.
- **RG11 (Nombre de Passages) :** Maximum 5 passages autorisés par épreuve.
- **RG12 (Historique Pédagogique) :** Conservation intégrale de tous les passages avec date, moniteur, résultat et observations.
- **RG13 (Liaison Caisse Automatique) :** Tout encaissement alimente immédiatement le journal de caisse en `ENTREE`. Les dépenses sont tracées en `SORTIE` avec motif.
- **RG14 (Audit Trail) :** Journalisation de toutes les actions d'authentification, modifications de statuts, mouvements financiers et accès administratifs.

---

## 📁 Architecture du Projet

```
achille/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/autoecole/
│   │   │   │   ├── controller/      # Contrôleurs REST (Auth, Candidats, Paiements, Examens, Caisse, Rapports, Audit)
│   │   │   │   ├── dto/             # Objets de transfert de données (Requêtes & Réponses typées)
│   │   │   │   ├── entity/          # Entités JPA / Hibernate & Enums métier
│   │   │   │   ├── exception/       # Gestionnaire global d'exceptions (GlobalExceptionHandler)
│   │   │   │   ├── repository/      # Interfaces Spring Data JPA & requêtes personnalisées
│   │   │   │   ├── security/        # Filtre JWT, UserDetailsService, WebSecurityConfig
│   │   │   │   └── service/         # Logique métier, exports PDF/Excel, initialisation des données
│   │   │   └── resources/
│   │   │       └── application.yml  # Configuration Spring Boot & PostgreSQL
│   │   └── test/java/com/autoecole/ # Tests unitaires des règles de gestion (BusinessRulesTest)
│   └── pom.xml                      # Configuration Maven & dépendances
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                # Guards de routes, Intercepteur JWT, Modèles TypeScript, Services API & Auth
│   │   │   └── pages/               # Composants des écrans (Dashboard, Candidats, Paiements, Examens, Caisse, Rapports, Utilisateurs, Paramétrage, Audit, Login)
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css               # Design System complet (Palette, Gradients, Badges, Modales, Tables)
│   ├── angular.json
│   └── package.json
│
├── docker-compose.yml               # Service PostgreSQL 16 pour démarrage rapide
├── run-backend.sh                   # Script de lancement Backend Ubuntu
├── run-frontend.sh                  # Script de lancement Frontend Ubuntu
└── README.md                        # Documentation officielle du projet
```

---

## 🛠️ Dépannage & Commandes Utiles

### 1. Erreur de connexion PostgreSQL : `password authentication failed for user "postgres"`
Vérifiez que le mot de passe défini dans `application.yml` correspond bien à celui de l'utilisateur `postgres` :
```bash
sudo -u postgres psql
```
Puis exécutez :
```sql
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

### 2. Erreur `FATAL: Peer authentication failed` (installation native)
Sous Ubuntu, PostgreSQL utilise par défaut l'authentification `peer` pour les connexions locales. Éditez `/etc/postgresql/16/main/pg_hba.conf`, remplacez la méthode `peer`/`ident` par `md5` pour les lignes `local` et `host` concernant `postgres`, puis redémarrez :
```bash
sudo systemctl restart postgresql
```

### 3. Exécuter les tests unitaires du Backend
```bash
cd backend
mvn test
```

### 4. Compiler le Backend en fichier JAR de Production
```bash
cd backend
mvn clean package -DskipTests
# Le fichier JAR est produit dans : target/auto-ecole-backend-1.0.0.jar
# Exécution :
java -jar target/auto-ecole-backend-1.0.0.jar
```

### 5. Compiler le Frontend pour la Production
```bash
cd frontend
npm run build
# Les fichiers statiques optimisés sont générés dans : dist/auto-ecole-frontend/browser
```

### 6. Arrêter le Backend / Frontend
Si vous avez lancé les serveurs directement dans un terminal (`mvn spring-boot:run`, `./run-backend.sh`, `npm start`, `./run-frontend.sh`), il suffit d'appuyer sur `Ctrl + C` dans ce terminal pour les arrêter proprement.

Si le processus tourne en arrière-plan ou dans un terminal déjà fermé, libérez le port concerné :
```bash
# Backend (port 8080)
sudo fuser -k 8080/tcp

# Frontend (port 4200)
sudo fuser -k 4200/tcp
```

---

✨ **Projet Auto-École — Conforme au Cahier des Charges Final (Spring Boot 3 + Angular 18 + PostgreSQL).**
