package com.autoecole;

import com.autoecole.dto.CodeDTOs.*;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.CodeConfiguration;
import com.autoecole.entity.CodeQuestion;
import com.autoecole.entity.CodeReponseTentative;
import com.autoecole.entity.CodeTentative;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.enums.LettreReponse;
import com.autoecole.entity.enums.StatutTentativeCode;
import com.autoecole.exception.BadRequestException;
import com.autoecole.repository.CodeQuestionRepository;
import com.autoecole.repository.CodeReponseTentativeRepository;
import com.autoecole.repository.CodeTentativeRepository;
import com.autoecole.service.CandidatAccessService;
import com.autoecole.service.CodeConfigurationService;
import com.autoecole.service.CodeService;
import com.autoecole.service.InscriptionService;
import com.autoecole.service.SiteAccessService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires du cœur métier du module Code de la route (cf. cahier des charges du module,
 * §2, §6 à §8, §14). CodeService est testé isolément (dépendances mockées), sans base de
 * données, dans le même esprit léger que BusinessRulesTest (logique métier pure).
 */
@ExtendWith(MockitoExtension.class)
class CodeServiceTest {

    @Mock
    private CodeConfigurationService configurationService;
    @Mock
    private CodeQuestionRepository questionRepository;
    @Mock
    private CodeTentativeRepository tentativeRepository;
    @Mock
    private CodeReponseTentativeRepository reponseRepository;
    @Mock
    private InscriptionService inscriptionService;
    @Mock
    private CandidatAccessService candidatAccessService;
    @Mock
    private SiteAccessService siteAccessService;

    @InjectMocks
    private CodeService codeService;

    // ---------- Fixtures ----------

    private CodeConfiguration configParDefaut() {
        CodeConfiguration c = new CodeConfiguration();
        c.setQuestionsParCycle(2);
        c.setSeuilReussite(2);
        c.setTempsParQuestionSecondes(30);
        c.setDureeMaxCycleSecondes(900);
        c.setTentativesMax(3);
        c.setRepriseAutoriseeApresEchec(true);
        c.setRetourQuestionPrecedenteAutorise(true);
        c.setCorrectionImmediate(false);
        c.setDeblocageAutomatiqueCycleSuivant(true);
        c.setDureeExpirationAccesJours(null);
        return c;
    }

    private CodeQuestion question(long id, int ordre) {
        return CodeQuestion.builder()
                .id(id).ordre(ordre).enonce("Question " + ordre)
                .reponseA("Bonne").reponseB("Mauvaise")
                .nombreOptions(2)
                .bonneReponses(LettreReponse.toCsv(Set.of(LettreReponse.A)))
                .actif(true)
                .build();
    }

    private Candidat candidat(long id) {
        return Candidat.builder().id(id).numeroDossier("DOS-TEST-" + id).nom("Nom").prenom("Prenom").build();
    }

    private Inscription inscription(Candidat c, LocalDate dateInscription, LocalDate dateEcheance) {
        return Inscription.builder().candidat(c).dateInscription(dateInscription).dateEcheance(dateEcheance).active(true).build();
    }

    private CodeTentative tentativeEnCours(long id, Candidat c, int numeroCycle, CodeConfiguration config,
                                            LocalDateTime dateDebut, LocalDateTime dateAffichageQuestion, int index) {
        return CodeTentative.builder()
                .id(id).candidat(c).numeroCycle(numeroCycle).numeroTentative(1)
                .dateDebut(dateDebut).dateAffichageQuestionCourante(dateAffichageQuestion)
                .indexQuestionCourante(index)
                .nbBonnesReponses(0).nbMauvaisesReponses(0)
                .statut(StatutTentativeCode.EN_COURS)
                .snapQuestionsParCycle(config.getQuestionsParCycle())
                .totalQuestionsCycle(config.getQuestionsParCycle())
                .snapSeuilReussite(config.getSeuilReussite())
                .snapTempsParQuestionSecondes(config.getTempsParQuestionSecondes())
                .snapDureeMaxCycleSecondes(config.getDureeMaxCycleSecondes())
                .snapTentativesMax(config.getTentativesMax())
                .snapRetourAutorise(config.isRetourQuestionPrecedenteAutorise())
                .snapCorrectionImmediate(config.isCorrectionImmediate())
                .build();
    }

