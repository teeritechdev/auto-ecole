CAHIER DES CHARGES FINAL
Application web de gestion d'une auto-école
Version : 2.0 — Septembre 2026

1. PRÉSENTATION DU PROJET
1.1 Contexte
L'auto-école assure la gestion administrative, financière et pédagogique des candidats préparant différents permis de conduire.
La gestion actuelle repose notamment sur des fiches d'inscription, registres de candidats, supports de suivi des paiements, reçus, informations relatives aux examens et documents de caisse.
L'objectif du projet est de remplacer ces supports par une application web centralisée, sécurisée et adaptée au fonctionnement réel de l'auto-école.
L'application devra permettre de suivre le candidat depuis son inscription jusqu'à la fin de son parcours, tout en distinguant clairement :
·	les informations administratives ;
·	la situation financière ;
·	la progression de la formation ;
·	les examens ;
·	les opérations de caisse ;
·	l'historique des actions.
1.2 Solution proposée
·	Backend : Java / Spring Boot
·	Frontend : Angular
·	Base de données : PostgreSQL
·	API : REST
·	Accès aux données : Spring Data JPA / Hibernate
·	Sécurité : Spring Security
·	Documentation API : OpenAPI / Swagger

2. OBJECTIFS DU PROJET
2.1 Objectif général
Mettre en place une application web permettant de centraliser, sécuriser et automatiser la gestion administrative, financière et pédagogique des candidats d'une auto-école.
2.2 Objectifs spécifiques
L'application devra permettre de :
·	centraliser les dossiers des candidats ;
·	générer automatiquement un identifiant unique ;
·	gérer les catégories de permis ;
·	gérer les inscriptions ;
·	gérer les forfaits ;
·	suivre les heures et la progression de formation ;
·	gérer les paiements ;
·	calculer automatiquement les soldes ;
·	générer les reçus ;
·	suivre les examens ;
·	gérer les expirations ;
·	gérer les reprises après expiration ;
·	gérer la caisse ;
·	fournir un tableau de bord ;
·	produire des rapports ;
·	gérer les utilisateurs et leurs droits ;
·	assurer la traçabilité des opérations sensibles.
3. CATÉGORIES DE PERMIS
L'auto-école assure actuellement la formation pour :
·	A1
·	A
·	B1
·	B
·	C
La conception devra permettre à l'Administrateur d'ajouter ultérieurement d'autres catégories.
4. ACTEURS DU SYSTÈME
Acteur	Responsabilités
Administrateur	Supervision générale, utilisateurs, droits, paramétrage et consultation globale
Secrétaire	Gestion administrative des candidats, dossiers et inscriptions
Caissière	Encaissements, reçus et gestion de la caisse
Moniteur	Suivi pédagogique, formation pratique et examens

