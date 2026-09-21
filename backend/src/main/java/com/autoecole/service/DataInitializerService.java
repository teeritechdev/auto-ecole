package com.autoecole.service;

import com.autoecole.dto.CandidatDTOs.IdentifiantsCompteDTO;
import com.autoecole.entity.*;
import com.autoecole.entity.enums.*;
import com.autoecole.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializerService implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final ProfilRepository profilRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CategoriePermisRepository categorieRepository;
    private final SiteRepository siteRepository;
    private final CandidatRepository candidatRepository;
    private final InscriptionRepository inscriptionRepository;
    private final PaiementRepository paiementRepository;
    private final RecuRepository recuRepository;
    private final PassageExamenRepository passageRepository;
    private final PasswordEncoder passwordEncoder;
    private final CandidatAccountService candidatAccountService;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.inscription.duree-validite-mois:8}")
    private int dureeValiditeMois;

    @Override
    public void run(String... args) {
        log.info("Initialisation des données de base de l'auto-école...");

        // 1. Rôles (toujours nécessaires au fonctionnement du contrôle d'accès)
        Role roleAdmin = initRole(RoleEnum.ADMIN, "Administrateur Général");
        Role roleSecretaire = initRole(RoleEnum.SECRETAIRE, "Secrétaire Administrative");
        Role roleCaissiere = initRole(RoleEnum.CAISSIERE, "Caissière / Comptable");
        Role roleMoniteur = initRole(RoleEnum.MONITEUR, "Moniteur Pédagogique");
        Role roleCandidat = initRole(RoleEnum.CANDIDAT, "Candidat");

        // 1bis. Catalogue de permissions + profils système (onglet Permissions de Paramétrage) :
        //       reproduit fidèlement les accès historiques par rôle ; l'ADMIN garde toujours
        //       l'intégralité des permissions (cf. UserDetailsServiceImpl).
        initPermissionsEtProfils(roleAdmin, roleSecretaire, roleCaissiere, roleMoniteur, roleCandidat);
        rattacherProfilsManquants();

        // 2. Catégories de permis, avec leur tarif (données de référence, toujours créées)
        CategoriePermis catA1 = initCategorie("A1", "Permis Moto légère (125 cm³)", new BigDecimal("75000"), "Conduite motocyclettes");
        CategoriePermis catB = initCategorie("B", "Permis B Véhicule Léger", new BigDecimal("100000"), "Véhicules particuliers jusqu'à 3.5T");
        CategoriePermis catC = initCategorie("C", "Permis C Poids Lourd", new BigDecimal("150000"), "Transport de marchandises > 3.5T");

        // 2bis. Sites de démonstration : uniquement sur une base totalement vierge
        //       (sinon la suppression volontaire d'un site de démo serait annulée à chaque redémarrage).
        Site siteCocody = null;
        if (siteRepository.count() == 0) {
            siteCocody = initSite("Site Cocody", "Boulevard de France, Cocody, Abidjan");
            initSite("Site Yopougon", "Route de Yopougon-Ficgayo, Abidjan");
            initSite("Site Bouaké", "Avenue de la République, Bouaké");
        }

        if (seedEnabled) {
            // 3. Comptes de démonstration à mots de passe connus + jeu de données
            //    (uniquement en développement/démo : APP_SEED_ENABLED=false en production)
            Utilisateur admin = initUser("admin", "admin@autoecole.ci", "admin123", "KOUASSI", "Jean-Marc", "0701020304", roleAdmin);
            initUser("secretaire", "secretaire@autoecole.ci", "secretaire123", "YAO", "Aya Marie", "0702030405", roleSecretaire);
            initUser("caissiere", "caissiere@autoecole.ci", "caissiere123", "KOFFI", "Affoué Esther", "0703040506", roleCaissiere);
            Utilisateur moniteur = initUser("moniteur", "moniteur@autoecole.ci", "moniteur123", "DIABATE", "Ibrahim", "0704050607", roleMoniteur);
            if (moniteur.getSites().isEmpty() && siteCocody != null) {
                moniteur.setSites(new java.util.HashSet<>(Set.of(siteCocody)));
                moniteur.setSpecialites(Set.of(TypeEpreuve.CODE, TypeEpreuve.CRENEAU, TypeEpreuve.CIRCULATION));
                moniteur = utilisateurRepository.save(moniteur);
            }

            if (candidatRepository.count() == 0) {
                initDemoData(admin, moniteur, catB, siteCocody);
            }
        } else {
            ensureAtLeastOneAdmin(roleAdmin);
        }

        log.info("Initialisation des données terminée avec succès.");
    }

    /**
     * En production (APP_SEED_ENABLED=false), aucun compte à mot de passe
     * connu n'est créé. Si la base est totalement vierge, un unique compte
     * admin est provisionné avec un mot de passe aléatoire affiché UNE SEULE
     * FOIS dans les logs du serveur — à récupérer et changer immédiatement.
     */
    private void ensureAtLeastOneAdmin(Role roleAdmin) {
        if (utilisateurRepository.count() > 0) {
            return;
        }
        String tempPassword = generateSecureRandomPassword();
        initUser("admin", "admin@autoecole.local", tempPassword, "Administrateur", "Système", null, roleAdmin);

        log.warn("=====================================================================");
        log.warn(" Aucun utilisateur en base : compte admin initial créé.");
        log.warn(" Identifiant : admin");
        log.warn(" Mot de passe temporaire (à changer immédiatement, non ré-affiché) : {}", tempPassword);
        log.warn("=====================================================================");
    }

    private String generateSecureRandomPassword() {
        byte[] randomBytes = new byte[18];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private Role initRole(RoleEnum code, String libelle) {
        return roleRepository.findByCode(code).orElseGet(() -> {
            Role r = Role.builder().code(code).libelle(libelle).build();
            return roleRepository.save(r);
        });
    }

    private Utilisateur initUser(String username, String email, String pwd, String nom, String prenom, String tel, Role role) {
        return utilisateurRepository.findByUsername(username).orElseGet(() -> {
            Utilisateur u = Utilisateur.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode(pwd))
                    .nom(nom)
                    .prenom(prenom)
                    .telephone(tel)
                    .role(role)
                    .profil(profilRepository.findByRoleSysteme(role.getCode()).orElse(null))
                    .actif(true)
                    .build();
            return utilisateurRepository.save(u);
        });
    }

    /** Définit le catalogue de permissions et les 5 profils système, sans jamais écraser des
     *  permissions déjà personnalisées par l'administrateur sur un profil existant. */
    private void initPermissionsEtProfils(Role admin, Role secretaire, Role caissiere, Role moniteur, Role candidat) {
        record Def(String code, String module, String libelle) {}
        List<Def> catalogue = List.of(
                new Def("CANDIDATS_VOIR", "Candidats", "Voir la liste et les fiches candidats"),
                new Def("CANDIDATS_CREER", "Candidats", "Créer un dossier candidat"),
                new Def("CANDIDATS_MODIFIER", "Candidats", "Modifier un dossier candidat"),
                new Def("CANDIDATS_SUPPRIMER", "Candidats", "Supprimer un dossier candidat"),
                new Def("INSCRIPTIONS_VOIR", "Candidats", "Voir l'historique des cycles d'inscription"),
                new Def("EXAMENS_VOIR", "Examens", "Voir les passages et sessions d'examen"),
                new Def("EXAMENS_PROGRAMMER", "Examens", "Programmer un passage ou une session d'examen"),
                new Def("EXAMENS_GERER_SESSION", "Examens", "Gérer une session d'examen (candidats, date, résultat)"),
                new Def("EXAMENS_SUPPRIMER", "Examens", "Supprimer un passage d'examen"),
                new Def("PAIEMENTS_VOIR", "Paiements", "Voir les versements et reçus"),
                new Def("PAIEMENTS_CREER", "Paiements", "Enregistrer un versement"),
                new Def("PAIEMENTS_MODIFIER", "Paiements", "Modifier un versement"),
                new Def("PAIEMENTS_ANNULER", "Paiements", "Annuler un versement"),
                new Def("CAISSE_VOIR", "Caisse Ménu Dépense", "Voir les opérations et le récapitulatif de caisse"),
                new Def("CAISSE_CREER", "Caisse Ménu Dépense", "Enregistrer une opération de caisse"),
                new Def("CAISSE_SUPPRIMER", "Caisse Ménu Dépense", "Supprimer une opération de caisse"),
                new Def("CAISSE_NATURES_VOIR", "Caisse Ménu Dépense", "Voir les natures d'opération actives"),
                new Def("CAISSE_NATURES_GERER", "Caisse Ménu Dépense", "Créer ou modifier les natures d'opération"),
                new Def("UTILISATEURS_VOIR", "Utilisateurs", "Voir les comptes utilisateurs"),
                new Def("UTILISATEURS_CREER", "Utilisateurs", "Créer un compte utilisateur"),
                new Def("UTILISATEURS_MODIFIER", "Utilisateurs", "Modifier un compte utilisateur"),
                new Def("UTILISATEURS_RESET_PASSWORD", "Utilisateurs", "Réinitialiser le mot de passe d'un compte candidat"),
                new Def("CODE_PRATIQUER", "Code de la route", "Passer les tests d'entraînement au code"),
                new Def("CODE_SUIVI", "Code de la route", "Suivre la progression au code d'un candidat"),
                new Def("CODE_CONFIGURATION_GERER", "Code de la route", "Configurer le module Code de la route"),
                new Def("CODE_QUESTIONS_GERER", "Code de la route", "Gérer la banque de questions du code"),
                new Def("PARAMETRAGE_CATEGORIES_GERER", "Paramétrage", "Gérer les catégories de permis"),
                new Def("PARAMETRAGE_SITES_GERER", "Paramétrage", "Gérer les sites de formation"),
                new Def("PARAMETRAGE_SITES_STATISTIQUES", "Paramétrage", "Voir les statistiques par site"),
                new Def("CONFIGURATION_IDENTITE_MODIFIER", "Paramétrage", "Modifier l'identité de l'auto-école"),
                new Def("CONFIGURATION_TARIFS_VOIR", "Paramétrage", "Voir les tarifs des examens"),
                new Def("CONFIGURATION_TARIFS_MODIFIER", "Paramétrage", "Modifier les tarifs des examens"),
                new Def("RAPPORTS_CANDIDATS", "Rapports", "Exporter les rapports candidats et paiements"),
                new Def("RAPPORTS_CAISSE", "Rapports", "Exporter les relevés de caisse"),
                new Def("AUDIT_VOIR", "Audit", "Consulter le journal d'audit"),
                new Def("AUDIT_SUPPRIMER", "Audit", "Supprimer des entrées du journal d'audit")
        );

        Map<String, Permission> parCode = new java.util.HashMap<>();
        for (Def d : catalogue) {
            Permission p = permissionRepository.findByCode(d.code()).orElseGet(() ->
                    permissionRepository.save(Permission.builder().code(d.code()).module(d.module()).libelle(d.libelle()).build()));
            parCode.put(d.code(), p);
        }

        Set<String> tout = parCode.keySet();
        Set<String> secretaireDefaut = Set.of("CANDIDATS_VOIR", "CANDIDATS_CREER", "CANDIDATS_MODIFIER",
                "EXAMENS_VOIR", "PAIEMENTS_VOIR", "INSCRIPTIONS_VOIR", "RAPPORTS_CANDIDATS");
        Set<String> caissiereDefaut = Set.of("CANDIDATS_VOIR", "PAIEMENTS_VOIR", "PAIEMENTS_CREER", "PAIEMENTS_MODIFIER",
                "PAIEMENTS_ANNULER", "CAISSE_VOIR", "CAISSE_CREER", "CAISSE_NATURES_VOIR", "CONFIGURATION_TARIFS_VOIR",
                "INSCRIPTIONS_VOIR", "RAPPORTS_CANDIDATS", "RAPPORTS_CAISSE");
        Set<String> moniteurDefaut = Set.of("CANDIDATS_VOIR", "EXAMENS_VOIR", "EXAMENS_PROGRAMMER",
                "EXAMENS_GERER_SESSION", "CODE_SUIVI", "CODE_CONFIGURATION_GERER", "CODE_QUESTIONS_GERER");
        Set<String> candidatDefaut = Set.of("CODE_PRATIQUER", "CODE_SUIVI");

        initProfilSysteme("Administrateur", "Accès total au système, toujours garanti", admin.getCode(), parCode, tout);
        initProfilSysteme("Secrétaire", "Gestion des dossiers candidats et suivi des examens", secretaire.getCode(), parCode, secretaireDefaut);
        initProfilSysteme("Caissière", "Encaissements, caisse et rapports financiers", caissiere.getCode(), parCode, caissiereDefaut);
        initProfilSysteme("Moniteur", "Suivi pédagogique et gestion des examens de terrain", moniteur.getCode(), parCode, moniteurDefaut);
        initProfilSysteme("Candidat", "Espace personnel d'entraînement au code de la route", candidat.getCode(), parCode, candidatDefaut);
    }

    /** Crée le profil système s'il n'existe pas encore ; ne touche plus à ses permissions une
     *  fois créé, pour respecter les personnalisations éventuelles de l'administrateur. */
    private void initProfilSysteme(String nom, String description, RoleEnum roleSysteme,
                                    Map<String, Permission> parCode, Set<String> codesDefaut) {
        if (profilRepository.findByRoleSysteme(roleSysteme).isPresent()) {
            return;
        }
        Set<Permission> permissions = codesDefaut.stream().map(parCode::get).collect(Collectors.toSet());
        profilRepository.save(Profil.builder()
                .nom(nom)
                .description(description)
                .systeme(true)
                .roleSysteme(roleSysteme)
                .permissions(new HashSet<>(permissions))
                .build());
    }

    /** Rattache au profil système correspondant à leur rôle les comptes déjà existants qui
     *  n'ont pas encore de profil (migration depuis une base antérieure à l'onglet Permissions).
     *  Garantit également que le profil CANDIDAT possède bien CODE_PRATIQUER et CODE_SUIVI,
     *  et que le profil MONITEUR possède CODE_QUESTIONS_GERER pour charger questions et images. */
    private void rattacherProfilsManquants() {
        profilRepository.findByRoleSysteme(RoleEnum.CANDIDAT).ifPresent(profilCandidat -> {
            boolean modifie = false;
            Permission permPratiquer = permissionRepository.findByCode("CODE_PRATIQUER").orElse(null);
            Permission permSuivi = permissionRepository.findByCode("CODE_SUIVI").orElse(null);
            if (permPratiquer != null && profilCandidat.getPermissions().add(permPratiquer)) {
                modifie = true;
            }
            if (permSuivi != null && profilCandidat.getPermissions().add(permSuivi)) {
                modifie = true;
            }
            if (modifie) {
                profilRepository.save(profilCandidat);
            }
        });

        profilRepository.findByRoleSysteme(RoleEnum.MONITEUR).ifPresent(profilMoniteur -> {
            boolean modifie = false;
            Permission permQuestions = permissionRepository.findByCode("CODE_QUESTIONS_GERER").orElse(null);
            if (permQuestions != null && profilMoniteur.getPermissions().add(permQuestions)) {
                modifie = true;
            }
            if (modifie) {
                profilRepository.save(profilMoniteur);
            }
        });

        utilisateurRepository.findAll().forEach(u -> {
            if (u.getProfil() == null && u.getRole() != null) {
                profilRepository.findByRoleSysteme(u.getRole().getCode()).ifPresent(profil -> {
                    u.setProfil(profil);
                    utilisateurRepository.save(u);
                });
            }
        });
    }

    private CategoriePermis initCategorie(String code, String libelle, BigDecimal montant, String desc) {
        return categorieRepository.findByCode(code).orElseGet(() -> {
            CategoriePermis c = CategoriePermis.builder().code(code).libelle(libelle).montant(montant).description(desc).actif(true).build();
            return categorieRepository.save(c);
        });
    }

    /** Crée le compte de connexion du candidat de démonstration et journalise son mot de
     *  passe temporaire dans les logs (uniquement en environnement de démo/dev, APP_SEED_ENABLED=true). */
    private void creerCompteCandidatDemo(Candidat candidat) {
        IdentifiantsCompteDTO identifiants = candidatAccountService.creerCompteCandidatSiAbsent(candidat);
        if (identifiants != null) {
            log.info("Compte candidat de démonstration créé — identifiant : {} / mot de passe : {}",
                    identifiants.getUsername(), identifiants.getMotDePasseTemporaire());
        }
    }

    private Site initSite(String nom, String adresse) {
        return siteRepository.findByNom(nom).orElseGet(() -> {
            Site s = Site.builder().nom(nom).adresse(adresse).actif(true).build();
            return siteRepository.save(s);
        });
    }

    private void initDemoData(Utilisateur admin, Utilisateur moniteur, CategoriePermis catB, Site site) {
        log.info("Création des candidats et enregistrements de démonstration...");

        // Candidat 1 : En cours (1er versement 40 000 FCFA effectué)
        LocalDate dateInsc1 = LocalDate.now().minusMonths(1);
        Candidat c1 = Candidat.builder()
                .numeroDossier("DOS-2026-0001")
                .nom("TRAORE")
                .prenom("Bakary")
                .dateNaissance(LocalDate.of(1998, 5, 14))
                .lieuNaissance("Abidjan")
                .telephone("0708091011")
                .email("bakary.traore@email.ci")
                .build();
        c1 = candidatRepository.save(c1);
        creerCompteCandidatDemo(c1);

        Inscription i1 = Inscription.builder()
                .candidat(c1)
                .categoriePermis(catB)
                .site(site)
                .montantForfait(catB.getMontant())
                .dateInscription(dateInsc1)
                .dateEcheance(dateInsc1.plusMonths(dureeValiditeMois))
                .totalVerse(new BigDecimal("40000"))
                .soldeRestant(new BigDecimal("60000"))
                .statutDossier(StatutDossier.EN_COURS)
                .numeroCycle(1)
                .active(true)
                .build();
        i1 = inscriptionRepository.save(i1);

        Paiement p1 = Paiement.builder()
                .inscription(i1)
                .utilisateur(admin)
                .montant(new BigDecimal("40000"))
                .datePaiement(LocalDateTime.now().minusMonths(1))
                .modeReglement(ModeReglement.ESPECES)
                .build();
        p1 = paiementRepository.save(p1);

        Recu r1 = Recu.builder()
                .paiement(p1)
                .numeroRecu("REC-2026-0001")
                .nomClient(c1.getNom() + " " + c1.getPrenom())
                .montant(new BigDecimal("40000"))
                .soldeRestant(new BigDecimal("60000"))
                .imprimePar("KOUASSI Jean-Marc")
                .build();
        recuRepository.save(r1);

        // Passage examen Code pour C1 (Réussi)
        passageRepository.save(PassageExamen.builder()
                .inscription(i1)
                .typeEpreuve(TypeEpreuve.CODE)
                .numeroPassage(1)
                .datePassage(LocalDate.now().minusDays(5))
                .resultat(ResultatExamen.REUSSI)
                .observations("Excellente maîtrise du code de la route (38/40)")
                .moniteur(moniteur)
                .build());

        // Candidat 2 : Totalement Soldé (Forfait 2 = 125 000 FCFA versé en 2 fois : 50 000 + 75 000)
        LocalDate dateInsc2 = LocalDate.now().minusMonths(2);
        Candidat c2 = Candidat.builder()
                .numeroDossier("DOS-2026-0002")
                .nom("KONE")
                .prenom("Fatoumata")
                .dateNaissance(LocalDate.of(2001, 11, 23))
                .lieuNaissance("Bouaké")
                .telephone("0506070809")
                .email("fatou.kone@email.ci")
                .build();
        c2 = candidatRepository.save(c2);
        creerCompteCandidatDemo(c2);

        Inscription i2 = Inscription.builder()
                .candidat(c2)
                .categoriePermis(catB)
                .site(site)
                .montantForfait(new BigDecimal("125000"))
                .dateInscription(dateInsc2)
                .dateEcheance(dateInsc2.plusMonths(dureeValiditeMois))
                .totalVerse(new BigDecimal("125000"))
                .soldeRestant(BigDecimal.ZERO)
                .statutDossier(StatutDossier.SOLDE)
                .numeroCycle(1)
                .active(true)
                .build();
        i2 = inscriptionRepository.save(i2);

        Paiement p2_1 = paiementRepository.save(Paiement.builder()
                .inscription(i2)
                .utilisateur(admin)
                .montant(new BigDecimal("50000"))
                .datePaiement(LocalDateTime.now().minusMonths(2))
                .modeReglement(ModeReglement.MOBILE_MONEY)
                .build());
        recuRepository.save(Recu.builder()
                .paiement(p2_1)
                .numeroRecu("REC-2026-0002")
                .nomClient(c2.getNom() + " " + c2.getPrenom())
                .montant(new BigDecimal("50000"))
                .soldeRestant(new BigDecimal("75000"))
                .imprimePar("KOUASSI Jean-Marc")
                .build());

        Paiement p2_2 = paiementRepository.save(Paiement.builder()
                .inscription(i2)
                .utilisateur(admin)
                .montant(new BigDecimal("75000"))
                .datePaiement(LocalDateTime.now().minusDays(10))
                .modeReglement(ModeReglement.ESPECES)
                .build());
        recuRepository.save(Recu.builder()
                .paiement(p2_2)
                .numeroRecu("REC-2026-0003")
                .nomClient(c2.getNom() + " " + c2.getPrenom())
                .montant(new BigDecimal("75000"))
                .soldeRestant(BigDecimal.ZERO)
                .imprimePar("KOUASSI Jean-Marc")
                .build());

        // Passages d'examens pour C2 (Code réussi, Créneau réussi, Circulation programmée)
        passageRepository.save(PassageExamen.builder()
                .inscription(i2)
                .typeEpreuve(TypeEpreuve.CODE)
                .numeroPassage(1)
                .datePassage(LocalDate.now().minusMonths(1))
                .resultat(ResultatExamen.REUSSI)
                .observations("Validé du premier coup")
                .moniteur(moniteur)
                .build());

        passageRepository.save(PassageExamen.builder()
                .inscription(i2)
                .typeEpreuve(TypeEpreuve.CRENEAU)
                .numeroPassage(1)
                .datePassage(LocalDate.now().minusDays(12))
                .resultat(ResultatExamen.REUSSI)
                .observations("Créneau gauche et bataille réussis")
                .moniteur(moniteur)
                .build());

        passageRepository.save(PassageExamen.builder()
                .inscription(i2)
                .typeEpreuve(TypeEpreuve.CIRCULATION)
                .numeroPassage(1)
                .datePassage(LocalDate.now().plusDays(4))
                .resultat(ResultatExamen.PROGRAMME)
                .observations("Session de circulation en agglomération")
                .moniteur(moniteur)
                .build());

        // Note : aucune donnée de démonstration n'est semée pour la Caisse & Trésorerie —
        // c'est une caisse de dépenses/recettes diverses totalement autonome (cf. CaisseService),
        // dont les Natures d'opération sont définies par l'ADMIN lui-même (aucun contenu imposé).
    }
}
