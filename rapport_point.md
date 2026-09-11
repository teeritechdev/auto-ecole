# Rapport de point d'avancement — Projet Auto-École

Date : 2026-09-08
Branche : `appmod/java-upgrade-20260908150631`
Référence : Cahier des charges final (Spring Boot / Angular / PostgreSQL)

---

## 1. Modernisation technique (terminée)

| Chantier | Statut |
|---|---|
| Migration MySQL → PostgreSQL + durcissement sécurité | ✅ Fait, PR #1 ouverte |
| Mise à jour Java / Spring Boot (3.5.16) | ✅ Fait |
| Mise à jour Angular (18 → 22) + Node | ✅ Fait |
| Migration vers le nouveau système de build Angular (`@angular/build`) | ✅ Fait |

Chaque étape a été testée en conditions réelles (navigateur via Playwright, backend démarré, requêtes fonctionnelles) avant validation.

---

## 2. Analyse fonctionnelle vs cahier des charges

Un parcours complet du projet a été fait pour comparer l'existant au cahier des charges. Résultat : le socle (candidats, paiements, examens, reçus, rôles, dashboard, export PDF) est solide, mais plusieurs points du cahier des charges ne sont pas encore couverts.

### 2.1 Module Inscriptions (§7) — ✅ Fait

Traité en premier, car il conditionne la reprise après expiration (§12).

- Nouvelle entité `Inscription`, séparée du `Candidat`, portant catégorie/forfait/dates/statut/solde et le suivi de cycle (`numeroCycle`, `active`, `inscriptionPrecedente`).
- `Candidat` redevient une entité d'identité pure (état civil, contacts, dossier).
- `Paiement` et `PassageExamen` rattachés à l'inscription active (par cycle), pas directement au candidat.
- Nouvel endpoint `GET /api/inscriptions/candidat/{id}` pour l'historique des cycles.
- Aucune rupture de contrat API : le frontend n'a nécessité aucune modification.
- Vérifié de bout en bout (base réinitialisée, création candidat + versement + examen + export PDF + dashboard).
- Corrigé au passage un bug préexistant (recherche candidat sans terme plantait sur PostgreSQL).
- Commit `8349992`, poussé sur `origin`.

### 2.2 Points identifiés mais **non traités**

| # | Sujet | Référence | Description |
|---|---|---|---|
| 1 | Reprise après expiration + pénalité | §12 | Flux de nouvelle inscription pour un candidat déjà existant, avec pénalité éventuelle. Rendu possible par le module Inscriptions, mais pas encore implémenté. |
| 2 | Module Formation / progression | §8, §14, §27.6 | Suivi de la progression pédagogique (séances de conduite/code) — entièrement absent du projet actuel. |
| 3 | Filtrage du dashboard par rôle | §19 (matrice des droits) | `DashboardController` n'exige que `isAuthenticated()` : tous les rôles voient actuellement les données financières/caisse, alors que la matrice des droits prévoit une restriction. |
| 4 | Export "suivi des examens" | — | Pas de rapport PDF/Excel dédié au suivi des examens (seul le reçu de paiement est exporté). |
| 5 | Indicateur "candidats par catégorie" | — | Absent du dashboard actuel. |
| 6 | Champ `dateDepotDossier` | — | Présent côté backend/DTO mais absent du formulaire `candidats.component.ts` côté frontend. |
| 7 | Couverture de tests | §32 | Tests actuels limités aux règles métier de calcul de solde. Manquent : tests de sécurité, cas limites de validation des paiements, tests des modules examens/caisse/rapports/utilisateurs. |
| 8 | Enum `StatutDossier` | — | Valeurs `REPRISE` / `TERMINE` mentionnées dans le cahier des charges mais absentes de l'enum (non-bloquant selon le cahier des charges). |
| 9 | Données de démonstration | — | Le jeu de données de démo ne couvre pas les catégories A et B1. |

---

## 3. Méthode de travail convenue

Traitement des écarts **un par un**, dans l'ordre choisi par l'utilisateur, avec validation explicite avant toute modification de code. Aucune ligne de code n'est modifiée sans autorisation préalable.

**Prochaine étape proposée (non démarrée)** : Reprise après expiration + pénalité (§12).
