# CAHIER DES CHARGES FINAL
## Application web de gestion d'une auto-école

**Version : 1.0 — Septembre 2026**

---

## 1. Présentation du projet

### 1.1 Contexte

L'auto-école assure la gestion administrative et pédagogique des candidats au permis de conduire. Les documents sources font apparaître plusieurs supports de gestion : fiche d'enregistrement des élèves, registre d'inscription, cahier de suivi des versements et registre des transactions financières.

L'objectif du projet est de remplacer ces supports papier par une application web centralisée, sécurisée et accessible selon les responsabilités de chaque utilisateur.

### 1.2 Solution proposée

L'application permettra de gérer le parcours administratif, financier et pédagogique d'un candidat, depuis son inscription jusqu'au suivi de ses paiements et de ses examens.

L'application sera développée avec :

- **Backend : Java / Spring Boot**
- **Frontend : Angular**
- **Base de données : MySQL**
- **API : REST**
- **Accès aux données : Spring Data JPA / Hibernate**
- **Sécurité : Spring Security**
- **Documentation API : OpenAPI / Swagger**

> La technologie Laravel/Blade mentionnée dans les documents sources est remplacée dans cette version finale par Spring Boot + Angular, conformément au choix technique retenu pour le projet.

---

# 2. Objectifs du projet

## 2.1 Objectif général

Mettre en place une application web permettant de centraliser, sécuriser et automatiser la gestion des candidats, des inscriptions, des paiements, des examens et de la caisse de l'auto-école.

## 2.2 Objectifs spécifiques

L'application devra permettre de :

- centraliser les dossiers des candidats ;
- générer automatiquement un identifiant unique de dossier ;
- gérer les inscriptions et les forfaits ;
- automatiser le calcul des paiements et des soldes ;
- gérer les reçus ;
- suivre les examens de Code, Créneau et Circulation ;
- gérer les entrées et sorties de caisse ;
- fournir un tableau de bord ;
- produire des rapports ;
- gérer les comptes utilisateurs et leurs rôles ;
- assurer la traçabilité des opérations sensibles ;
- sécuriser l'accès aux données.

---

# 3. Acteurs du système

Le système comporte quatre profils principaux.

| Acteur | Responsabilités |
|---|---|
| **Administrateur** | Supervision générale, utilisateurs, droits, paramétrage et consultation globale |
| **Secrétaire** | Gestion administrative des candidats, dossiers et inscriptions |
| **Caissière** | Encaissements, reçus et gestion de la caisse |
| **Moniteur** | Suivi pédagogique, leçons et examens |

---

# 4. Authentification et sécurité

L'accès à l'application est réservé au personnel autorisé.

## Fonctionnalités

- connexion par identifiant et mot de passe ;
- déconnexion ;
- gestion des sessions ;
- mots de passe stockés de manière sécurisée ;
- contrôle d'accès selon le rôle ;
- désactivation d'un compte ;
- protection des API ;
- traçabilité des opérations sensibles.

## Rôles

- ADMIN
- SECRETAIRE
- CAISSIERE
- MONITEUR

L'Administrateur est le seul profil autorisé à gérer les comptes utilisateurs et leurs droits.

---

# 5. Module de gestion des candidats

## 5.1 Création d'un candidat

La fiche candidat doit permettre d'enregistrer :

- nom ;
- prénom(s) ;
- date de naissance ;
- lieu de naissance ;
- téléphone ;
- autres contacts utiles ;
- date d'inscription ;
- catégorie(s) de permis demandée(s).

Les catégories initialement prévues sont :

- A1 ;
- B ;
- C.

La conception devra permettre l'ajout ultérieur d'autres catégories.

## 5.2 Identifiant

Chaque candidat possède un numéro de dossier/identifiant unique généré automatiquement par le système.

## 5.3 Gestion du dossier administratif

Le système doit enregistrer :

- date de réception du dossier ;
- date de dépôt du dossier ;
- statut du dossier.

## 5.4 Opérations

Selon les droits :

- créer ;
- consulter ;
- modifier ;
- supprimer avec confirmation ;
- rechercher ;
- filtrer.

## 5.5 Recherche

La recherche pourra être effectuée notamment par :

- nom ;
- statut du dossier ;
- statut du paiement ;
- catégorie de permis ;
- numéro de dossier.

---

# 6. Module des inscriptions et forfaits

## 6.1 Forfaits

Deux forfaits sont prévus initialement :

| Forfait | Montant |
|---|---:|
| Forfait 1 | 100 000 FCFA |
| Forfait 2 | 125 000 FCFA |

Les montants doivent être configurables par l'Administrateur.

## 6.2 Association