5. AUTHENTIFICATION ET SÉCURITÉ
L'accès à l'application est réservé au personnel autorisé.
Fonctionnalités :
·	connexion par identifiant et mot de passe ;
·	déconnexion ;
·	gestion des sessions ;
·	mots de passe hachés ;
·	contrôle d'accès selon le rôle ;
·	désactivation d'un compte ;
·	protection des API ;
·	traçabilité des opérations sensibles.
Rôles :
·	ADMIN
·	SECRETAIRE
·	CAISSIERE
·	MONITEUR
Seul l'Administrateur peut gérer les comptes utilisateurs et leurs droits.
6. MODULE DE GESTION DES CANDIDATS
6.1 Création d'un candidat
La fiche candidat devra permettre d'enregistrer :
·	nom ;
·	prénom(s) ;
·	date de naissance ;
·	lieu de naissance ;
·	téléphone ;
·	autres contacts utiles ;
·	date d'inscription ;
·	catégorie de permis demandée ;
·	informations administratives du dossier.
6.2 Identifiant
Chaque candidat possède un numéro de dossier unique généré automatiquement.
6.3 Dossier administratif
Le système devra enregistrer :
·	date de réception du dossier ;
·	date de dépôt ;
·	statut du dossier ;
·	date d'inscription ;
·	date d'expiration calculée automatiquement.
6.4 Recherche
La recherche pourra être effectuée par :
·	nom ;
·	numéro de dossier ;
·	catégorie ;
·	statut du dossier ;
·	statut financier ;
·	statut de formation.
7. MODULE DES INSCRIPTIONS
7.1 Création d'une inscription
Lors de l'inscription, le candidat est associé :
·	à une catégorie de permis ;
·	à un forfait ;
·	à une date d'inscription ;
·	à une date d'expiration calculée automatiquement.
7.2 Date de début
La date d'inscription constitue le point de départ de la période de validité.
7.3 Durée de validité
La validité d'une inscription est de 8 mois à compter de la date d'inscription.
Cette durée correspond à la période accordée au candidat pour terminer son parcours de formation. Elle ne constitue pas nécessairement la durée normale de formation.
8. MODULE DE FORMATION
8.1 Organisation
La formation comprend :
·	formation théorique ;
·	formation pratique.
Le programme comprend :
·	55 heures de formation théorique ;
·	36 heures de formation pratique.
Soit un total indicatif de 91 heures.
8.2 Durée normale
La durée normale visée pour terminer la formation est d'environ 3 à 4 mois, selon la régularité du candidat et l'organisation des séances.
Les 8 mois constituent la durée maximale de validité de l'inscription et non la durée normale de formation.
8.3 Continuité
L'auto-école fonctionne de manière continue pendant les jours ouvrés, en dehors des périodes consacrées aux examens ou autres contraintes d'organisation.
8.4 Régularité
Le candidat est responsable de sa régularité et doit suivre le rythme proposé.
Lorsqu'une difficulté particulière empêche ou ralentit la formation, le candidat peut la signaler à l'auto-école. Celle-ci pourra examiner la situation et décider des mesures appropriées.
8.5 Indépendance entre formation et paiement
L'absence d'un paiement mensuel ne doit pas entraîner automatiquement la suspension de la formation.
Il n'existe aucun échéancier mensuel obligatoire.
La situation financière et la progression pédagogique doivent être suivies séparément.
9. MODULE DES FORFAITS
Forfait	Montant
Forfait 1	100 000 FCFA
Forfait 2	125 000 FCFA

