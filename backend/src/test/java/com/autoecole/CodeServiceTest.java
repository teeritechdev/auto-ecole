package com.autoecole;

import com.autoecole.dto.CodeDTOs.*;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.CodeConfiguration;
import com.autoecole.entity.CodeQuestion;
import com.autoecole.entity.CodeReponseTentative;
import com.autoecole.entity.CodeTentative;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.SerieCode;
import com.autoecole.entity.enums.LettreReponse;
import com.autoecole.entity.enums.StatutTentativeCode;
import com.autoecole.exception.BadRequestException;
import com.autoecole.repository.CodeQuestionRepository;
import com.autoecole.repository.CodeReponseTentativeRepository;
import com.autoecole.repository.CodeTentativeRepository;
import com.autoecole.repository.SerieCodeRepository;
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
 * données, dans le même esprit léger que BusinessRulesTest (logique métier pure). Les séries
 * sont créées librement par l'ADMIN (pas de découpage calculé) : chaque test attache
 * explicitement ses questions à la série testée.
 */
@ExtendWith(MockitoExtension.class)
class CodeServiceTest {

    @Mock
    private CodeConfigurationService configurationService;
    @Mock
    private CodeQuestionRepository questionRepository;
    @Mock
    private SerieCodeRepository serieRepository;
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
        c.setSeuilReussite(2);
        c.setTempsParQuestionSecondes(30);
        c.setDureeMaxSerieSecondes(900);
        c.setRepriseAutoriseeApresEchec(true);
        c.setRetourQuestionPrecedenteAutorise(true);
        c.setCorrectionImmediate(false);
        c.setDeblocageAutomatiqueSerieSuivante(true);
        c.setDureeExpirationAccesJours(null);
        return c;
    }

    private SerieCode serie(long id, String nom, int ordre) {
        return SerieCode.builder().id(id).nom(nom).ordre(ordre).actif(true).build();
    }

    private CodeQuestion question(SerieCode serie, long id, int ordre) {
        return CodeQuestion.builder()
                .id(id).serie(serie).ordre(ordre).enonce("Question " + ordre)
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

    private CodeTentative tentativeEnCours(long id, Candidat c, SerieCode serie, CodeConfiguration config,
                                            LocalDateTime dateDebut, LocalDateTime dateAffichageQuestion, int index, int totalQuestions) {
        return CodeTentative.builder()
                .id(id).candidat(c).serie(serie).numeroTentative(1)
                .dateDebut(dateDebut).dateAffichageQuestionCourante(dateAffichageQuestion)
                .indexQuestionCourante(index)
                .nbBonnesReponses(0).nbMauvaisesReponses(0)
                .statut(StatutTentativeCode.EN_COURS)
                .totalQuestionsSerie(totalQuestions)
                .snapSeuilReussite(config.getSeuilReussite())
                .snapTempsParQuestionSecondes(config.getTempsParQuestionSecondes())
                .snapDureeMaxSerieSecondes(config.getDureeMaxSerieSecondes())
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

    // ========================= 1. Progression reflète les séries actives =========================

    @Test
    @DisplayName("1. Progression : chaque série active apparaît avec son propre nombre de questions assignées")
    void testProgressionRefleteLesSeriesActives() {
        CodeConfiguration config = configParDefaut();
        SerieCode s1 = serie(1L, "Série 1", 1);
        SerieCode s2 = serie(2L, "Série 2", 2);
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(serieRepository.findByActifTrueOrderByOrdreAsc()).thenReturn(List.of(s1, s2));
        when(questionRepository.countBySerieId(1L)).thenReturn(4L);
        when(questionRepository.countBySerieId(2L)).thenReturn(1L);
        when(tentativeRepository.findByCandidatIdAndSerieIdOrderByNumeroTentativeAsc(anyLong(), anyLong()))
                .thenReturn(List.of());

        CodeProgressionDTO progression = codeService.getProgression(1L);

        assertEquals(2, progression.getTotalSeries());
        assertEquals(4, progression.getSeries().get(0).getNombreQuestions());
        assertEquals(1, progression.getSeries().get(1).getNombreQuestions(), "Chaque série garde son propre nombre de questions, indépendamment des autres");
    }

    // ========================= 2. Indépendance des questions entre séries + 3. Ordre stable =========================

    @Test
    @DisplayName("2. Indépendance : la série 2 démarre sur SA propre première question, distincte de celles de la série 1")
    void testIndependanceQuestionsEntreSeries() {
        CodeConfiguration config = configParDefaut();
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        SerieCode s2 = serie(2L, "Série 2", 2);
        CodeQuestion questionSerie2 = question(s2, 10L, 1);

        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(serieRepository.findById(2L)).thenReturn(Optional.of(s2));
        when(serieRepository.findByActifTrueOrderByOrdreAsc()).thenReturn(List.of(s1, s2));
        when(tentativeRepository.existsByCandidatIdAndSerieIdAndStatut(1L, 1L, StatutTentativeCode.REUSSI)).thenReturn(true);
        when(tentativeRepository.findByCandidatIdAndSerieIdAndStatut(1L, 2L, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());
        when(tentativeRepository.findByCandidatIdAndSerieIdOrderByNumeroTentativeAsc(1L, 2L)).thenReturn(List.of());
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(2L)).thenReturn(List.of(questionSerie2));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = codeService.demarrerSerie(2L);

        assertNotNull(etat.getEnCours());
        assertEquals("Série 2", etat.getEnCours().getSerieNom());
        assertEquals(1, etat.getEnCours().getQuestion().getOrdre(), "La série 2 a sa propre numérotation locale, indépendante de la série 1");
    }

    @Test
    @DisplayName("3. Ordre stable : deux tentatives successives sur la même série démarrent toujours par la même question")
    void testOrdreQuestionsJamaisMelange() {
        CodeConfiguration config = configParDefaut();
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(serieRepository.findById(1L)).thenReturn(Optional.of(s1));
        when(serieRepository.findByActifTrueOrderByOrdreAsc()).thenReturn(List.of(s1));
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(1L))
                .thenReturn(List.of(question(s1, 1L, 1), question(s1, 2L, 2)));
        when(tentativeRepository.findByCandidatIdAndSerieIdAndStatut(1L, 1L, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());
        when(tentativeRepository.findByCandidatIdAndSerieIdOrderByNumeroTentativeAsc(1L, 1L))
                .thenReturn(List.of()) // 1ère tentative : aucun historique
                .thenReturn(List.of(mock(CodeTentative.class))); // 2e appel (reprise) : une tentative déjà passée
        stubSaveTentativePassThrough();

        EtatTentativeDTO premiere = codeService.demarrerSerie(1L);
        EtatTentativeDTO seconde = codeService.demarrerSerie(1L);

        assertEquals(1, premiere.getEnCours().getQuestion().getOrdre());
        assertEquals(1, seconde.getEnCours().getQuestion().getOrdre(), "La question de départ ne doit jamais varier d'une tentative à l'autre");
    }

    // ========================= 4. Calcul du score + 5. Seuil de réussite =========================

    @Test
    @DisplayName("4/5. Score calculé côté serveur et seuil atteint -> série REUSSIE")
    void testCalculScoreEtSeuilReussi() {
        CodeConfiguration config = configParDefaut(); // seuil = 2, 2 questions
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        CodeTentative tentative = tentativeEnCours(100L, c, s1, config, LocalDateTime.now(), LocalDateTime.now(), 0, 2);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(1L))
                .thenReturn(List.of(question(s1, 1L, 1), question(s1, 2L, 2)));
        stubSaveTentativePassThrough();
        when(configurationService.getConfigurationEntity()).thenReturn(config);

        EtatTentativeDTO apres1 = codeService.repondre(100L, Set.of(LettreReponse.A)); // correcte
        assertNotNull(apres1.getEnCours());

        EtatTentativeDTO apres2 = codeService.repondre(100L, Set.of(LettreReponse.A)); // correcte
        assertNotNull(apres2.getResultat());
        assertEquals(2, apres2.getResultat().getScore());
        assertEquals(StatutTentativeCode.REUSSI, apres2.getResultat().getStatut());
        assertTrue(apres2.getResultat().isReussi());
        assertTrue(apres2.getResultat().isSerieSuivanteDebloquee());
    }

    @Test
    @DisplayName("5bis. Seuil non atteint -> série ECHEC")
    void testCalculScoreEtSeuilEchec() {
        CodeConfiguration config = configParDefaut(); // seuil = 2, 2 questions
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        CodeTentative tentative = tentativeEnCours(100L, c, s1, config, LocalDateTime.now(), LocalDateTime.now(), 0, 2);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(1L))
                .thenReturn(List.of(question(s1, 1L, 1), question(s1, 2L, 2)));
        stubSaveTentativePassThrough();
        // etatDepuisTentativeTerminee() lit isRepriseAutoriseeApresEchec() depuis la config
        when(configurationService.getConfigurationEntity()).thenReturn(config);

        codeService.repondre(100L, Set.of(LettreReponse.A));  // correcte
        EtatTentativeDTO resultat = codeService.repondre(100L, Set.of(LettreReponse.B)); // incorrecte (bonne réponse = A)

        assertNotNull(resultat.getResultat());
        assertEquals(1, resultat.getResultat().getScore());
        assertEquals(StatutTentativeCode.ECHEC, resultat.getResultat().getStatut());
        assertFalse(resultat.getResultat().isReussi());
        assertFalse(resultat.getResultat().isSerieSuivanteDebloquee());
    }

    // ========================= 6. Verrouillage / 7. Déblocage =========================

    @Test
    @DisplayName("6. Série verrouillée : impossible de démarrer la série 2 sans avoir réussi la série 1")
    void testSerieVerrouilleeSansReussitePrecedente() {
        CodeConfiguration config = configParDefaut();
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        SerieCode s2 = serie(2L, "Série 2", 2);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(serieRepository.findById(2L)).thenReturn(Optional.of(s2));
        when(serieRepository.findByActifTrueOrderByOrdreAsc()).thenReturn(List.of(s1, s2));
        when(tentativeRepository.existsByCandidatIdAndSerieIdAndStatut(1L, 1L, StatutTentativeCode.REUSSI)).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerSerie(2L));
        assertTrue(ex.getMessage().contains("verrouillée"));
        verify(tentativeRepository, never()).save(any());
    }

    @Test
    @DisplayName("7. Déblocage : la série 2 démarre normalement une fois la série 1 réussie")
    void testSerieDeverrouilleeApresReussite() {
        CodeConfiguration config = configParDefaut();
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        SerieCode s2 = serie(2L, "Série 2", 2);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(serieRepository.findById(2L)).thenReturn(Optional.of(s2));
        when(serieRepository.findByActifTrueOrderByOrdreAsc()).thenReturn(List.of(s1, s2));
        when(tentativeRepository.existsByCandidatIdAndSerieIdAndStatut(1L, 1L, StatutTentativeCode.REUSSI)).thenReturn(true);
        when(tentativeRepository.findByCandidatIdAndSerieIdAndStatut(1L, 2L, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());
        when(tentativeRepository.findByCandidatIdAndSerieIdOrderByNumeroTentativeAsc(1L, 2L)).thenReturn(List.of());
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(2L)).thenReturn(List.of(question(s2, 10L, 1)));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = assertDoesNotThrow(() -> codeService.demarrerSerie(2L));
        assertNotNull(etat.getEnCours());
    }

    // ========================= 9. Reprise après échec =========================

    @Test
    @DisplayName("9. Reprise après échec autorisée par la configuration -> nouvelle tentative acceptée")
    void testRepriseApresEchecAutorisee() {
        CodeConfiguration config = configParDefaut();
        config.setRepriseAutoriseeApresEchec(true);
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(serieRepository.findById(1L)).thenReturn(Optional.of(s1));
        when(serieRepository.findByActifTrueOrderByOrdreAsc()).thenReturn(List.of(s1));
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(1L))
                .thenReturn(List.of(question(s1, 1L, 1), question(s1, 2L, 2)));
        when(tentativeRepository.findByCandidatIdAndSerieIdAndStatut(1L, 1L, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());

        CodeTentative echecPrecedent = tentativeEnCours(1L, c, s1, config, LocalDateTime.now(), LocalDateTime.now(), 2, 2);
        echecPrecedent.setStatut(StatutTentativeCode.ECHEC);
        when(tentativeRepository.findByCandidatIdAndSerieIdOrderByNumeroTentativeAsc(1L, 1L)).thenReturn(List.of(echecPrecedent));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = assertDoesNotThrow(() -> codeService.demarrerSerie(1L));
        assertNotNull(etat.getEnCours());
        assertEquals(2, etat.getEnCours().getNumeroTentative(), "La reprise doit être la 2e tentative");
    }

    @Test
    @DisplayName("9bis. Reprise après échec INTERDITE par la configuration -> refusée")
    void testRepriseApresEchecInterdite() {
        CodeConfiguration config = configParDefaut();
        config.setRepriseAutoriseeApresEchec(false);
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(config);
        when(serieRepository.findById(1L)).thenReturn(Optional.of(s1));
        when(serieRepository.findByActifTrueOrderByOrdreAsc()).thenReturn(List.of(s1));
        when(tentativeRepository.findByCandidatIdAndSerieIdAndStatut(1L, 1L, StatutTentativeCode.EN_COURS)).thenReturn(Optional.empty());

        CodeTentative echecPrecedent = tentativeEnCours(1L, c, s1, config, LocalDateTime.now(), LocalDateTime.now(), 2, 2);
        echecPrecedent.setStatut(StatutTentativeCode.ECHEC);
        when(tentativeRepository.findByCandidatIdAndSerieIdOrderByNumeroTentativeAsc(1L, 1L)).thenReturn(List.of(echecPrecedent));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerSerie(1L));
        assertTrue(ex.getMessage().toLowerCase().contains("reprise"));
    }

    // ========================= 10. (Feature supprimée) =========================
    // Le nombre maximal de tentatives (tentativesMax) a été retiré de CodeConfiguration :
    // il n'y a plus de limite de tentatives, seule la config "repriseAutoriseeApresEchec" contrôle
    // si un candidat peut relancer une série après échec. Le test correspondant est donc obsolète.

    // ========================= 11. Chronomètre par question =========================

    @Test
    @DisplayName("11. Chronomètre par question dépassé -> réponse forcée à incorrecte côté serveur, même si la bonne réponse est envoyée")
    void testChronometreParQuestionExpireForceReponseIncorrecte() {
        CodeConfiguration config = configParDefaut(); // 30s par question
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        LocalDateTime maintenant = LocalDateTime.now();
        // Question affichée il y a 60s (> 30s autorisées), série démarrée aussi il y a 60s (< 900s max)
        CodeTentative tentative = tentativeEnCours(100L, c, s1, config, maintenant.minusSeconds(60), maintenant.minusSeconds(60), 0, 2);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(1L))
                .thenReturn(List.of(question(s1, 1L, 1), question(s1, 2L, 2)));
        stubSaveTentativePassThrough();

        codeService.repondre(100L, Set.of(LettreReponse.A)); // "A" est la bonne réponse, mais hors délai

        ArgumentCaptor<CodeReponseTentative> captor = ArgumentCaptor.forClass(CodeReponseTentative.class);
        verify(reponseRepository).save(captor.capture());
        assertFalse(captor.getValue().isCorrecte(), "Une réponse hors délai doit être comptée comme incorrecte, quelle que soit sa valeur");
        assertTrue(captor.getValue().getReponsesDonnees().isEmpty(), "La réponse hors délai ne doit pas être enregistrée comme si elle avait été donnée à temps");
    }

    // ========================= 12. Durée maximale de la série =========================

    @Test
    @DisplayName("12. Durée maximale de la série dépassée -> tentative automatiquement clôturée EXPIREE")
    void testDureeMaximaleSerieDepasseeForceExpiration() {
        CodeConfiguration config = configParDefaut(); // 900s max
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        LocalDateTime maintenant = LocalDateTime.now();
        CodeTentative tentative = tentativeEnCours(100L, c, s1, config, maintenant.minusSeconds(1000), maintenant.minusSeconds(10), 0, 2);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        stubSaveTentativePassThrough();
        // finaliser() → etatDepuisTentativeTerminee() lit isRepriseAutoriseeApresEchec() depuis la config
        when(configurationService.getConfigurationEntity()).thenReturn(config);

        EtatTentativeDTO etat = codeService.getEtatTentative(100L);

        assertNotNull(etat.getResultat());
        assertEquals(StatutTentativeCode.EXPIREE, etat.getResultat().getStatut());
        assertFalse(etat.getResultat().isReussi());
    }

    // ========================= 13/14. Les trois expirations distinctes (§14) =========================

    @Test
    @DisplayName("13. Inscription expirée (8 mois) -> accès à la série refusé, message spécifique à l'inscription")
    void testInscriptionExpireeBloqueDemarrage() {
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusMonths(9), LocalDate.now().minusMonths(1))); // échéance dépassée

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerSerie(1L));
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

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerSerie(1L));
        assertTrue(ex.getMessage().toLowerCase().contains("code"));
        verifyNoInteractions(questionRepository);
    }

    // ========================= 15. Historique =========================

    @Test
    @DisplayName("15. Historique : toutes les tentatives sont restituées, dans l'ordre renvoyé par le dépôt")
    void testHistoriqueOrdonneEtComplet() {
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        CodeTentative t1 = CodeTentative.builder().id(1L).candidat(c).serie(s1).numeroTentative(1)
                .dateDebut(LocalDateTime.now().minusDays(2)).dateFin(LocalDateTime.now().minusDays(2))
                .score(20).totalQuestionsSerie(30).statut(StatutTentativeCode.ECHEC).build();
        CodeTentative t2 = CodeTentative.builder().id(2L).candidat(c).serie(s1).numeroTentative(2)
                .dateDebut(LocalDateTime.now().minusDays(1)).dateFin(LocalDateTime.now().minusDays(1))
                .score(26).totalQuestionsSerie(30).statut(StatutTentativeCode.REUSSI).build();

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
    @DisplayName("17. Impossible de démarrer une série inexistante ou inactive en appelant directement l'API")
    void testDemarrerSerieInvalideRefuse() {
        Candidat c = candidat(1L);
        when(candidatAccessService.getCandidatCourant()).thenReturn(c);
        when(inscriptionService.getInscriptionActive(1L))
                .thenReturn(inscription(c, LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6)));
        when(configurationService.getConfigurationEntity()).thenReturn(configParDefaut());
        when(serieRepository.findById(999L)).thenReturn(Optional.empty());

        BadRequestException ex = assertThrows(BadRequestException.class, () -> codeService.demarrerSerie(999L));
        assertTrue(ex.getMessage().toLowerCase().contains("série"));
        verify(tentativeRepository, never()).save(any());
    }

    // ========================= Correction immédiate (§5/§6 du cahier des charges du module) =========================

    @Test
    @DisplayName("Correction immédiate activée + réponse correcte : correcte=true, bonne réponse et explication renvoyées")
    void testCorrectionImmediateReponseCorrecte() {
        CodeConfiguration config = configParDefaut();
        config.setCorrectionImmediate(true);
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);
        CodeTentative tentative = tentativeEnCours(100L, c, s1, config, LocalDateTime.now(), LocalDateTime.now(), 0, 2);
        CodeQuestion question = questionAvecExplication(s1, 1, "Explication de la question 1");

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(1L)).thenReturn(List.of(question, question(s1, 2L, 2)));
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
        SerieCode s1 = serie(1L, "Série 1", 1);
        CodeTentative tentative = tentativeEnCours(100L, c, s1, config, LocalDateTime.now(), LocalDateTime.now(), 0, 2);
        CodeQuestion question = questionAvecExplication(s1, 1, "Explication de la question 1");

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(1L)).thenReturn(List.of(question, question(s1, 2L, 2)));
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
        SerieCode s1 = serie(1L, "Série 1", 1);
        CodeTentative tentative = tentativeEnCours(100L, c, s1, config, LocalDateTime.now(), LocalDateTime.now(), 0, 2);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentative));
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(1L))
                .thenReturn(List.of(question(s1, 1L, 1), question(s1, 2L, 2)));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etat = codeService.repondre(100L, Set.of(LettreReponse.A));

        assertNull(etat.getCorrection(), "Aucune correction ne doit être renvoyée si le paramètre est désactivé pour cette tentative");
    }

    @Test
    @DisplayName("La correction respecte le snapshot figé de la tentative, jamais la configuration courante (deux tentatives, deux snapshots différents)")
    void testCorrectionUtiliseLeSnapshotDeLaTentative() {
        Candidat c = candidat(1L);
        SerieCode s1 = serie(1L, "Série 1", 1);

        CodeConfiguration configAvecCorrection = configParDefaut();
        configAvecCorrection.setCorrectionImmediate(true);
        CodeTentative tentativeAvecCorrection = tentativeEnCours(100L, c, s1, configAvecCorrection, LocalDateTime.now(), LocalDateTime.now(), 0, 2);

        CodeConfiguration configSansCorrection = configParDefaut();
        configSansCorrection.setCorrectionImmediate(false);
        CodeTentative tentativeSansCorrection = tentativeEnCours(101L, c, s1, configSansCorrection, LocalDateTime.now(), LocalDateTime.now(), 0, 2);

        when(tentativeRepository.findById(100L)).thenReturn(Optional.of(tentativeAvecCorrection));
        when(tentativeRepository.findById(101L)).thenReturn(Optional.of(tentativeSansCorrection));
        when(questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(1L))
                .thenReturn(List.of(question(s1, 1L, 1), question(s1, 2L, 2)));
        stubSaveTentativePassThrough();

        EtatTentativeDTO etatAvecCorrection = codeService.repondre(100L, Set.of(LettreReponse.A));
        EtatTentativeDTO etatSansCorrection = codeService.repondre(101L, Set.of(LettreReponse.A));

        assertNotNull(etatAvecCorrection.getCorrection(), "Snapshot figé à true pour cette tentative : la correction doit apparaître");
        assertNull(etatSansCorrection.getCorrection(), "Snapshot figé à false pour cette tentative : aucune correction, même config globale par ailleurs");
        verifyNoInteractions(configurationService);
    }

    private CodeQuestion questionAvecExplication(SerieCode serie, int ordre, String explication) {
        return CodeQuestion.builder()
                .id((long) ordre).serie(serie).ordre(ordre).enonce("Question " + ordre)
                .reponseA("Bonne").reponseB("Mauvaise")
                .nombreOptions(2)
                .bonneReponses(LettreReponse.toCsv(Set.of(LettreReponse.A)))
                .explication(explication)
                .actif(true)
                .build();
    }
}
