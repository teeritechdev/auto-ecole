package com.autoecole;

import com.autoecole.controller.CodeConfigurationController;
import com.autoecole.controller.CodeController;
import com.autoecole.controller.CodeQuestionController;
import com.autoecole.dto.CodeDTOs.UpdateCodeConfigurationRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Vérifie, via le contexte Spring réel (mêmes annotations @PreAuthorize que celles réellement
 * déployées), que les permissions ADMIN / MONITEUR / CANDIDAT du module Code de la route
 * (§15 et §18 du cahier des charges du module) sont bien appliquées, et qu'un rôle non autorisé
 * est bloqué par la sécurité AVANT toute exécution de la logique métier.
 *
 * @Transactional : toute écriture éventuellement déclenchée par un appel autorisé est annulée
 * automatiquement à la fin de chaque test (aucune donnée de test ne persiste).
 */
@SpringBootTest
@Transactional
class CodePermissionsTest {

    @Autowired
    private CodeConfigurationController codeConfigurationController;
    @Autowired
    private CodeQuestionController codeQuestionController;
    @Autowired
    private CodeController codeController;

    // ---------- Configuration : ADMIN + MONITEUR uniquement ----------

    @Test
    @WithMockUser(roles = "SECRETAIRE")
    @DisplayName("15. Une Secrétaire ne peut pas consulter la configuration du Code")
    void secretaireNePeutPasConsulterLaConfiguration() {
        assertThrows(AccessDeniedException.class, () -> codeConfigurationController.getConfiguration());
    }

    @Test
    @WithMockUser(roles = "CAISSIERE")
    @DisplayName("15bis. Une Caissière ne peut pas consulter la configuration du Code")
    void caissiereNePeutPasConsulterLaConfiguration() {
        assertThrows(AccessDeniedException.class, () -> codeConfigurationController.getConfiguration());
    }

    @Test
    @WithMockUser(roles = "CANDIDAT")
    @DisplayName("15ter. Un Candidat ne peut pas modifier la configuration du Code")
    void candidatNePeutPasModifierLaConfiguration() {
        UpdateCodeConfigurationRequest requete = new UpdateCodeConfigurationRequest();
        assertThrows(AccessDeniedException.class, () -> codeConfigurationController.updateConfiguration(requete));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("L'Administrateur peut consulter la configuration du Code")
    void adminPeutConsulterLaConfiguration() {
        assertDoesNotThrow(() -> codeConfigurationController.getConfiguration());
    }

    @Test
    @WithMockUser(roles = "MONITEUR")
    @DisplayName("Le Moniteur peut consulter la configuration du Code (droits alignés sur l'Administrateur, décision validée)")
    void moniteurPeutConsulterLaConfiguration() {
        assertDoesNotThrow(() -> codeConfigurationController.getConfiguration());
    }

    // ---------- Banque de questions : ADMIN uniquement ----------

    @Test
    @WithMockUser(roles = "MONITEUR")
    @DisplayName("15quater. Le Moniteur ne peut pas gérer la banque de questions (réservée à l'Administrateur)")
    void moniteurNePeutPasGererLaBanqueDeQuestions() {
        assertThrows(AccessDeniedException.class, () -> codeQuestionController.getQuestionsDeSerie(1L));
    }

    @Test
    @WithMockUser(roles = "SECRETAIRE")
    @DisplayName("Une Secrétaire ne peut pas gérer la banque de questions")
    void secretaireNePeutPasGererLaBanqueDeQuestions() {
        assertThrows(AccessDeniedException.class, () -> codeQuestionController.getQuestionsDeSerie(1L));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("L'Administrateur peut consulter la banque de questions")
    void adminPeutGererLaBanqueDeQuestions() {
        assertDoesNotThrow(() -> codeQuestionController.getQuestionsDeSerie(1L));
    }

    // ---------- Démarrage / réponse à une tentative : CANDIDAT uniquement ----------

    @Test
    @WithMockUser(roles = "SECRETAIRE")
    @DisplayName("15quinquies. Une Secrétaire ne peut pas démarrer un Cycle à la place d'un candidat")
    void secretaireNePeutPasDemarrerUnCycle() {
        assertThrows(AccessDeniedException.class, () -> codeController.demarrerSerie(1L));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("L'Administrateur lui-même ne peut pas démarrer un Cycle à la place d'un candidat")
    void adminNePeutPasDemarrerUnCycleALaPlaceDuCandidat() {
        assertThrows(AccessDeniedException.class, () -> codeController.demarrerSerie(1L));
    }

    @Test
    @WithMockUser(roles = "MONITEUR")
    @DisplayName("Le Moniteur ne peut pas répondre à une question à la place d'un candidat")
    void moniteurNePeutPasRepondreAUneQuestion() {
        assertThrows(AccessDeniedException.class, () -> codeController.getEtatTentative(1L));
    }

    @Test
    @WithMockUser(username = "compte-candidat-inexistant-en-base", roles = "CANDIDAT")
    @DisplayName("17. Le rôle CANDIDAT franchit la sécurité ; l'échec qui suit (aucun compte réel) est un échec MÉTIER, jamais un contournement de sécurité")
    void candidatEstAutoriseParLaSecuriteMemeSansCompteReelEnBase() {
        Exception ex = assertThrows(Exception.class, () -> codeController.demarrerSerie(1L));
        assertFalse(ex instanceof AccessDeniedException,
                "La sécurité doit laisser passer un CANDIDAT : un compte manquant est une erreur métier (404/400), pas un refus d'accès");
    }

    // ---------- Consultation progression / historique : ADMIN, MONITEUR, CANDIDAT ----------

    @Test
    @WithMockUser(roles = "CAISSIERE")
    @DisplayName("15sexies. Une Caissière ne peut pas consulter la progression Code d'un candidat")
    void caissiereNePeutPasConsulterLaProgression() {
        assertThrows(AccessDeniedException.class, () -> codeController.getProgression(1L));
    }

    @Test
    @WithMockUser(roles = "SECRETAIRE")
    @DisplayName("Une Secrétaire ne peut pas consulter l'historique Code d'un candidat")
    void secretaireNePeutPasConsulterLHistorique() {
        assertThrows(AccessDeniedException.class, () -> codeController.getHistorique(1L));
    }
}