Les montants doivent être configurables par l'Administrateur.
10. MODULE DES PAIEMENTS ET VERSEMENTS
10.1 Premier versement
Un premier versement est obligatoire lors de l'inscription :
·	minimum : 35 000 FCFA ;
·	maximum : 50 000 FCFA.
Tout montant inférieur à 35 000 FCFA ou supérieur à 50 000 FCFA doit être refusé.
10.2 Versements suivants
Après le premier versement :
·	nombre de versements libre ;
·	montant libre ;
·	aucun échéancier mensuel obligatoire ;
·	aucune limite maximale du nombre de versements.
Un candidat peut donc payer en une, deux, quatre, cinq ou davantage de fois.
10.3 Calcul du solde
Solde = Montant du forfait − Total des versements
Le solde doit être actualisé immédiatement après chaque opération.
10.4 Statut soldé
Lorsque le solde atteint zéro, le dossier passe automatiquement au statut SOLDÉ.
10.5 Reçus
Chaque versement génère automatiquement un numéro de reçu unique et séquentiel.
Le système permet :
·	édition ;
·	réimpression ;
·	consultation de l'historique.
10.6 Modification et annulation
Toute modification ou annulation est contrôlée par les droits de l'utilisateur et conserve :
·	utilisateur ;
·	date et heure ;
·	opération ;
·	motif.
11. EXPIRATION DE L'INSCRIPTION
11.1 Déclenchement
Date d'expiration = Date d'inscription + 8 mois
11.2 Alertes
L'application signale l'approche de l'expiration :
·	sur le tableau de bord ;
·	sur la fiche candidat.
11.3 À l'expiration
Lorsque les 8 mois sont atteints :
·	l'inscription devient expirée ;
·	le parcours en cours n'est plus considéré comme valide ;
·	l'historique du candidat reste conservé ;
·	les anciens paiements restent consultables ;
·	les anciens examens restent historisés ;
·	une nouvelle procédure doit être engagée pour reprendre le parcours.
12. REPRISE APRÈS EXPIRATION
12.1 Principe
Lorsqu'un candidat n'a pas terminé son parcours dans les huit mois et qu'aucune situation particulière n'a été signalée et validée, son inscription expire.
Pour reprendre sa formation, le candidat doit effectuer une nouvelle inscription selon les conditions applicables.
12.2 Nouveau paiement
Selon la règle normale communiquée par l'auto-école, la reprise après expiration implique le paiement du forfait correspondant :
·	100 000 FCFA, ou
·	125 000 FCFA.
12.3 Reprise du parcours
La nouvelle inscription constitue un nouveau cycle de formation.
Les résultats et étapes de l'ancienne période restent visibles dans l'historique, mais le nouveau cycle doit être suivi séparément.
12.4 Pénalité de reprise
Une pénalité de 25 000 FCFA peut être appliquée dans certaines situations de reprise après expiration.
Cette pénalité devra être paramétrable et son mode exact d'application devra être validé par le commanditaire avant l'implémentation définitive.
Le système devra notamment permettre de définir :
·	si la pénalité est obligatoire ou exceptionnelle ;
·	son montant ;
·	les situations dans lesquelles elle s'applique ;
·	si elle constitue des frais de reprise ou un élément du nouveau forfait.
13. MODULE DE SUIVI DES EXAMENS
Les trois types d'épreuves sont :
1.	Code
2.	Créneau
3.	Circulation
Pour chaque type, le système permet actuellement d'enregistrer jusqu'à 5 passages.
Chaque passage contient :
·	date ;
·	résultat ;
·	observation.
Résultats possibles notamment :
·	PROGRAMMÉ ;
·	RÉUSSI ;
·	ÉCHEC ;
·	AJOURNÉ.
Tous les passages restent consultables dans l'historique.
14. SUIVI DE LA PROGRESSION
La fiche candidat distingue :
·	Administratif : dossier, inscription, catégorie, validité ;
·	Financier : forfait, total payé, solde, statut ;
·	Pédagogique : théorie, pratique, progression ;
·	Examens : Code, Créneau, Circulation.
15. MODULE DE GESTION DE LA CAISSE
15.1 Entrées
·	encaissements ;
·	recettes diverses ;
·	autres entrées autorisées.
15.2 Sorties
·	charges ;
·	dépenses de fonctionnement ;
·	autres sorties autorisées.
15.3 Transaction
Chaque transaction contient :
·	date ;
·	type ;
·	montant ;
·	libellé ;
·	utilisateur.
15.4 Solde
Solde caisse = Total des entrées − Total des sorties
15.5 Historique
Consultation, filtrage par période et distinction entrées/sorties.
16. TABLEAU DE BORD
Indicateurs :
·	nombre total de candidats ;
·	candidats par catégorie ;
·	candidats par statut ;
·	inscriptions proches de l'expiration ;
·	inscriptions expirées ;
·	montant total encaissé ;
·	montant restant dû ;
·	candidats soldés ;
·	prochains examens ;
·	dernières transactions ;
·	candidats en cours de formation.
Les informations sensibles sont limitées selon le rôle.
17. RAPPORTS ET EXPORTS
Rapports prévus :
·	liste des candidats ;
·	relevé de paiement ;
·	relevé de caisse ;
·	suivi des examens.
Formats :
·	PDF ;
·	Excel.
18. GESTION DES UTILISATEURS
Seul l'Administrateur peut :
·	créer un utilisateur ;
·	modifier un utilisateur ;
·	désactiver un compte ;
·	attribuer un rôle ;
·	consulter les utilisateurs ;
·	gérer les paramètres autorisés.
19. MATRICE DES DROITS
La matrice des droits définit les actions autorisées pour chaque utilisateur selon son rôle dans le système.
Module	Administrateur	Secrétaire	Caissière	Moniteur
Candidats	Gestion complète	Gestion complète	Consultation	Consultation
Inscriptions	Gestion complète	Gestion complète	Consultation	Aucun accès
Catégories de permis	Gestion complète	Consultation	Consultation	Consultation
Forfaits	Gestion complète	Consultation	Consultation	Aucun accès
Paiements	Gestion complète	Consultation	Gestion complète	Aucun accès
Reçus	Gestion complète	Consultation	Gestion complète	Aucun accès
Formation théorique et pratique	Gestion complète	Consultation	Aucun accès	Gestion complète
Progression des candidats	Gestion complète	Consultation	Aucun accès	Gestion complète
Examens	Gestion complète	Consultation	Aucun accès	Gestion complète
Caisse	Gestion complète	Aucun accès	Gestion complète	Aucun accès
Tableau de bord	Accès complet	Accès limité	Accès limité	Accès limité
Rapports	Accès complet	Rapports autorisés	Rapports financiers autorisés	Rapports pédagogiques autorisés
Utilisateurs	Gestion complète	Aucun accès	Aucun accès	Aucun accès
Rôles et permissions	Gestion complète	Aucun accès	Aucun accès	Aucun accès
Paramètres du système	Gestion complète	Aucun accès	Aucun accès	Aucun accès
Historique et traçabilité	Consultation complète	Actions autorisées	Actions autorisées	Actions autorisées

