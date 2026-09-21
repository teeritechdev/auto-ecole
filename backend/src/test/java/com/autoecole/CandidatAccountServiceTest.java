package com.autoecole;

import com.autoecole.dto.CandidatDTOs.IdentifiantsCompteDTO;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.Role;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.repository.RoleRepository;
import com.autoecole.repository.UtilisateurRepository;
import com.autoecole.service.AuditService;
import com.autoecole.service.CandidatAccountService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Vérifie la traçabilité de la création automatique du compte candidat (§4.1 étape 7 du
 * cahier des charges du module Code : "Enregistrer l'opération dans la traçabilité"),
 * en réutilisant le mécanisme d'audit existant (AuditService.logAction), et l'absence de
 * doublon d'écriture lorsque le compte existe déjà (RG-CAND-04).
 */
@ExtendWith(MockitoExtension.class)
class CandidatAccountServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private com.autoecole.repository.ProfilRepository profilRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private CandidatAccountService candidatAccountService;

    private Candidat candidat() {
        return Candidat.builder().id(1L).numeroDossier("DOS-2026-0099").nom("KABORE").prenom("Achille").build();
    }

    @Test
    @DisplayName("§4.1 étape 7 : la création automatique du compte candidat est enregistrée dans l'historique d'audit")
    void testCreationCompteCandidatTraceeDansHistorique() {
        Candidat candidat = candidat();
        when(utilisateurRepository.findByUsername("DOS-2026-0099")).thenReturn(Optional.empty());
        when(roleRepository.findByCode(RoleEnum.CANDIDAT))
                .thenReturn(Optional.of(Role.builder().code(RoleEnum.CANDIDAT).libelle("Candidat").build()));
        when(passwordEncoder.encode(anyString())).thenReturn("hash");

        IdentifiantsCompteDTO identifiants = candidatAccountService.creerCompteCandidatSiAbsent(candidat);

        assertNotNull(identifiants, "Le compte doit bien être créé");

        ArgumentCaptor<String> action = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> entiteCible = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> identifiantCible = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> details = ArgumentCaptor.forClass(String.class);
        verify(auditService, times(1))
                .logAction(action.capture(), entiteCible.capture(), identifiantCible.capture(), details.capture(), isNull());

        assertEquals("CREATION_COMPTE_CANDIDAT", action.getValue());
        assertEquals("Utilisateur", entiteCible.getValue());
        assertEquals("DOS-2026-0099", identifiantCible.getValue());
        assertTrue(details.getValue().contains("DOS-2026-0099"));
        assertTrue(details.getValue().contains("KABORE"));
    }

    @Test
    @DisplayName("10. Pas de doublon : la réutilisation d'un compte candidat déjà existant ne génère aucune écriture d'audit supplémentaire")
    void testReutilisationCompteExistantNeGenereAucunAuditSupplementaire() {
        Candidat candidat = candidat();
        Utilisateur compteExistant = Utilisateur.builder().username("DOS-2026-0099").build();
        when(utilisateurRepository.findByUsername("DOS-2026-0099")).thenReturn(Optional.of(compteExistant));

        IdentifiantsCompteDTO identifiants = candidatAccountService.creerCompteCandidatSiAbsent(candidat);

        assertNull(identifiants, "Aucun nouveau compte ne doit être créé");
        verifyNoInteractions(auditService);
        verify(utilisateurRepository, never()).save(any());
    }
}
