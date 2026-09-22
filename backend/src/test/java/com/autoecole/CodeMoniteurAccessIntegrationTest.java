package com.autoecole;

import com.autoecole.controller.CodeConfigurationController;
import com.autoecole.controller.CodeController;
import com.autoecole.dto.CodeDTOs.UpdateCodeConfigurationRequest;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.CategoriePermis;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.Role;
import com.autoecole.entity.Site;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.EtapeParcours;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CandidatRepository;
import com.autoecole.repository.CategoriePermisRepository;
import com.autoecole.repository.InscriptionRepository;
import com.autoecole.repository.RoleRepository;
import com.autoecole.repository.SiteRepository;
import com.autoecole.repository.UtilisateurRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Vérifie, avec de vraies données (rôle, sites, candidats, inscriptions) et le contexte Spring
 * réel, le contrôle d'accès du personnel au module Code de la route (§9 implicite, §12, §15 du
 * cahier des charges du module) : restriction par SITE (déjà en vigueur) ET par SPÉCIALITÉ
 * "Code" du Moniteur (corrigée à l'ÉTAPE 4, réutilisant SiteAccessService.verifierAccesEpreuve
 * — même mécanisme que celui déjà utilisé par ExamenService). Exerce exactement les deux
 * endpoints utilisés par la page Angular "Résultats Code" (getProgression ET getHistorique),
 * sans passer par la liste de candidats (donc sans dépendre de son propre filtrage par étape).
 *
 * @Transactional : toutes les données créées ici (sites, candidats, inscriptions, comptes de
 * test) sont annulées automatiquement à la fin de chaque test.
 */
@SpringBootTest
@Transactional
class CodeMoniteurAccessIntegrationTest {

    @Autowired
    private CodeController codeController;
    @Autowired
    private CodeConfigurationController codeConfigurationController;
    @Autowired
    private SiteRepository siteRepository;
    @Autowired
    private CategoriePermisRepository categoriePermisRepository;
    @Autowired
    private CandidatRepository candidatRepository;
    @Autowired
    private InscriptionRepository inscriptionRepository;
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @WithMockUser(username = "moniteur-code-etape4", roles = "MONITEUR")
    @DisplayName("6. Un Moniteur spécialisé Code accède aux candidats Code de son site, même si le candidat a avancé vers une étape ultérieure")
    void moniteurSpecialiseCodeAccedeMemeApresAvancementEtape() {
        Site siteAutorise = siteRepository.save(Site.builder().nom("Site Étape4 Autorisé A").adresse("Adresse A").actif(true).build());
        CategoriePermis categorie = categoriePermisUnique();

        // Candidat déjà bien avancé (Permis obtenu) : le module Code est un outil de révision
        // indépendant de l'étape officielle de l'examen (cf. cahier des charges du module).
        Candidat candidatAvance = creerCandidatAvecInscription("DOS-ETAPE4-A1", siteAutorise, categorie, EtapeParcours.PERMIS_OBTENU);

        creerMoniteur("moniteur-code-etape4", Set.of(siteAutorise), Set.of(TypeEpreuve.CODE));

        assertDoesNotThrow(() -> codeController.getProgression(candidatAvance.getId()),
                "Un Moniteur spécialisé Code doit accéder à la progression Code d'un candidat de son site, quelle que soit son étape actuelle");
        assertDoesNotThrow(() -> codeController.getHistorique(candidatAvance.getId()),
                "Idem pour l'historique : même restriction, même résultat attendu");
    }

    @Test
    @WithMockUser(username = "moniteur-creneau-etape4", roles = "MONITEUR")
    @DisplayName("7/9/12. Un Moniteur d'une autre spécialité (Créneau) ne peut pas consulter les données Code, même pour un candidat de son propre site")
    void moniteurAutreSpecialiteRefuseMemeSurSonPropreSite() {
        Site siteAutorise = siteRepository.save(Site.builder().nom("Site Étape4 Autorisé B").adresse("Adresse B").actif(true).build());
        CategoriePermis categorie = categoriePermisUnique();

        Candidat candidat = creerCandidatAvecInscription("DOS-ETAPE4-B1", siteAutorise, categorie, EtapeParcours.CODE);

        creerMoniteur("moniteur-creneau-etape4", Set.of(siteAutorise), Set.of(TypeEpreuve.CRENEAU));

        assertThrows(BadRequestException.class, () -> codeController.getProgression(candidat.getId()),
                "Un Moniteur non spécialisé Code ne doit jamais consulter la progression Code, même sur son propre site");
        assertThrows(BadRequestException.class, () -> codeController.getHistorique(candidat.getId()),
                "Idem pour l'historique : la restriction de spécialité s'applique aux deux endpoints");
    }