Lors de l'inscription, le candidat est associé à un forfait.

## 6.3 Durée de validité

La durée de validité d'une inscription est de **8 mois à compter de la date d'inscription**.

À l'échéance :

- le dossier passe automatiquement à un statut expiré ;
- si le candidat n'est pas soldé, il devient **« Expiré non soldé »** ;
- les données déjà enregistrées restent consultables.

## 6.4 Alertes

L'application doit signaler l'approche de la date d'expiration sur :

- le tableau de bord ;
- la fiche du candidat.

---

# 7. Module des paiements et versements

## 7.1 Premier versement

Un premier versement obligatoire est demandé lors de l'inscription.

Montant autorisé :

- minimum : **35 000 FCFA** ;
- maximum : **50 000 FCFA**.

Tout premier versement inférieur à 35 000 FCFA ou supérieur à 50 000 FCFA doit être refusé par l'application.

## 7.2 Versements suivants

Après le premier versement :

- le nombre de versements est libre ;
- le montant de chaque versement est libre ;
- aucun échéancier obligatoire n'est imposé.

## 7.3 Calcul du solde

Le système calcule automatiquement :

**Solde = Montant du forfait − Total des versements**

Le solde doit être actualisé immédiatement après chaque opération.

## 7.4 Statut « Soldé »

Lorsque le solde atteint zéro, le dossier passe automatiquement au statut :

**SOLDÉ**

## 7.5 Reçus

Chaque versement génère automatiquement un numéro de reçu unique et séquentiel.

Le système doit permettre :

- l'édition du reçu ;
- la réimpression du reçu ;
- la consultation de l'historique des reçus.

## 7.6 Modification et annulation

Un versement peut être modifié ou annulé selon les droits autorisés.

Toute modification ou annulation doit conserver une trace indiquant notamment :

- l'utilisateur ;
- la date et l'heure ;
- l'opération réalisée ;
- le motif.

Le solde doit être recalculé immédiatement.

---

# 8. Module de suivi des examens

Trois types d'épreuves sont suivis indépendamment :

1. **Code**
2. **Créneau**
3. **Circulation**

Pour chaque type d'épreuve, le système doit permettre jusqu'à **5 passages**.

Chaque passage contient :

- date du passage ;
- observation/résultat.

Exemples :

- Réussi ;
- Échec ;
- Ajourné.

## Vue synthétique

La fiche candidat doit présenter clairement l'état d'avancement des trois types d'épreuves.

Le tableau de bord doit également présenter les prochains examens programmés.

---

# 9. Module de gestion de la caisse

Ce module est distinct du suivi individuel des paiements des candidats.

Il permet de gérer l'ensemble des mouvements financiers de l'auto-école.

## 9.1 Entrées

Exemples :

- recettes diverses ;
- encaissements ;
- autres entrées autorisées.

## 9.2 Sorties

Exemples :

- charges ;
- dépenses de fonctionnement ;
- autres sorties.

## 9.3 Informations d'une transaction

Chaque mouvement doit comporter au minimum :

- date ;
- type : entrée/sortie ;
- montant ;
- libellé ;
- utilisateur ayant enregistré l'opération.

## 9.4 Solde de caisse

Le système calcule automatiquement :

**Solde caisse = Total des entrées − Total des sorties**

## 9.5 Historique

L'utilisateur autorisé doit pouvoir :

- consulter l'historique ;
- filtrer par période ;
- distinguer les entrées des sorties ;
- consulter les détails d'une transaction.

---

# 10. Tableau de bord

Après authentification, chaque utilisateur accède à un tableau de bord adapté à ses droits.

Les indicateurs généraux comprennent :

- nombre total de candidats ;
- répartition des candidats par statut ;
- montant total encaissé ;
- montant global restant dû ;
- prochains examens ;
- dernières transactions financières ;
- alertes relatives aux inscriptions proches de l'expiration.

Les informations visibles peuvent être limitées selon le rôle de l'utilisateur.

---

# 11. Rapports et exports

L'application doit remplacer les principales listes papier par des rapports numériques.

## Rapports

### Liste des candidats

Filtres :

- catégorie ;
- statut du dossier ;
- statut du paiement.

### Relevé de paiement d'un candidat

Le rapport doit afficher :

- candidat ;
- forfait ;
- montant du forfait ;
- liste des versements ;
- total versé ;
- solde.

### Relevé de caisse

Le rapport doit permettre de sélectionner une période et d'afficher :

- entrées ;
- sorties ;
- total ;
- solde de caisse.

## Formats

Les rapports doivent pouvoir être exportés en :

- **PDF**
- **Excel**

---