    private void stubSaveTentativePassThrough() {
        when(tentativeRepository.save(any(CodeTentative.class))).thenAnswer(inv -> {
            CodeTentative t = inv.getArgument(0);
            if (t.getId() == null) t.setId(999L);
            return t;
        });
    }

    // ========================= 1. Calcul du nombre de Cycles =========================

    @Test
    @DisplayName("1. Nombre de Cycles : cas divisible exactement (4 questions / 2 par Cycle = 2 Cycles)")
    void testCalculNombreDeCyclesDivisible() {
        CodeConfiguration config = configParDefaut();
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2), question(3, 3), question(4, 4)));
        when(tentativeRepository.findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(anyLong(), anyInt()))
                .thenReturn(List.of());

        CodeProgressionDTO progression = codeService.getProgression(1L);

        assertEquals(2, progression.getTotalCycles());
    }

    @Test
    @DisplayName("1bis. Nombre de Cycles : cas NON divisible (5 questions / 2 par Cycle = 3 Cycles, dernier partiel)")
    void testCalculNombreDeCyclesNonDivisible() {
        CodeConfiguration config = configParDefaut();
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2), question(3, 3), question(4, 4), question(5, 5)));
        when(tentativeRepository.findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(anyLong(), anyInt()))
                .thenReturn(List.of());

        CodeProgressionDTO progression = codeService.getProgression(1L);

        assertEquals(3, progression.getTotalCycles());
        assertEquals(1, progression.getCycles().get(2).getNombreQuestions(), "Le dernier Cycle ne doit contenir que la question restante");
    }

    // ========================= 2. Répartition des questions par Cycle + 3. Ordre stable =========================

    @Test
    @DisplayName("2. Répartition : le Cycle 2 démarre bien à la 3e question (ordre stable, jamais recalculé par l'id)")
    void testRepartitionQuestionsParCycle() {
        CodeConfiguration config = configParDefaut(); // 2 questions par Cycle
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2), question(3, 3), question(4, 4)));
        when(tentativeRepository.existsByCandidatIdAndNumeroCycleAndStatut(1L, 1, StatutTentativeCode.REUSSI)).thenReturn(true);
        when(tentativeRepository.findByCandidatIdAndNumeroCycleAndStatut(1L, 2, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());
        when(tentativeRepository.findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(1L, 2)).thenReturn(List.of());
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = codeService.demarrerCycle(2);

        assertNotNull(etat.getEnCours());
        assertEquals(3, etat.getEnCours().getQuestion().getOrdre(), "Le Cycle 2 doit commencer à la question d'ordre 3");
    }

    @Test
    @DisplayName("3. Ordre stable : deux tentatives successives sur le même Cycle démarrent toujours par la même question")
    void testOrdreQuestionsJamaisMelange() {
        CodeConfiguration config = configParDefaut();
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2)));
        when(tentativeRepository.findByCandidatIdAndNumeroCycleAndStatut(1L, 1, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());
        when(tentativeRepository.findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(1L, 1))
                .thenReturn(List.of()) // 1ère tentative : aucun historique
                .thenReturn(List.of(mock(CodeTentative.class))); // 2e appel (reprise) : une tentative déjà passée
        stubSaveTentativePassThrough();

        EtatTentativeDTO premiere = codeService.demarrerCycle(1);
        EtatTentativeDTO seconde = codeService.demarrerCycle(1);

        assertEquals(1, premiere.getEnCours().getQuestion().getOrdre());
        assertEquals(1, seconde.getEnCours().getQuestion().getOrdre(), "La question de départ ne doit jamais varier d'une tentative à l'autre");
    }

    // ========================= 4. Calcul du score + 5. Seuil de réussite =========================

    @Test
    @DisplayName("4/5. Score calculé côté serveur et seuil atteint -> Cycle REUSSI")
    void testCalculScoreEtSeuilReussi() {
        CodeConfiguration config = configParDefaut(); // seuil = 2, 2 questions
        Candidat c = candidat(1L);
        CodeTentative tentative = tentativeEnCours(100L, c, 1, config, LocalDateTime.now(), LocalDateTime.now(), 0);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2)));
        stubSaveTentativePassThrough();
        when(tentativeRepository.countByCandidatIdAndNumeroCycle(1L, 1)).thenReturn(1L);

        EtatTentativeDTO apres1 = codeService.repondre(100L, Set.of(LettreReponse.A)); // correcte
        assertNotNull(apres1.getEnCours());

        EtatTentativeDTO apres2 = codeService.repondre(100L, Set.of(LettreReponse.A)); // correcte
        assertNotNull(apres2.getResultat());
        assertEquals(2, apres2.getResultat().getScore());
        assertEquals(StatutTentativeCode.REUSSI, apres2.getResultat().getStatut());
        assertTrue(apres2.getResultat().isReussi());
        assertTrue(apres2.getResultat().isCycleSuivantDebloque());
    }

    @Test
    @DisplayName("5bis. Seuil non atteint -> Cycle ECHEC")
    void testCalculScoreEtSeuilEchec() {
        CodeConfiguration config = configParDefaut(); // seuil = 2, 2 questions
        Candidat c = candidat(1L);
        CodeTentative tentative = tentativeEnCours(100L, c, 1, config, LocalDateTime.now(), LocalDateTime.now(), 0);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2)));
        stubSaveTentativePassThrough();
        when(tentativeRepository.countByCandidatIdAndNumeroCycle(1L, 1)).thenReturn(1L);

        codeService.repondre(100L, Set.of(LettreReponse.A));  // correcte
        EtatTentativeDTO resultat = codeService.repondre(100L, Set.of(LettreReponse.B)); // incorrecte (bonne réponse = A)

        assertNotNull(resultat.getResultat());
        assertEquals(1, resultat.getResultat().getScore());
        assertEquals(StatutTentativeCode.ECHEC, resultat.getResultat().getStatut());
        assertFalse(resultat.getResultat().isReussi());
        assertFalse(resultat.getResultat().isCycleSuivantDebloque());
    }

    // ========================= 6. Verrouillage / 7. Déblocage =========================

    @Test
    @DisplayName("6. Cycle verrouillé : impossible de démarrer le Cycle 2 sans avoir réussi le Cycle 1")
    void testCycleVerrouilleSansReussitePrecedente() {
        CodeConfiguration config = configParDefaut();
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2), question(3, 3), question(4, 4)));
        when(tentativeRepository.existsByCandidatIdAndNumeroCycleAndStatut(1L, 1, StatutTentativeCode.REUSSI)).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerCycle(2));
        assertTrue(ex.getMessage().contains("verrouillé"));
        verify(tentativeRepository, never()).save(any());
    }

    @Test
    @DisplayName("7. Déblocage : le Cycle 2 démarre normalement une fois le Cycle 1 réussi")
    void testCycleDeverrouilleApresReussite() {
        CodeConfiguration config = configParDefaut();
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2), question(3, 3), question(4, 4)));
        when(tentativeRepository.existsByCandidatIdAndNumeroCycleAndStatut(1L, 1, StatutTentativeCode.REUSSI)).thenReturn(true);
        when(tentativeRepository.findByCandidatIdAndNumeroCycleAndStatut(1L, 2, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());
        when(tentativeRepository.findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(1L, 2)).thenReturn(List.of());
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = assertDoesNotThrow(() -> codeService.demarrerCycle(2));
        assertNotNull(etat.getEnCours());
    }

    // ========================= 9. Reprise après échec =========================

    @Test
    @DisplayName("9. Reprise après échec autorisée par la configuration -> nouvelle tentative acceptée")
    void testRepriseApresEchecAutorisee() {
        CodeConfiguration config = configParDefaut();
        config.setRepriseAutoriseeApresEchec(true);
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2)));
        when(tentativeRepository.findByCandidatIdAndNumeroCycleAndStatut(1L, 1, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());

        CodeTentative echecPrecedent = tentativeEnCours(1L, c, 1, config, LocalDateTime.now(), LocalDateTime.now(), 2);
        echecPrecedent.setStatut(StatutTentativeCode.ECHEC);
        when(tentativeRepository.findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(1L, 1)).thenReturn(List.of(echecPrecedent));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = assertDoesNotThrow(() -> codeService.demarrerCycle(1));
        assertNotNull(etat.getEnCours());
        assertEquals(2, etat.getEnCours().getNumeroTentative(), "La reprise doit être la 2e tentative");
    }

    @Test
    @DisplayName("9bis. Reprise après échec INTERDITE par la configuration -> refusée")
    void testRepriseApresEchecInterdite() {
        CodeConfiguration config = configParDefaut();
        config.setRepriseAutoriseeApresEchec(false);
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2)));
        when(tentativeRepository.findByCandidatIdAndNumeroCycleAndStatut(1L, 1, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());

        CodeTentative echecPrecedent = tentativeEnCours(1L, c, 1, config, LocalDateTime.now(), LocalDateTime.now(), 2);
        echecPrecedent.setStatut(StatutTentativeCode.ECHEC);
        when(tentativeRepository.findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(1L, 1)).thenReturn(List.of(echecPrecedent));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerCycle(1));
        assertTrue(ex.getMessage().toLowerCase().contains("reprise"));
    }

    // ========================= 10. Nombre maximal de tentatives =========================

    @Test
    @DisplayName("10. Nombre maximal de tentatives atteint -> nouvelle tentative refusée, même si reprise autorisée")
    void testNombreMaximalTentativesAtteint() {
        CodeConfiguration config = configParDefaut();
        config.setTentativesMax(2);
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2)));
        when(tentativeRepository.findByCandidatIdAndNumeroCycleAndStatut(1L, 1, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());

        CodeTentative t1 = tentativeEnCours(1L, c, 1, config, LocalDateTime.now(), LocalDateTime.now(), 2);
        t1.setStatut(StatutTentativeCode.ECHEC);
        CodeTentative t2 = tentativeEnCours(2L, c, 1, config, LocalDateTime.now(), LocalDateTime.now(), 2);
        t2.setStatut(StatutTentativeCode.ECHEC);
        when(tentativeRepository.findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(1L, 1)).thenReturn(List.of(t1, t2));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerCycle(1));
        assertTrue(ex.getMessage().toLowerCase().contains("tentative"));
        verify(tentativeRepository, never()).save(any());
    }

    // ========================= 11. Chronomètre par question =========================

    @Test
    @DisplayName("11. Chronomètre par question dépassé -> réponse forcée à incorrecte côté serveur, même si la bonne réponse est envoyée")
    void testChronometreParQuestionExpireForceReponseIncorrecte() {
        CodeConfiguration config = configParDefaut(); // 30s par question
        Candidat c = candidat(1L);
        LocalDateTime maintenant = LocalDateTime.now();
        // Question affichée il y a 60s (> 30s autorisées), Cycle démarré aussi il y a 60s (< 900s max)
        CodeTentative tentative = tentativeEnCours(100L, c, 1, config, maintenant.minusSeconds(60), maintenant.minusSeconds(60), 0);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2)));
        stubSaveTentativePassThrough();

        codeService.repondre(100L, Set.of(LettreReponse.A)); // "A" est la bonne réponse, mais hors délai

        ArgumentCaptor<CodeReponseTentative> captor = ArgumentCaptor.forClass(CodeReponseTentative.class);
        verify(reponseRepository).save(captor.capture());
        assertFalse(captor.getValue().isCorrecte(), "Une réponse hors délai doit être comptée comme incorrecte, quelle que soit sa valeur");
        assertTrue(captor.getValue().getReponsesDonnees().isEmpty(), "La réponse hors délai ne doit pas être enregistrée comme si elle avait été donnée à temps");
    }

    // ========================= 12. Durée maximale du Cycle =========================

    @Test
    @DisplayName("12. Durée maximale du Cycle dépassée -> tentative automatiquement clôturée EXPIREE")
    void testDureeMaximaleCycleDepasseeForceExpiration() {
        CodeConfiguration config = configParDefaut(); // 900s max
        Candidat c = candidat(1L);
        LocalDateTime maintenant = LocalDateTime.now();
        CodeTentative tentative = tentativeEnCours(100L, c, 1, config, maintenant.minusSeconds(1000), maintenant.minusSeconds(10), 0);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        stubSaveTentativePassThrough();
        when(tentativeRepository.countByCandidatIdAndNumeroCycle(1L, 1)).thenReturn(1L);

        EtatTentativeDTO etat = codeService.getEtatTentative(100L);

        assertNotNull(etat.getResultat());
        assertEquals(StatutTentativeCode.EXPIREE, etat.getResultat().getStatut());
        assertFalse(etat.getResultat().isReussi());
    }

    // ========================= 13/14. Les trois expirations distinctes (§14) =========================

    @Test
    @DisplayName("13. Inscription expirée (8 mois) -> accès au Cycle refusé, message spécifique à l'inscription")
    void testInscriptionExpireeBloqueDemarrage() {
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusMonths(9), LocalDate.now().minusMonths(1))); // échéance dépassée

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerCycle(1));
        assertTrue(ex.getMessage().toLowerCase().contains("inscription"));
        verifyNoInteractions(questionRepository);
    }

    @Test
    @DisplayName("14. Expiration propre au module Code (indépendante d'une inscription encore valide) -> accès refusé")
    void testExpirationAccesModuleCodeBloqueDemarrageMemeSiInscriptionValide() {
        CodeConfiguration config = configParDefaut();
        config.setDureeExpirationAccesJours(30); // accès Code fermé 30 jours après l'inscription
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        // Inscription toujours valide (échéance dans 6 mois) mais vieille de 40 jours -> accès Code expiré
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(40), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerCycle(1));
        assertTrue(ex.getMessage().toLowerCase().contains("code"));
        verifyNoInteractions(questionRepository);
    }

    // ========================= 15. Historique =========================

    @Test
    @DisplayName("15. Historique : toutes les tentatives sont restituées, dans l'ordre renvoyé par le dépôt")
    void testHistoriqueOrdonneEtComplet() {
        Candidat c = candidat(1L);
        CodeTentative t1 = CodeTentative.builder().id(1L).candidat(c).numeroCycle(1).numeroTentative(1)
                .dateDebut(LocalDateTime.now().minusDays(2)).dateFin(LocalDateTime.now().minusDays(2))
                .score(20).totalQuestionsCycle(30).statut(StatutTentativeCode.ECHEC).build();
        CodeTentative t2 = CodeTentative.builder().id(2L).candidat(c).numeroCycle(1).numeroTentative(2)
                .dateDebut(LocalDateTime.now().minusDays(1)).dateFin(LocalDateTime.now().minusDays(1))
                .score(26).totalQuestionsCycle(30).statut(StatutTentativeCode.REUSSI).build();

        when(tentativeRepository.findByCandidatIdOrderByDateDebutDesc(1L)).thenReturn(List.of(t2, t1));

        List<CodeHistoriqueLigneDTO> historique = codeService.getHistorique(1L);

        assertEquals(2, historique.size());
        assertEquals(2, historique.get(0).getNumeroTentative());
        assertEquals(StatutTentativeCode.REUSSI, historique.get(0).getStatut());
        assertEquals(1, historique.get(1).getNumeroTentative());
        assertEquals(StatutTentativeCode.ECHEC, historique.get(1).getStatut());
    }

    // ========================= 17. Contournement des règles par l'API =========================

    @Test
    @DisplayName("17. Impossible de démarrer un numéro de Cycle inexistant en appelant directement l'API")
    void testDemarrerCycleInvalideRefuse() {
        CodeConfiguration config = configParDefaut();
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2))); // 1 seul Cycle possible

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerCycle(5));
        assertTrue(ex.getMessage().toLowerCase().contains("cycle"));
        verify(tentativeRepository, never()).save(any());
    }

    // ========================= Correction immédiate (§5/§6 du cahier des charges du module) =========================

    @Test
    @DisplayName("Correction immédiate activée + réponse correcte : correcte=true, bonne réponse et explication renvoyées")
    void testCorrectionImmediateReponseCorrecte() {
        CodeConfiguration config = configParDefaut();
        config.setCorrectionImmediate(true);
        Candidat c = candidat(1L);
        CodeTentative tentative = tentativeEnCours(100L, c, 1, config, LocalDateTime.now(), LocalDateTime.now(), 0);
        CodeQuestion question = questionAvecExplication(1, "Explication de la question 1");

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findByActifTrueOrderByOrdreAsc()).thenReturn(List.of(question, question(2, 2)));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = codeService.repondre(100L, Set.of(LettreReponse.A));

        assertNotNull(etat.getCorrection(), "La correction doit être renvoyée quand correctionImmediate est active pour cette tentative");
        assertTrue(etat.getCorrection().isCorrecte());
        assertEquals(Set.of(LettreReponse.A), etat.getCorrection().getBonnesReponses());
        assertEquals("Explication de la question 1", etat.getCorrection().getExplication());
    }

    @Test
    @DisplayName("Correction immédiate activée + réponse incorrecte : correcte=false, bonne réponse et explication renvoyées")
    void testCorrectionImmediateReponseIncorrecte() {
        CodeConfiguration config = configParDefaut();
        config.setCorrectionImmediate(true);
        Candidat c = candidat(1L);
        CodeTentative tentative = tentativeEnCours(100L, c, 1, config, LocalDateTime.now(), LocalDateTime.now(), 0);
        CodeQuestion question = questionAvecExplication(1, "Explication de la question 1");

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findByActifTrueOrderByOrdreAsc()).thenReturn(List.of(question, question(2, 2)));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = codeService.repondre(100L, Set.of(LettreReponse.B)); // bonne réponse = A

        assertNotNull(etat.getCorrection());
        assertFalse(etat.getCorrection().isCorrecte());
        assertEquals(Set.of(LettreReponse.A), etat.getCorrection().getBonnesReponses());
        assertEquals("Explication de la question 1", etat.getCorrection().getExplication());
    }

    @Test
    @DisplayName("Correction immédiate désactivée : aucune correction n'est renvoyée (comportement normal conservé)")
    void testCorrectionImmediateDesactiveeNeRenvoieRien() {
        CodeConfiguration config = configParDefaut();
        config.setCorrectionImmediate(false);
        Candidat c = candidat(1L);
        CodeTentative tentative = tentativeEnCours(100L, c, 1, config, LocalDateTime.now(), LocalDateTime.now(), 0);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2)));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = codeService.repondre(100L, Set.of(LettreReponse.A));

        assertNull(etat.getCorrection(), "Aucune correction ne doit être renvoyée si le paramètre est désactivé pour cette tentative");
    }

    @Test
    @DisplayName("La correction respecte le snapshot figé de la tentative, jamais la configuration courante (deux tentatives, deux snapshots différents)")
    void testCorrectionUtiliseLeSnapshotDeLaTentative() {
        Candidat c = candidat(1L);

        CodeConfiguration configAvecCorrection = configParDefaut();
        configAvecCorrection.setCorrectionImmediate(true);
        CodeTentative tentativeAvecCorrection = tentativeEnCours(100L, c, 1, configAvecCorrection, LocalDateTime.now(), LocalDateTime.now(), 0);

        CodeConfiguration configSansCorrection = configParDefaut();
        configSansCorrection.setCorrectionImmediate(false);
        CodeTentative tentativeSansCorrection = tentativeEnCours(101L, c, 1, configSansCorrection, LocalDateTime.now(), LocalDateTime.now(), 0);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentativeAvecCorrection));
        when(tentativeRepository.findById(101L)).thenReturn(Optional.of(tentativeSansCorrection));
        when(questionRepository.findByActifTrueOrderByOrdreAsc())
                .thenReturn(List.of(question(1, 1), question(2, 2)));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etatAvecCorrection = codeService.repondre(100L, Set.of(LettreReponse.A));
        EtatTentativeDTO etatSansCorrection = codeService.repondre(101L, Set.of(LettreReponse.A));

        assertNotNull(etatAvecCorrection.getCorrection(), "Snapshot figé à true pour cette tentative : la correction doit apparaître");
        assertNull(etatSansCorrection.getCorrection(), "Snapshot figé à false pour cette tentative : aucune correction, même config globale par ailleurs");
        verifyNoInteractions(configurationService);
    }

    private CodeQuestion questionAvecExplication(int ordre, String explication) {
        return CodeQuestion.builder()
                .id((long) ordre).ordre(ordre).enonce("Question " + ordre)
                .reponseA("Bonne").reponseB("Mauvaise")
                .nombreOptions(2)
                .bonneReponses(LettreReponse.toCsv(Set.of(LettreReponse.A)))
                .explication(explication)
                .actif(true)
                .build();
    }
}
