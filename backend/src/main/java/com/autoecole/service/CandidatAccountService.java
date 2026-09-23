package com.autoecole.service;

import com.autoecole.dto.CandidatDTOs.IdentifiantsCompteDTO;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.Profil;
import com.autoecole.entity.Role;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.exception.BadRequestException;
import com.autoecole.repository.ProfilRepository;
import com.autoecole.repository.RoleRepository;
import com.autoecole.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

/**
 * Création automatique du compte de connexion (rôle CANDIDAT) d'un candidat, à sa première
 * inscription (RG-CAND-01/02/03/04 du cahier des charges du module Code). Ne crée jamais de
 * deuxième dossier Candidat : le compte est simplement lié au Candidat existant.
 */
@Service
@RequiredArgsConstructor
public class CandidatAccountService {

    private static final String ALPHABET_MOT_DE_PASSE = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final ProfilRepository profilRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    /**
     * Crée le compte CANDIDAT du candidat s'il n'en a pas déjà un (RG-CAND-04 : réutilisation
     * lors des inscriptions/reprises suivantes). Renvoie les identifiants en clair UNE SEULE
     * FOIS (pour affichage immédiat à la Secrétaire/l'Admin) si un compte vient d'être créé,
     * ou null si le candidat possédait déjà un compte.
     */
    @Transactional
    public IdentifiantsCompteDTO creerCompteCandidatSiAbsent(Candidat candidat) {
        if (utilisateurRepository.findByCandidatId(candidat.getId()).isPresent()
                || utilisateurRepository.findByUsername(candidat.getNumeroDossier()).isPresent()) {
            // Compte déjà existant pour ce numéro de dossier (reprise après expiration, etc.)
            return null;
        }

        Role roleCandidat = roleRepository.findByCode(RoleEnum.CANDIDAT)
                .orElseThrow(() -> new BadRequestException("Rôle CANDIDAT introuvable en base : initialisation incomplète"));

        String motDePasseTemporaire = genererMotDePasseTemporaire();

        // Candidat.email n'est pas garanti unique (à la différence d'Utilisateur.email) :
        // on ne le reprend que s'il n'est pas déjà utilisé par un autre compte, sans quoi
        // le login candidat se fera uniquement par identifiant (numéro de dossier).
        String email = candidat.getEmail();
        if (email != null && utilisateurRepository.findByEmail(email).isPresent()) {
            email = null;
        }

        Profil profilCandidat = profilRepository.findByRoleSysteme(RoleEnum.CANDIDAT).orElse(null);

        Utilisateur compte = Utilisateur.builder()
                .username(candidat.getNumeroDossier())
                .email(email)
                .password(passwordEncoder.encode(motDePasseTemporaire))
                .nom(candidat.getNom())
                .prenom(candidat.getPrenom())
                .telephone(candidat.getTelephone())
                .role(roleCandidat)
                .profil(profilCandidat)
                .candidat(candidat)
                .actif(true)
                .doitChangerMotDePasse(true)
                .build();

        utilisateurRepository.save(compte);

        // §4.1 étape 7 du cahier des charges du module Code : traçabilité de la création
        // automatique du compte candidat, via le mécanisme d'audit existant (même convention
        // que UtilisateurService.createUtilisateur pour un compte créé manuellement).
        auditService.logAction("CREATION_COMPTE_CANDIDAT", "Utilisateur", compte.getUsername(),
                "Création automatique du compte candidat (rôle CANDIDAT) pour le dossier " + candidat.getNumeroDossier()
                        + " (" + candidat.getNom() + " " + candidat.getPrenom() + ")", null);

        return IdentifiantsCompteDTO.builder()
                .username(candidat.getNumeroDossier())
                .motDePasseTemporaire(motDePasseTemporaire)
                .build();
    }

    /**
     * Réinitialise le mot de passe du compte de connexion d'un candidat qui l'a oublié : un
     * nouveau mot de passe temporaire est généré et affiché une seule fois à l'administrateur
     * (aucun mécanisme d'envoi d'email/SMS dans l'application), à charge pour lui de le
     * communiquer au candidat. Celui-ci devra le changer à sa prochaine connexion.
     */
    @Transactional
    public IdentifiantsCompteDTO reinitialiserMotDePasse(Candidat candidat) {
        Utilisateur compte = utilisateurRepository.findByCandidatId(candidat.getId())
                .or(() -> utilisateurRepository.findByUsername(candidat.getNumeroDossier()))
                .orElseThrow(() -> new BadRequestException("Ce candidat n'a pas encore de compte de connexion"));

        String motDePasseTemporaire = genererMotDePasseTemporaire();
        compte.setPassword(passwordEncoder.encode(motDePasseTemporaire));
        compte.setDoitChangerMotDePasse(true);
        utilisateurRepository.save(compte);

        auditService.logAction("REINITIALISATION_MOT_DE_PASSE", "Utilisateur", compte.getUsername(),
                "Réinitialisation du mot de passe du candidat " + candidat.getNom() + " " + candidat.getPrenom()
                        + " par l'administrateur", null);

        return IdentifiantsCompteDTO.builder()
                .username(compte.getUsername())
                .motDePasseTemporaire(motDePasseTemporaire)
                .build();
    }

    String genererMotDePasseTemporaire() {
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(ALPHABET_MOT_DE_PASSE.charAt(RANDOM.nextInt(ALPHABET_MOT_DE_PASSE.length())));
        }
        return sb.toString();
    }
}