19.1 Définition des niveaux d'accès
Gestion complète
L'utilisateur peut, selon les règles de sécurité :
·	créer des informations ;
·	consulter les informations ;
·	modifier les informations ;
·	effectuer les actions autorisées liées au module.
Certaines suppressions ou annulations restent soumises à une autorisation particulière et doivent être enregistrées dans l'historique.
Consultation
L'utilisateur peut visualiser les informations autorisées, mais ne peut pas les modifier.
Aucun accès
Le module n'est pas accessible à l'utilisateur.
19.2 Règles particulières par rôle
Administrateur
L'Administrateur possède les droits les plus élevés dans le système. Il peut notamment :
·	gérer les utilisateurs ;
·	attribuer les rôles et permissions ;
·	gérer les catégories de permis et les forfaits ;
·	consulter et superviser l'ensemble des modules ;
·	consulter les rapports ;
·	gérer les paramètres autorisés ;
·	consulter l'historique et la traçabilité.
Secrétaire
La Secrétaire est principalement responsable de la gestion administrative des candidats. Elle peut notamment :
·	enregistrer un nouveau candidat ;
·	modifier les informations administratives autorisées ;
·	créer et gérer les inscriptions ;
·	consulter la situation financière ;
·	consulter la progression de la formation ;
·	consulter les informations relatives aux examens.
Elle ne peut pas gérer la caisse, modifier les paiements ou gérer les utilisateurs.
Caissière
La Caissière est responsable des opérations financières. Elle peut notamment :
·	enregistrer les paiements ;
·	consulter l'historique des paiements ;
·	générer et réimprimer les reçus ;
·	gérer les entrées et sorties de caisse ;
·	consulter les informations nécessaires à l'identification du candidat.
Elle ne peut pas gérer les informations pédagogiques, les examens ou les utilisateurs.
Moniteur
Le Moniteur est responsable du suivi pédagogique des candidats. Il peut notamment :
·	consulter les informations nécessaires sur les candidats ;
·	enregistrer ou mettre à jour la progression de la formation ;
·	suivre les heures théoriques et pratiques ;
·	gérer les informations liées aux examens et aux passages autorisés.
Il ne peut pas gérer les paiements, la caisse ou les utilisateurs.
19.3 Principe de sécurité
Les droits définis dans cette matrice constituent les droits fonctionnels généraux. Le contrôle réel des permissions doit être effectué côté backend Spring Boot afin qu'un utilisateur ne puisse pas contourner les restrictions en modifiant l'interface Angular.
Chaque action sensible doit être contrôlée selon le rôle de l'utilisateur et, lorsque nécessaire, enregistrée dans le module de traçabilité.
20. RÈGLES DE GESTION
·	RG01 — Catégories : A1, A, B1, B et C.
·	RG02 — Forfaits : 100 000 FCFA et 125 000 FCFA.
·	RG03 — Premier versement : obligatoire, entre 35 000 et 50 000 FCFA inclus.
·	RG04 — Versements suivants : libres en nombre et en montant.
·	RG05 — Aucun échéancier : aucun paiement mensuel obligatoire.
·	RG06 — Continuité : la formation n'est pas automatiquement suspendue pour cause de solde restant dû.
·	RG07 — Validité : inscription valable 8 mois à compter de la date d'inscription.
·	RG08 — Durée normale : environ 3 à 4 mois selon la régularité et l'organisation.
·	RG09 — Théorie : 55 heures.
·	RG10 — Pratique : 36 heures.
·	RG11 — Expiration : expiration automatique après 8 mois.
·	RG12 — Conservation : historique conservé après expiration.
·	RG13 — Reprise : nouvelle inscription après expiration.
·	RG14 — Nouveau forfait : 100 000 ou 125 000 FCFA selon le forfait.
·	RG15 — Pénalité : 25 000 FCFA selon les conditions validées.
·	RG16 — Examens : Code, Créneau, Circulation.
·	RG17 — Soldé : total des versements égal au forfait.
·	RG18 — Reçu : numéro unique et séquentiel.
·	RG19 — Solde : recalcul automatique.
·	RG20 — Traçabilité : opérations sensibles historisées.
21. STATUTS DU CANDIDAT
Le système pourra utiliser notamment :
·	EN_COURS ;
·	SOLDÉ ;
·	EXPIRE ;
·	EXPIRE_NON_SOLDE ;
·	REPRISE ;
·	TERMINE.
Les statuts définitifs seront validés lors de la conception.
22. ARCHITECTURE TECHNIQUE
ANGULAR (Frontend)
        |
        | HTTP / REST / JSON
        v