# 12. Gestion des utilisateurs

L'Administrateur peut :

- créer un compte ;
- modifier un compte ;
- désactiver un compte ;
- attribuer un rôle ;
- consulter les utilisateurs.

Chaque compte possède un rôle déterminant ses autorisations.

---

# 13. Matrice des droits

| Module | Administrateur | Secrétaire | Caissière | Moniteur |
|---|---|---|---|---|
| Candidats | Gestion | Gestion | Lecture | Lecture |
| Inscriptions / forfaits | Gestion | Gestion | Lecture | Aucun |
| Paiements / reçus | Gestion | Lecture | Gestion | Aucun |
| Examens | Gestion | Lecture | Aucun | Gestion |
| Caisse | Gestion | Aucun | Gestion | Aucun |
| Tableau de bord | Gestion | Lecture | Lecture | Lecture |
| Rapports | Gestion | Lecture | Lecture | Lecture |
| Utilisateurs / droits | Gestion | Aucun | Aucun | Aucun |

Cette matrice constitue la base des autorisations et pourra être ajustée après validation par le commanditaire.

---

# 14. Règles de gestion

## RG01 — Forfaits

Les forfaits initiaux sont de 100 000 FCFA et 125 000 FCFA.

## RG02 — Premier versement

Le premier versement est obligatoire et doit être compris entre 35 000 et 50 000 FCFA inclus.

## RG03 — Versements suivants

Les versements suivants sont libres en nombre et en montant.

## RG04 — Pas d'échéancier obligatoire

Aucun échéancier fixe de paiement n'est imposé au candidat.

## RG05 — Durée

Une inscription est valable 8 mois à partir de sa date d'inscription.

## RG06 — Expiration

À l'expiration, le dossier devient expiré. S'il reste un solde, son statut est « Expiré non soldé ».

## RG07 — Soldé

Un candidat est automatiquement marqué « Soldé » lorsque le total des versements atteint le montant du forfait.

## RG08 — Reçu

Chaque versement possède un numéro de reçu unique et séquentiel.

## RG09 — Solde

Le solde est toujours recalculé automatiquement à partir des versements enregistrés.

## RG10 — Traçabilité

Les opérations sensibles doivent être historisées.

---

# 15. Architecture technique

L'application sera organisée en deux applications principales.

```text
┌───────────────────────────────┐
│           ANGULAR             │
│          Frontend             │
│                               │
│  Pages / Components           │
│  Services                     │
│  Guards                       │
│  Interceptors                 │
└───────────────┬───────────────┘
                │
                │ HTTP / REST / JSON
                │
┌───────────────▼───────────────┐
│          SPRING BOOT          │
│           Backend             │
│                               │
│ Controllers                  │
│ Services                     │
│ Repositories                 │
│ Entities / DTO               │
│ Validation                   │
│ Spring Security              │
└───────────────┬───────────────┘
                │
                │ JPA / Hibernate
                │
┌───────────────▼───────────────┐
│             MYSQL             │
│          Base de données       │
└───────────────────────────────┘
```

---

# 16. Architecture Backend Spring Boot

Le backend devra être organisé selon une architecture claire.

Structure indicative :

```text
backend/
└── src/main/java/
    └── .../
        ├── controller/
        ├── service/
        ├── repository/
        ├── entity/
        ├── dto/
        ├── mapper/
        ├── security/
        ├── exception/
        ├── validation/
        └── config/
```

## Responsabilités

### Controller

Expose les API REST.

### Service

Contient la logique métier.

### Repository

Gère l'accès à MySQL avec Spring Data JPA.

### Entity

Représente les données persistées.

### DTO

Sépare les données exposées par l'API des entités internes.

### Security

Gère l'authentification et les autorisations.

---

# 17. Architecture Frontend Angular

Le frontend devra être organisé par fonctionnalités.

Structure indicative :

```text
frontend/
└── src/app/
    ├── core/
    │   ├── guards/
    │   ├── interceptors/
    │   └── services/
    │
    ├── shared/
    │   ├── components/
    │   ├── models/
    │   └── pipes/
    │
    ├── auth/
    ├── dashboard/
    ├── candidats/
    ├── inscriptions/
    ├── paiements/
    ├── examens/
    ├── caisse/
    ├── rapports/
    └── utilisateurs/
```

L'interface devra être :

- en français ;
- claire ;
- professionnelle ;
- responsive ;
- adaptée aux ordinateurs ;
- utilisable si possible sur tablette et smartphone.

---

# 18. Base de données MySQL

La base de données devra être relationnelle et assurer l'intégrité des données.

Les principales entités à prévoir sont :

