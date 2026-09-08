package com.autoecole.service;

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

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializerService implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CategoriePermisRepository categorieRepository;
    private final ForfaitRepository forfaitRepository;
    private final CandidatRepository candidatRepository;
    private final PaiementRepository paiementRepository;
    private final RecuRepository recuRepository;
    private final PassageExamenRepository passageRepository;
    private final TransactionCaisseRepository transactionCaisseRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Override
    public void run(String... args) {
        log.info("Initialisation des données de base de l'auto-école...");

        // 1. Rôles (toujours nécessaires au fonctionnement du contrôle d'accès)
        Role roleAdmin = initRole(RoleEnum.ADMIN, "Administrateur Général");
        Role roleSecretaire = initRole(RoleEnum.SECRETAIRE, "Secrétaire Administrative");
        Role roleCaissiere = initRole(RoleEnum.CAISSIERE, "Caissière / Comptable");
        Role roleMoniteur = initRole(RoleEnum.MONITEUR, "Moniteur Pédagogique");

        // 2. Catégories de permis et forfaits (données de référence, toujours créées)
        CategoriePermis catA1 = initCategorie("A1", "Permis Moto légère (125 cm³)", "Conduite motocyclettes");
        CategoriePermis catB = initCategorie("B", "Permis B Véhicule Léger", "Véhicules particuliers jusqu'à 3.5T");
        CategoriePermis catC = initCategorie("C", "Permis C Poids Lourd", "Transport de marchandises > 3.5T");

        Forfait f1 = initForfait("Forfait 1", new BigDecimal("100000"), "Formation standard (Code + Conduite 20h)");
        Forfait f2 = initForfait("Forfait 2", new BigDecimal("125000"), "Formation complète accélérée avec perfectionnement");

        if (seedEnabled) {
            // 3. Comptes de démonstration à mots de passe connus + jeu de données
            //    (uniquement en développement/démo : APP_SEED_ENABLED=false en production)
            Utilisateur admin = initUser("admin", "admin@autoecole.ci", "admin123", "KOUASSI", "Jean-Marc", "0701020304", roleAdmin);
            initUser("secretaire", "secretaire@autoecole.ci", "secretaire123", "YAO", "Aya Marie", "0702030405", roleSecretaire);
            initUser("caissiere", "caissiere@autoecole.ci", "caissiere123", "KOFFI", "Affoué Esther", "0703040506", roleCaissiere);
            Utilisateur moniteur = initUser("moniteur", "moniteur@autoecole.ci", "moniteur123", "DIABATE", "Ibrahim", "0704050607", roleMoniteur);

            if (candidatRepository.count() == 0) {
                initDemoData(admin, moniteur, catB, catA1, catC, f1, f2);
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
                    .actif(true)
                    .build();
            return utilisateurRepository.save(u);
        });
    }

    private CategoriePermis initCategorie(String code, String libelle, String desc) {
        return categorieRepository.findByCode(code).orElseGet(() -> {
            CategoriePermis c = CategoriePermis.builder().code(code).libelle(libelle).description(desc).actif(true).build();
            return categorieRepository.save(c);
        });
    }

    private Forfait initForfait(String nom, BigDecimal montant, String desc) {
        return forfaitRepository.findByNom(nom).orElseGet(() -> {
            Forfait f = Forfait.builder().nom(nom).montant(montant).description(desc).actif(true).build();
            return forfaitRepository.save(f);
        });
    }

    private void initDemoData(Utilisateur admin, Utilisateur moniteur, CategoriePermis catB, CategoriePermis catA1, CategoriePermis catC, Forfait f1, Forfait f2) {
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
                .dateInscription(dateInsc1)
                .dateEcheance(dateInsc1.plusMonths(8))
                .categoriePermis(catB)
                .forfait(f1)
                .montantForfait(f1.getMontant())
                .totalVerse(new BigDecimal("40000"))
                .soldeRestant(new BigDecimal("60000"))
                .statutDossier(StatutDossier.EN_COURS)
                .build();
        c1 = candidatRepository.save(c1);

        Paiement p1 = Paiement.builder()
                .candidat(c1)
                .utilisateur(admin)
                .typeVersement(TypeVersement.PREMIER_VERSEMENT)
                .montant(new BigDecimal("40000"))
                .datePaiement(LocalDateTime.now().minusMonths(1))
                .modeReglement(ModeReglement.ESPECES)
                .statut(StatutPaiement.VALIDE)
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

        transactionCaisseRepository.save(TransactionCaisse.builder()
                .typeMouvement(TypeMouvementCaisse.ENTREE)
                .montant(new BigDecimal("40000"))
                .libelle("1er Versement Inscription DOS-2026-0001 (TRAORE Bakary)")
                .categorie("RECETTE_FORMATION")
                .referencePiece("REC-2026-0001")
                .utilisateur(admin)
                .paiement(p1)
                .build());

        // Passage examen Code pour C1 (Réussi)
        passageRepository.save(PassageExamen.builder()
                .candidat(c1)
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
                .dateInscription(dateInsc2)
                .dateEcheance(dateInsc2.plusMonths(8))
                .categoriePermis(catB)
                .forfait(f2)
                .montantForfait(f2.getMontant())
                .totalVerse(new BigDecimal("125000"))
                .soldeRestant(BigDecimal.ZERO)
                .statutDossier(StatutDossier.SOLDE)
                .build();
        c2 = candidatRepository.save(c2);

        Paiement p2_1 = paiementRepository.save(Paiement.builder()
                .candidat(c2)
                .utilisateur(admin)
                .typeVersement(TypeVersement.PREMIER_VERSEMENT)
                .montant(new BigDecimal("50000"))
                .datePaiement(LocalDateTime.now().minusMonths(2))
                .modeReglement(ModeReglement.MOBILE_MONEY)
                .statut(StatutPaiement.VALIDE)
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
                .candidat(c2)
                .utilisateur(admin)
                .typeVersement(TypeVersement.VERSEMENT_SUIVANT)
                .montant(new BigDecimal("75000"))
                .datePaiement(LocalDateTime.now().minusDays(10))
                .modeReglement(ModeReglement.ESPECES)
                .statut(StatutPaiement.VALIDE)
                .build());
        recuRepository.save(Recu.builder()
                .paiement(p2_2)
                .numeroRecu("REC-2026-0003")
                .nomClient(c2.getNom() + " " + c2.getPrenom())
                .montant(new BigDecimal("75000"))
                .soldeRestant(BigDecimal.ZERO)
                .imprimePar("KOUASSI Jean-Marc")
                .build());

        transactionCaisseRepository.save(TransactionCaisse.builder()
                .typeMouvement(TypeMouvementCaisse.ENTREE)
                .montant(new BigDecimal("50000"))
                .libelle("1er Versement Inscription DOS-2026-0002 (KONE Fatoumata)")
                .categorie("RECETTE_FORMATION")
                .referencePiece("REC-2026-0002")
                .utilisateur(admin)
                .paiement(p2_1)
                .build());

        transactionCaisseRepository.save(TransactionCaisse.builder()
                .typeMouvement(TypeMouvementCaisse.ENTREE)
                .montant(new BigDecimal("75000"))
                .libelle("Solde de formation DOS-2026-0002 (KONE Fatoumata)")
                .categorie("RECETTE_FORMATION")
                .referencePiece("REC-2026-0003")
                .utilisateur(admin)
                .paiement(p2_2)
                .build());

        // Passages d'examens pour C2 (Code réussi, Créneau réussi, Circulation programmée)
        passageRepository.save(PassageExamen.builder()
                .candidat(c2)
                .typeEpreuve(TypeEpreuve.CODE)
                .numeroPassage(1)
                .datePassage(LocalDate.now().minusMonths(1))
                .resultat(ResultatExamen.REUSSI)
                .observations("Validé du premier coup")
                .moniteur(moniteur)
                .build());

        passageRepository.save(PassageExamen.builder()
                .candidat(c2)
                .typeEpreuve(TypeEpreuve.CRENEAU)
                .numeroPassage(1)
                .datePassage(LocalDate.now().minusDays(12))
                .resultat(ResultatExamen.REUSSI)
                .observations("Créneau gauche et bataille réussis")
                .moniteur(moniteur)
                .build());

        passageRepository.save(PassageExamen.builder()
                .candidat(c2)
                .typeEpreuve(TypeEpreuve.CIRCULATION)
                .numeroPassage(1)
                .datePassage(LocalDate.now().plusDays(4))
                .resultat(ResultatExamen.PROGRAMME)
                .observations("Session de circulation en agglomération")
                .moniteur(moniteur)
                .build());

        // Quelques dépenses de caisse pour la démonstration
        transactionCaisseRepository.save(TransactionCaisse.builder()
                .typeMouvement(TypeMouvementCaisse.SORTIE)
                .montant(new BigDecimal("25000"))
                .libelle("Achat carburant véhicule auto-école Toyota Yaris")
                .categorie("CARBURANT")
                .referencePiece("FACT-TOTAL-889")
                .utilisateur(admin)
                .build());

        transactionCaisseRepository.save(TransactionCaisse.builder()
                .typeMouvement(TypeMouvementCaisse.SORTIE)
                .montant(new BigDecimal("15000"))
                .libelle("Achat fournitures de bureau et livrets de code")
                .categorie("FOURNITURES")
                .referencePiece("TICKET-LIB-44")
                .utilisateur(admin)
                .build());
    }
}