SPRING BOOT (Backend)
        |
        | JPA / Hibernate
        v
POSTGRESQL (Base de données)

22.1 Backend
Structure indicative :
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

22.2 Frontend
Structure indicative :
frontend/
└── src/app/
    ├── core/
    ├── shared/
    ├── auth/
    ├── dashboard/
    ├── candidats/
    ├── inscriptions/
    ├── formation/
    ├── paiements/
    ├── examens/
    ├── caisse/
    ├── rapports/
    └── utilisateurs/

23. BASE DE DONNÉES
Principales entités :
·	Utilisateur ;
·	Role ;
·	Candidat ;
·	CategoriePermis ;
·	Forfait ;
·	Inscription ;
·	Formation ;
·	ProgressionFormation ;
·	Paiement ;
·	Recu ;
·	Examen ;
·	PassageExamen ;
·	TransactionCaisse ;
·	HistoriqueAction.
La conception doit permettre de distinguer le candidat, ses inscriptions successives, ses anciens parcours, ses paiements, ses formations et ses examens.
24. API REST
Exemples :
POST   /api/auth/login

GET    /api/candidats
POST   /api/candidats
GET    /api/candidats/{id}
PUT    /api/candidats/{id}
DELETE /api/candidats/{id}

GET    /api/categories-permis
POST   /api/categories-permis

GET    /api/inscriptions
POST   /api/inscriptions
GET    /api/inscriptions/{id}

GET    /api/forfaits
POST   /api/forfaits
PUT    /api/forfaits/{id}

GET    /api/paiements
POST   /api/paiements
PUT    /api/paiements/{id}
DELETE /api/paiements/{id}

GET    /api/examens
POST   /api/examens
PUT    /api/examens/{id}

GET    /api/formations
POST   /api/formations
PUT    /api/formations/{id}

GET    /api/caisse/transactions
POST   /api/caisse/transactions

GET    /api/dashboard

GET    /api/rapports/candidats
GET    /api/rapports/paiements
GET    /api/rapports/examens
GET    /api/rapports/caisse

GET    /api/utilisateurs
POST   /api/utilisateurs
PUT    /api/utilisateurs/{id}

25. SÉCURITÉ
Le système devra assurer :
·	authentification obligatoire ;
·	autorisation par rôle ;
·	mots de passe hachés ;
·	validation des données ;
·	protection des endpoints ;
·	gestion centralisée des erreurs ;
·	limitation des accès ;
·	journalisation ;
·	sauvegardes régulières.
26. TRAÇABILITÉ
Les opérations sensibles devront être enregistrées :
·	création/modification/suppression d'un candidat ;
·	inscription ;
·	expiration ;
·	paiement ;
·	modification ou annulation d'un paiement ;
·	nouvelle inscription après expiration ;
·	application d'une pénalité ;
·	transaction de caisse ;
·	gestion des utilisateurs.
L'historique doit identifier l'utilisateur, l'action, la date et le motif lorsque nécessaire.
27. INTERFACES PRINCIPALES
27.1 Authentification
·	identifiant ;
·	mot de passe ;
·	connexion.
27.2 Dashboard
·	indicateurs ;
·	alertes ;
·	expirations ;
·	examens ;
·	transactions.
27.3 Candidats
·	liste ;
·	recherche ;
·	filtres ;
·	création ;
·	modification ;
·	détail.
27.4 Fiche candidat
La fiche regroupe :
Informations personnelles
        ↓