```text
Utilisateur
Role
Candidat
CategoriePermis
Forfait
Inscription
Paiement
Recu
Examen
PassageExamen
TransactionCaisse
HistoriqueAction
```

Les relations exactes devront être définies lors de la conception UML et du modèle relationnel.

---

# 19. API REST

Les fonctionnalités seront exposées par des API REST.

Exemples :

```text
POST   /api/auth/login

GET    /api/candidats
POST   /api/candidats
GET    /api/candidats/{id}
PUT    /api/candidats/{id}
DELETE /api/candidats/{id}

GET    /api/inscriptions
POST   /api/inscriptions
GET    /api/inscriptions/{id}

GET    /api/paiements
POST   /api/paiements
PUT    /api/paiements/{id}
DELETE /api/paiements/{id}

GET    /api/examens
POST   /api/examens
PUT    /api/examens/{id}

GET    /api/caisse/transactions
POST   /api/caisse/transactions

GET    /api/dashboard

GET    /api/rapports/candidats
GET    /api/rapports/paiements
GET    /api/rapports/caisse

GET    /api/utilisateurs
POST   /api/utilisateurs
PUT    /api/utilisateurs/{id}
```

Les endpoints définitifs seront établis lors de la conception technique.

---

# 20. Sécurité

Le système devra respecter au minimum les exigences suivantes :

- authentification obligatoire ;
- autorisation par rôle ;
- mots de passe hachés ;
- validation des données reçues ;
- protection des endpoints ;
- gestion des erreurs ;
- limitation de l'accès aux données selon les permissions ;
- journalisation des opérations sensibles ;
- sauvegardes régulières de la base.

---

# 21. Traçabilité

Les opérations sensibles devront être enregistrées.

Exemples :

- création d'un candidat ;
- modification d'un candidat ;
- suppression d'un candidat ;
- création d'un paiement ;
- modification d'un paiement ;
- annulation d'un paiement ;
- création d'une transaction de caisse ;
- modification d'une transaction ;
- création ou désactivation d'un utilisateur.

L'historique doit permettre d'identifier :

- qui a effectué l'action ;
- quelle action a été effectuée ;
- quand elle a été effectuée ;
- éventuellement la raison de l'opération.

---

# 22. Exigences non fonctionnelles

## Sécurité

L'application doit protéger les données et empêcher les accès non autorisés.

## Fiabilité

Les calculs financiers doivent être réalisés automatiquement afin de limiter les erreurs humaines.

## Ergonomie

L'interface doit être simple et compréhensible par un personnel non technique.

## Performance

Les recherches, consultations et opérations courantes doivent être suffisamment rapides pour une utilisation quotidienne.

## Disponibilité

Plusieurs utilisateurs doivent pouvoir utiliser l'application simultanément.

## Maintenabilité

Le code doit être structuré et respecter une architecture permettant l'évolution du système.

## Sauvegarde

La base de données doit faire l'objet de sauvegardes régulières.

---

# 23. Interfaces principales à prévoir

## Authentification

- écran de connexion ;
- identifiant ;
- mot de passe ;
- bouton de connexion.

## Dashboard

- indicateurs ;
- alertes ;
- prochains examens ;
- dernières transactions.

## Gestion des candidats

- liste ;
- recherche ;
- filtres ;
- création ;
- modification ;
- détail du candidat.

## Fiche candidat

La fiche doit regrouper les informations :

```text
Informations personnelles
        ↓
Inscription / Forfait
        ↓
Situation financière
        ↓
Historique des versements
        ↓
Examens
        ↓
Historique / dossier
```

## Paiements

- liste des paiements ;
- nouveau versement ;
- reçu ;
- historique.

## Examens

- Code ;
- Créneau ;
- Circulation ;
- passages ;
- résultats.

## Caisse

- solde ;
- entrées ;
- sorties ;
- historique ;
- filtres.

## Rapports

- liste candidats ;
- relevé paiement ;
- relevé caisse ;
- export PDF ;
- export Excel.

## Administration

- utilisateurs ;
- rôles ;
- forfaits ;
- catégories de permis.

---

# 24. Validation des données

L'application devra contrôler les données avant leur enregistrement.

Exemples :

- champs obligatoires ;
- format des dates ;
- montants positifs ;
- premier versement compris entre 35 000 et 50 000 FCFA ;
- impossibilité d'enregistrer un paiement incohérent ;
- impossibilité de créer des doublons pour les identifiants uniques ;
- contrôle des droits avant chaque opération sensible.

---

# 25. Gestion des statuts

Les statuts devront être clairement définis.

Exemples :

### Statut du dossier

- EN_COURS
- EXPIRE
- EXPIRE_NON_SOLDE
- SOLDE

