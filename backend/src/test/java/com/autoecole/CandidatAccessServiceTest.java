package com.autoecole;

import com.autoecole.entity.Candidat;
import com.autoecole.entity.Role;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.service.AuditService;
import com.autoecole.service.CandidatAccessService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de l'isolation d'accès entre candidats (RG-CAND-05 du cahier des charges du
 * module Code de la route, §12/§15/§18 : "un candidat ne peut consulter les résultats d'un
 * autre candidat").
 */
@ExtendWith(MockitoExtension.class)
class CandidatAccessServiceTest {

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CandidatAccessService candidatAccessService;

    private Utilisateur compteCandidat(Long candidatId) {
        Role role = Role.builder().code(RoleEnum.CANDIDAT).libelle("Candidat").build();
        Candidat candidat = Candidat.builder().id(candidatId).numeroDossier("DOS-" + candidatId).nom("Nom").prenom("Prenom").build();
        return Utilisateur.builder().username("DOS-" + candidatId).role(role).candidat(candidat).build();
    }

    private Utilisateur compteStaff(RoleEnum code) {
        Role role = Role.builder().code(code).libelle(code.name()).build();
        return Utilisateur.builder().username(code.name().toLowerCase()).role(role).build();
    }

    @Test
    @DisplayName("16. Isolation : un candidat ne peut pas accéder au dossier d'un autre candidat")
    void testCandidatNePeutPasAccederAuDossierDunAutre() {
        when(auditService.getCurrentUser()).thenReturn(compteCandidat(1L));

        assertThrows(ResourceNotFoundException.class, () -> candidatAccessService.verifierEstSoiMeme(2L));
    }

    @Test
    @DisplayName("16bis. Isolation : un candidat peut librement accéder à son propre dossier")
    void testCandidatPeutAccederASonProprePDossier() {
        when(auditService.getCurrentUser()).thenReturn(compteCandidat(1L));

        assertDoesNotThrow(() -> candidatAccessService.verifierEstSoiMeme(1L));
    }

    @Test
    @DisplayName("Un compte ADMIN/MONITEUR n'est pas soumis à cette restriction (isolation propre au rôle CANDIDAT)")
    void testStaffNestPasRestreintParCetteVerification() {
        when(auditService.getCurrentUser()).thenReturn(compteStaff(RoleEnum.ADMIN));

        assertDoesNotThrow(() -> candidatAccessService.verifierEstSoiMeme(999L));
    }

    @Test
    @DisplayName("Un compte CANDIDAT sans dossier Candidat lié ne peut résoudre aucun candidat courant")
    void testGetCandidatCourantSansDossierLie() {
        Role role = Role.builder().code(RoleEnum.CANDIDAT).libelle("Candidat").build();
        Utilisateur sansCandidat = Utilisateur.builder().username("orphelin").role(role).candidat(null).build();
        when(auditService.getCurrentUser()).thenReturn(sansCandidat);

        assertThrows(ResourceNotFoundException.class, () -> candidatAccessService.getCandidatCourant());
    }

    @Test
    @DisplayName("Aucun utilisateur authentifié -> la vérification ne lève pas d'exception (l'authentification est déjà filtrée en amont)")
    void testAucunUtilisateurConnecteNeBloquePas() {
        when(auditService.getCurrentUser()).thenReturn(null);

        assertDoesNotThrow(() -> candidatAccessService.verifierEstSoiMeme(42L));
    }

    @Test
    @DisplayName("candidatIdCible nul refusé pour un compte CANDIDAT (ne doit jamais être interprété comme 'lui-même')")
    void testCandidatIdCibleNulRefusePourUnCandidat() {
        when(auditService.getCurrentUser()).thenReturn(compteCandidat(1L));

        assertThrows(ResourceNotFoundException.class, () -> candidatAccessService.verifierEstSoiMeme(null));
    }
}