    @Test
    @WithMockUser(username = "moniteur-code-etape4-multi", roles = "MONITEUR")
    @DisplayName("8/9. La restriction par site continue de s'appliquer même pour un Moniteur spécialisé Code")
    void restrictionParSiteToujoursAppliqueeMemeAvecLaBonneSpecialite() {
        Site siteAutorise = siteRepository.save(Site.builder().nom("Site Étape4 Autorisé C").adresse("Adresse C").actif(true).build());
        Site siteNonAutorise = siteRepository.save(Site.builder().nom("Site Étape4 Non Autorisé C").adresse("Adresse D").actif(true).build());
        CategoriePermis categorie = categoriePermisUnique();

        Candidat candidatAutorise = creerCandidatAvecInscription("DOS-ETAPE4-C1", siteAutorise, categorie, EtapeParcours.CODE);
        Candidat candidatNonAutorise = creerCandidatAvecInscription("DOS-ETAPE4-C2", siteNonAutorise, categorie, EtapeParcours.CODE);

        creerMoniteur("moniteur-code-etape4-multi", Set.of(siteAutorise), Set.of(TypeEpreuve.CODE));

        assertDoesNotThrow(() -> codeController.getProgression(candidatAutorise.getId()));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> codeController.getProgression(candidatNonAutorise.getId()),
                "Même spécialisé Code, un Moniteur ne doit jamais accéder à un candidat d'un autre site");
        assertEquals("Candidat introuvable", ex.getMessage());
        assertThrows(ResourceNotFoundException.class, () -> codeController.getHistorique(candidatNonAutorise.getId()));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("10. L'Administrateur conserve un accès complet, indépendamment du site ou d'une quelconque spécialité")
    void adminConserveAccesCompletSansRestriction() {
        Site siteA = siteRepository.save(Site.builder().nom("Site Étape4 Admin A").adresse("Adresse A").actif(true).build());
        Site siteB = siteRepository.save(Site.builder().nom("Site Étape4 Admin B").adresse("Adresse B").actif(true).build());
        CategoriePermis categorie = categoriePermisUnique();

        Candidat candidatA = creerCandidatAvecInscription("DOS-ETAPE4-ADMIN-A", siteA, categorie, EtapeParcours.CIRCULATION);
        Candidat candidatB = creerCandidatAvecInscription("DOS-ETAPE4-ADMIN-B", siteB, categorie, EtapeParcours.CODE);

        assertDoesNotThrow(() -> codeController.getProgression(candidatA.getId()));
        assertDoesNotThrow(() -> codeController.getHistorique(candidatA.getId()));
        assertDoesNotThrow(() -> codeController.getProgression(candidatB.getId()));
        assertDoesNotThrow(() -> codeController.getHistorique(candidatB.getId()));
    }

    @Test
    @WithMockUser(username = "moniteur-code-config-ok", roles = "MONITEUR")
    @DisplayName("ÉTAPE 5 : un Moniteur spécialisé Code peut consulter et modifier la configuration du Code")
    void moniteurSpecialiseCodePeutAccederALaConfiguration() {
        Site site = siteRepository.save(Site.builder().nom("Site Config Autorisé").adresse("Adresse").actif(true).build());
        creerMoniteur("moniteur-code-config-ok", Set.of(site), Set.of(TypeEpreuve.CODE));

        assertDoesNotThrow(() -> codeConfigurationController.getConfiguration());
        assertDoesNotThrow(() -> codeConfigurationController.updateConfiguration(requeteConfigurationValide()));
    }

    @Test
    @WithMockUser(username = "moniteur-creneau-config-refus", roles = "MONITEUR")
    @DisplayName("ÉTAPE 5 : un Moniteur d'une autre spécialité (Créneau) ne peut ni consulter ni modifier la configuration du Code")
    void moniteurAutreSpecialiteNePeutPasAccederALaConfiguration() {
        Site site = siteRepository.save(Site.builder().nom("Site Config Refusé").adresse("Adresse").actif(true).build());
        creerMoniteur("moniteur-creneau-config-refus", Set.of(site), Set.of(TypeEpreuve.CRENEAU));

        assertThrows(BadRequestException.class, () -> codeConfigurationController.getConfiguration(),
                "Un Moniteur non spécialisé Code ne doit pas pouvoir consulter la configuration globale du Code");
        assertThrows(BadRequestException.class, () -> codeConfigurationController.updateConfiguration(requeteConfigurationValide()),
                "Idem pour la modification : la restriction de spécialité s'applique aussi à l'écriture");
    }

    private UpdateCodeConfigurationRequest requeteConfigurationValide() {
        // seuilReussite=24, tempsParQuestion=30s, dureeMaxSerie=900s,
        // repriseAutorisee=true, retourAutorise=true, correctionImmediate=false,
        // deblocageAutomatique=true, dureeExpirationAccesJours=null
        return new UpdateCodeConfigurationRequest(24, 30, 900, true, true, false, true, null);
    }

    // ---------- Fixtures ----------

    private CategoriePermis categoriePermisUnique() {
        return categoriePermisRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Aucune catégorie de permis en base pour le test"));
    }

    private Candidat creerCandidatAvecInscription(String numeroDossier, Site site, CategoriePermis categorie, EtapeParcours etape) {
        Candidat candidat = candidatRepository.save(Candidat.builder()
                .numeroDossier(numeroDossier)
                .nom("Candidat").prenom(numeroDossier)
                .dateNaissance(LocalDate.of(2000, 1, 1))
                .telephone("70000000")
                .build());

        inscriptionRepository.save(Inscription.builder()
                .candidat(candidat)
                .categoriePermis(categorie)
                .site(site)
                .montantForfait(new BigDecimal("100000"))
                .dateInscription(LocalDate.now())
                .dateEcheance(LocalDate.now().plusMonths(8))
                .active(true)
                .numeroCycle(1)
                .etapeParcours(etape)
                .build());

        return candidat;
    }

    private void creerMoniteur(String username, Set<Site> sites, Set<TypeEpreuve> specialites) {
        Role roleMoniteur = roleRepository.findByCode(RoleEnum.MONITEUR)
                .orElseThrow(() -> new IllegalStateException("Rôle MONITEUR introuvable en base"));
        utilisateurRepository.save(Utilisateur.builder()
                .username(username)
                .email(username + "@example.local")
                .password(passwordEncoder.encode("mot-de-passe-de-test"))
                .nom("Test").prenom("Moniteur")
                .role(roleMoniteur)
                .sites(sites)
                .specialites(specialites)
                .actif(true)
                .build());
    }
}