### Résultat d'examen

- PROGRAMME
- REUSSI
- ECHEC
- AJOURNE

Les valeurs définitives pourront être ajustées lors de la conception.

---

# 26. Livrables

Le projet devra fournir :

1. application Angular fonctionnelle ;
2. API Spring Boot fonctionnelle ;
3. base de données MySQL ;
4. système d'authentification ;
5. gestion des rôles ;
6. gestion des candidats ;
7. gestion des inscriptions ;
8. gestion des forfaits ;
9. gestion des paiements ;
10. gestion des reçus ;
11. suivi des examens ;
12. gestion de la caisse ;
13. tableau de bord ;
14. rapports PDF et Excel ;
15. système de traçabilité ;
16. documentation technique ;
17. documentation utilisateur ;
18. données de démonstration.

---

# 27. Tests

Des tests devront être réalisés sur les principaux scénarios.

## Tests fonctionnels

- connexion ;
- création candidat ;
- modification candidat ;
- inscription ;
- premier versement valide ;
- premier versement invalide ;
- versement suivant ;
- calcul du solde ;
- passage automatique au statut soldé ;
- expiration après 8 mois ;
- enregistrement d'un examen ;
- gestion d'une transaction caisse ;
- génération d'un rapport ;
- gestion des utilisateurs.

## Tests de sécurité

- accès sans authentification ;
- accès à un module interdit ;
- vérification des rôles ;
- protection des API.

## Tests de cohérence financière

Les calculs des paiements et de la caisse devront être vérifiés avec plusieurs scénarios.

---

# 28. Planning indicatif

| Phase | Contenu |
|---|---|
| **1. Analyse** | Validation du cahier des charges et des règles métier |
| **2. Conception** | UML, architecture, base MySQL, API et maquettes |
| **3. Backend** | Développement Spring Boot |
| **4. Frontend** | Développement Angular |
| **5. Intégration** | Connexion Angular ↔ Spring Boot ↔ MySQL |
| **6. Tests** | Tests fonctionnels, sécurité et cohérence |
| **7. Déploiement** | Installation et configuration |
| **8. Formation** | Formation des utilisateurs |

---

# 29. Périmètre initial

Le périmètre de la première version comprend :

- authentification ;
- gestion des quatre rôles ;
- gestion des candidats ;
- inscriptions ;
- forfaits ;
- paiements ;
- reçus ;
- examens ;
- caisse ;
- dashboard ;
- rapports ;
- exports PDF/Excel ;
- traçabilité.

Les fonctionnalités non explicitement décrites dans les documents sources ne doivent pas être ajoutées au périmètre sans validation du commanditaire.

---

# 30. Principes de développement

Le développement devra respecter les principes suivants :

- séparation claire Angular / Spring Boot ;
- API REST documentée ;
- logique métier dans les services Spring Boot ;
- accès aux données via repositories ;
- validation côté frontend et backend ;
- contrôle des autorisations côté backend ;
- utilisation de DTO pour les échanges API ;
- gestion centralisée des erreurs ;
- code modulaire et maintenable ;
- commentaires uniquement lorsqu'ils apportent une réelle valeur ;
- respect des conventions Java, Spring Boot et Angular.

---

# 31. Conclusion

Le projet consiste à développer une application web professionnelle de gestion d'une auto-école permettant de centraliser les dossiers des candidats, les inscriptions, les paiements, les examens, la caisse et les rapports.

La solution cible repose sur :

**Java + Spring Boot + Angular + MySQL**

avec une architecture séparant clairement le frontend, le backend et la base de données.

Le système doit principalement répondre à trois objectifs :

1. **Fiabiliser la gestion administrative et financière ;**
2. **Faciliter le suivi des candidats et de leurs examens ;**
3. **Sécuriser les données et séparer les responsabilités des utilisateurs.**

Ce cahier des charges constitue la base de référence pour les phases suivantes : conception UML, conception de la base de données, conception des API, maquettage Angular puis développement.

---

## ANNEXE — Synthèse des règles financières

| Élément | Règle |
|---|---|
| Forfait 1 | 100 000 FCFA |
| Forfait 2 | 125 000 FCFA |
| Premier versement | Obligatoire |
| Minimum premier versement | 35 000 FCFA |
| Maximum premier versement | 50 000 FCFA |
| Versements suivants | Libres |
| Échéancier obligatoire | Non |
| Durée de l'inscription | 8 mois |
| Statut à solde nul | Soldé |
| Statut à expiration avec solde | Expiré non soldé |
| Reçu | Numéro unique et séquentiel |
| Calcul du solde | Automatique |