Catégorie de permis
        ↓
Inscription
        ↓
Validité / expiration
        ↓
Progression de formation
        ↓
Situation financière
        ↓
Historique des versements
        ↓
Examens
        ↓
Historique

27.5 Paiements
·	nouveau versement ;
·	historique ;
·	solde ;
·	reçu ;
·	réimpression.
27.6 Formation
·	théorie ;
·	pratique ;
·	progression ;
·	heures réalisées.
27.7 Examens
·	Code ;
·	Créneau ;
·	Circulation ;
·	passages ;
·	résultats.
27.8 Caisse
·	solde ;
·	entrées ;
·	sorties ;
·	historique ;
·	filtres.
27.9 Rapports
·	candidats ;
·	paiements ;
·	examens ;
·	caisse ;
·	PDF ;
·	Excel.
27.10 Administration
·	utilisateurs ;
·	rôles ;
·	forfaits ;
·	catégories ;
·	paramètres de reprise et pénalités.
28. VALIDATION DES DONNÉES
L'application devra contrôler :
·	champs obligatoires ;
·	dates valides ;
·	montants positifs ;
·	premier versement entre 35 000 et 50 000 FCFA ;
·	absence de paiement incohérent ;
·	identifiants uniques ;
·	catégorie valide ;
·	contrôle des droits.
29. CAS PARTICULIERS
Le système doit permettre d'enregistrer une difficulté signalée par le candidat avant expiration :
·	date du signalement ;
·	utilisateur ;
·	observation ;
·	décision ;
·	nouvelle date ou nouveau statut si validé.
Aucun utilisateur non autorisé ne doit pouvoir modifier arbitrairement la durée de validité.
30. RAPPORTS ET INDICATEURS
L'Administrateur peut consulter :
·	nombre de candidats ;
·	candidats par catégorie ;
·	candidats soldés ;
·	candidats non soldés ;
·	candidats proches de l'expiration ;
·	candidats expirés ;
·	candidats en reprise ;
·	total encaissé ;
·	total restant dû ;
·	résultats d'examen ;
·	mouvements de caisse.
31. EXIGENCES NON FONCTIONNELLES
·	Sécurité : protection des données et contrôle strict des accès.
·	Fiabilité : calculs financiers et dates d'expiration automatisés.
·	Ergonomie : interface utilisable par un personnel non technique.
·	Performance : opérations courantes suffisamment rapides.
·	Disponibilité : utilisation simultanée par plusieurs utilisateurs.
·	Maintenabilité : code clair et modulaire.
·	Sauvegarde : sauvegardes régulières de PostgreSQL.
32. TESTS
Tests fonctionnels
·	connexion ;
·	création/modification candidat ;
·	inscription ;
·	paiements valides et invalides ;
·	paiements multiples ;
·	calcul du solde ;
·	statut SOLDÉ ;
·	calcul des 8 mois ;
·	alertes ;
·	expiration ;
·	reprise ;
·	pénalité ;
·	formation ;
·	examens ;
·	caisse ;
·	rapports ;
·	utilisateurs.
Tests de sécurité
·	accès sans authentification ;
·	accès à un module interdit ;
·	contrôle des rôles ;
·	protection des API ;
·	modification sans permission.
Tests financiers
·	premier paiement ;
·	paiements multiples ;
·	solde ;
·	annulation ;
·	modification ;
·	soldé ;
·	expiré non soldé ;
·	nouvelle inscription ;
·	reprise.
33. LIVRABLES
1.	application Angular fonctionnelle ;
2.	API Spring Boot fonctionnelle ;
3.	base PostgreSQL ;
4.	authentification ;
5.	gestion des rôles ;
6.	gestion des candidats ;
7.	catégories A1, A, B1, B, C ;
8.	inscriptions ;
9.	forfaits ;
10.	paiements ;
11.	reçus ;
12.	suivi de formation ;
13.	examens ;
14.	expiration à 8 mois ;
15.	reprises après expiration ;
16.	caisse ;
17.	dashboard ;
18.	rapports PDF ;
19.	exports Excel ;
20.	traçabilité ;
21.	documentation technique ;
22.	documentation utilisateur ;
23.	données de démonstration.
34. PLANNING INDICATIF
Phase	Contenu
1. Analyse	Validation des besoins et règles métier
2. Conception	UML, base, architecture, API et maquettes
3. Backend	Développement Spring Boot
4. Frontend	Développement Angular
5. Intégration	Angular + Spring Boot + PostgreSQL
6. Tests	Fonctionnels, sécurité et financiers
7. Déploiement	Installation et configuration
8. Formation	Formation des utilisateurs

