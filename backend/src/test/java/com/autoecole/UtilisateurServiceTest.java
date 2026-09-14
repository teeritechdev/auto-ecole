package com.autoecole;

import com.autoecole.entity.Role;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.repository.RoleRepository;
import com.autoecole.repository.SiteRepository;
import com.autoecole.repository.UtilisateurRepository;
import com.autoecole.service.AuditService;
import com.autoecole.service.UtilisateurService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ÉTAPE 5 (audit final) : l'écran d'administration "Utilisateurs" ne gère que le personnel
 * (Administrateur/Secrétaire/Caissière/Moniteur) — les comptes CANDIDAT, auto-créés et sans
 * email garanti (cf. §4.1 du cahier des charges du module Code), ne doivent pas y apparaître :
 * la liste ne propose pas le rôle CANDIDAT et le formulaire de modification exige un email.
 */
@ExtendWith(MockitoExtension.class)
class UtilisateurServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private SiteRepository siteRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private UtilisateurService utilisateurService;

    @Test
    @DisplayName("L'écran Utilisateurs ne liste jamais les comptes CANDIDAT")
    void getAllUtilisateursExclutLesComptesCandidat() {
        Utilisateur secretaire = Utilisateur.builder()
                .username("secretariat1")
                .email("secretariat1@example.local")
                .nom("Secrétaire").prenom("Test")
                .role(Role.builder().code(RoleEnum.SECRETAIRE).libelle("Secrétaire").build())
                .sites(Collections.emptySet())
                .specialites(Collections.emptySet())
                .build();
        when(utilisateurRepository.findByRoleCodeNot(RoleEnum.CANDIDAT)).thenReturn(List.of(secretaire));

        List<?> resultat = utilisateurService.getAllUtilisateurs();

        assertEquals(1, resultat.size());
        verify(utilisateurRepository).findByRoleCodeNot(RoleEnum.CANDIDAT);
        verify(utilisateurRepository, never()).findAll();
    }
}