35. PÉRIMÈTRE INITIAL
La première version comprend :
·	authentification ;
·	quatre rôles ;
·	candidats ;
·	catégories A1, A, B1, B, C ;
·	inscriptions ;
·	forfaits ;
·	paiements ;
·	reçus ;
·	suivi de formation ;
·	examens ;
·	expiration à 8 mois ;
·	reprises après expiration ;
·	caisse ;
·	dashboard ;
·	rapports ;
·	exports PDF/Excel ;
·	traçabilité.
Les fonctionnalités non définies dans le présent cahier des charges ne doivent pas être ajoutées sans validation du commanditaire.
36. PRINCIPES DE DÉVELOPPEMENT
Le développement devra respecter :
·	séparation Angular / Spring Boot ;
·	API REST documentée ;
·	logique métier dans les services ;
·	accès aux données via repositories ;
·	validation frontend et backend ;
·	contrôle des autorisations côté backend ;
·	utilisation de DTO ;
·	gestion centralisée des erreurs ;
·	code modulaire ;
·	conventions Java, Spring Boot et Angular ;
·	absence de logique métier importante directement dans les composants Angular.
37. SYNTHÈSE DES RÈGLES MÉTIER
Élément	Règle
Catégories	A1, A, B1, B, C
Forfait 1	100 000 FCFA
Forfait 2	125 000 FCFA
Premier versement	Obligatoire
Minimum	35 000 FCFA
Maximum	50 000 FCFA
Versements suivants	Libres
Nombre de versements	Illimité
Paiement mensuel obligatoire	Non
Suspension automatique pour impayé	Non
Formation théorique	55 h
Formation pratique	36 h
Durée normale visée	Environ 3–4 mois
Validité inscription	8 mois
Point de départ	Date d'inscription
Expiration	Automatique
Historique après expiration	Conservé
Reprise après expiration	Nouvelle inscription
Nouveau forfait normal	100 000 ou 125 000 FCFA
Pénalité éventuelle	25 000 FCFA, selon règle validée
Épreuves	Code, Créneau, Circulation
Passages	Jusqu'à 5 par épreuve
Reçu	Numéro unique et séquentiel
Solde	Calcul automatique

38. CONCLUSION
Le projet consiste à développer une application web professionnelle permettant à l'auto-école de centraliser la gestion administrative, financière et pédagogique de ses candidats.
La solution repose sur :
Java + Spring Boot + Angular + PostgreSQL
Le système devra notamment :
1.	sécuriser les données ;
2.	séparer les responsabilités des utilisateurs ;
3.	gérer les candidats ;
4.	gérer les catégories A1, A, B1, B et C ;
5.	gérer les inscriptions ;
6.	permettre des paiements flexibles ;
7.	suivre indépendamment la situation financière et la progression pédagogique ;
8.	suivre la formation théorique et pratique ;
9.	gérer les examens ;
10.	appliquer automatiquement la validité de 8 mois ;
11.	gérer les expirations ;
12.	conserver l'historique ;
13.	gérer les reprises après expiration ;
14.	gérer la caisse ;
15.	produire des rapports ;
16.	assurer la traçabilité.
Ce cahier des charges constitue la référence pour les phases suivantes :
Analyse → Conception UML → Base de données → API → Maquettes → Backend → Frontend → Intégration → Tests → Déploiement.
il