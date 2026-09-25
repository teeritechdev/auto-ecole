package com.autoecole.service;

import com.autoecole.dto.AuthDTOs.JwtResponse;
import com.autoecole.dto.CandidatDTOs.IdentifiantsCompteDTO;
import com.autoecole.dto.UtilisateurDTOs.CreateUtilisateurRequest;
import com.autoecole.dto.UtilisateurDTOs.UpdateUtilisateurRequest;
import com.autoecole.dto.UtilisateurDTOs.UtilisateurDTO;
import com.autoecole.entity.Profil;
import com.autoecole.entity.Role;
import com.autoecole.entity.Site;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.ProfilRepository;
import com.autoecole.repository.RoleRepository;
import com.autoecole.repository.SiteRepository;
import com.autoecole.repository.UtilisateurRepository;
import com.autoecole.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final SiteRepository siteRepository;
    private final ProfilRepository profilRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final CandidatAccountService candidatAccountService;
    private final UserDetailsService userDetailsService;
    private final JwtUtils jwtUtils;

    /** Ne renvoie que les comptes du personnel (ADMIN/SECRETAIRE/CAISSIERE/MONITEUR) : les
     *  comptes CANDIDAT sont auto-créés, n'ont pas nécessairement d'email et n'ont pas leur
     *  place dans cet écran de gestion des droits du personnel (cf. audit ÉTAPE 5). */
    public List<UtilisateurDTO> getAllUtilisateurs() {
        return utilisateurRepository.findByRoleCodeNot(RoleEnum.CANDIDAT).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<UtilisateurDTO> getUtilisateursFiltres(String recherche, RoleEnum role, Long siteId, Boolean actif) {
        return getAllUtilisateurs().stream()
                .filter(u -> role == null || role.name().equalsIgnoreCase(u.getRole()))
                .filter(u -> actif == null || u.isActif() == actif)
                .filter(u -> {
                    if (siteId == null) return true;
                    return u.getSiteIds() != null && u.getSiteIds().contains(siteId);
                })
                .filter(u -> {
                    if (recherche == null || recherche.isBlank()) return true;
                    String q = recherche.toLowerCase().trim();
                    return (u.getUsername() != null && u.getUsername().toLowerCase().contains(q))
                            || (u.getNom() != null && u.getNom().toLowerCase().contains(q))
                            || (u.getPrenom() != null && u.getPrenom().toLowerCase().contains(q))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(q))
                            || (u.getTelephone() != null && u.getTelephone().toLowerCase().contains(q));
                })
                .collect(Collectors.toList());
    }

    public UtilisateurDTO getUtilisateurById(Long id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id: " + id));
        return mapToDTO(user);
    }

    @Transactional
    public UtilisateurDTO createUtilisateur(CreateUtilisateurRequest request) {
        validateImage(request.getPhotoProfile());
        if (utilisateurRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Un compte avec cet identifiant existe déjà: " + request.getUsername());
        }

        String email = (request.getEmail() != null && !request.getEmail().trim().isEmpty())
                ? request.getEmail().trim().toLowerCase()
                : null;

        if (email != null && utilisateurRepository.existsByEmail(email)) {
            throw new BadRequestException("Un compte avec cet email existe déjà: " + email);
        }

        Role role = roleRepository.findByCode(request.getRole())
                .orElseThrow(() -> new BadRequestException("Rôle inexistant: " + request.getRole()));

        Set<Site> sites = resoudreSitesPourRole(request.getRole(), request.getSiteIds());
        Profil profil = resoudreProfil(request.getProfilId(), request.getRole());

        Utilisateur user = Utilisateur.builder()
                .username(request.getUsername().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .nom(request.getNom().trim())
                .prenom(request.getPrenom().trim())
                .telephone(request.getTelephone())
                .photoProfile(request.getPhotoProfile())
                .role(role)
                .profil(profil)
                .sites(sites)
                .specialites(resoudreSpecialites(request.getRole(), request.getSpecialites()))
                .actif(true)
                .build();

        Utilisateur saved = utilisateurRepository.save(user);
        auditService.logAction("CREATION_COMPTE", "Utilisateur", saved.getUsername(), "Création du compte utilisateur avec rôle " + role.getCode(), null);

        return mapToDTO(saved);
    }

    @Transactional
    public UtilisateurDTO updateUtilisateur(Long id, UpdateUtilisateurRequest request) {
        validateImage(request.getPhotoProfile());
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id: " + id));

        String email = (request.getEmail() != null && !request.getEmail().trim().isEmpty())
                ? request.getEmail().trim().toLowerCase()
                : null;

        if (email != null && !email.equalsIgnoreCase(user.getEmail()) && utilisateurRepository.existsByEmail(email)) {
            throw new BadRequestException("Un compte avec cet email existe déjà: " + email);
        }

        Role role = roleRepository.findByCode(request.getRole())
                .orElseThrow(() -> new BadRequestException("Rôle inexistant: " + request.getRole()));

        Set<Site> sites = resoudreSitesPourRole(request.getRole(), request.getSiteIds());
        Profil profil = resoudreProfil(request.getProfilId(), request.getRole());

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            String newUsername = request.getUsername().trim();
            if (!newUsername.equalsIgnoreCase(user.getUsername())) {
                if (newUsername.length() < 3 || newUsername.length() > 50) {
                    throw new BadRequestException("L'identifiant doit contenir entre 3 et 50 caractères");
                }
                if (!newUsername.matches("^[a-zA-Z0-9._-]+$")) {
                    throw new BadRequestException("L'identifiant ne peut contenir que des lettres, chiffres, tirets (-), points (.) ou underscores (_)");
                }
                if (utilisateurRepository.existsByUsername(newUsername)) {
                    throw new BadRequestException("Un compte avec cet identifiant existe déjà: " + newUsername);
                }
                user.setUsername(newUsername);
            }
        }

        user.setEmail(email);
        user.setNom(request.getNom().trim());
        user.setPrenom(request.getPrenom().trim());
        user.setTelephone(request.getTelephone());
        user.setPhotoProfile(request.getPhotoProfile());
        user.setRole(role);
        user.setProfil(profil);
        user.setSites(sites);
        user.setSpecialites(resoudreSpecialites(request.getRole(), request.getSpecialites()));

        if (request.getActif() != null) {
            user.setActif(request.getActif());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        Utilisateur updated = utilisateurRepository.save(user);
        auditService.logAction("MODIFICATION_COMPTE", "Utilisateur", updated.getUsername(), "Mise à jour des informations du compte", null);

        return mapToDTO(updated);
    }

    /** Réinitialise le mot de passe d'un compte du personnel qui l'a oublié : un nouveau mot
     *  de passe temporaire est généré et affiché une seule fois à l'administrateur (aucun
     *  mécanisme d'envoi d'email/SMS dans l'application), à charge pour lui de le communiquer
     *  au titulaire du compte. Celui-ci devra le changer à sa prochaine connexion. */
    @Transactional
    public IdentifiantsCompteDTO resetPassword(Long id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id: " + id));

        String motDePasseTemporaire = candidatAccountService.genererMotDePasseTemporaire();
        user.setPassword(passwordEncoder.encode(motDePasseTemporaire));
        user.setDoitChangerMotDePasse(true);
        utilisateurRepository.save(user);

        auditService.logAction("REINITIALISATION_MOT_DE_PASSE", "Utilisateur", user.getUsername(),
                "Réinitialisation du mot de passe du compte par l'administrateur", null);

        return IdentifiantsCompteDTO.builder()
                .username(user.getUsername())
                .motDePasseTemporaire(motDePasseTemporaire)
                .build();
    }

    @Transactional
    public void toggleActif(Long id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id: " + id));

        user.setActif(!user.isActif());
        utilisateurRepository.save(user);

        String action = user.isActif() ? "ACTIVATION_COMPTE" : "DESACTIVATION_COMPTE";
        auditService.logAction(action, "Utilisateur", user.getUsername(), "Changement d'état du compte à: " + (user.isActif() ? "Actif" : "Désactivé"), null);
    }

    @Transactional
    public UtilisateurDTO updatePhoto(Long id, String photoProfile) {
        validateImage(photoProfile);
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id: " + id));
        user.setPhotoProfile(photoProfile);
        return mapToDTO(utilisateurRepository.save(user));
    }

    @Transactional
    public UtilisateurDTO updateCurrentUserPhoto(String photoProfile) {
        validateImage(photoProfile);
        Utilisateur user = auditService.getCurrentUser();
        if (user == null) {
            throw new ResourceNotFoundException("Utilisateur non identifié");
        }
        user.setPhotoProfile(photoProfile);
        return mapToDTO(utilisateurRepository.save(user));
    }

    @Transactional
    public JwtResponse updateCurrentUsername(String newUsername) {
        if (newUsername == null || newUsername.trim().isBlank()) {
            throw new BadRequestException("L'identifiant est obligatoire");
        }
        String trimmed = newUsername.trim();
        if (trimmed.length() < 3 || trimmed.length() > 50) {
            throw new BadRequestException("L'identifiant doit contenir entre 3 et 50 caractères");
        }
        if (!trimmed.matches("^[a-zA-Z0-9._-]+$")) {
            throw new BadRequestException("L'identifiant ne peut contenir que des lettres, chiffres, tirets (-), points (.) ou underscores (_)");
        }

        Utilisateur currentUser = auditService.getCurrentUser();
        if (currentUser == null) {
            throw new ResourceNotFoundException("Utilisateur non identifié");
        }

        if (trimmed.equalsIgnoreCase(currentUser.getUsername())) {
            throw new BadRequestException("Le nouvel identifiant est identique à l'actuel");
        }

        if (utilisateurRepository.existsByUsername(trimmed)) {
            throw new BadRequestException("Cet identifiant est déjà utilisé par un autre compte");
        }

        String ancienUsername = currentUser.getUsername();
        currentUser.setUsername(trimmed);
        Utilisateur saved = utilisateurRepository.save(currentUser);

        auditService.logAction("MODIFICATION_IDENTIFIANT", "Utilisateur", saved.getUsername(),
                "Modification du nom d'utilisateur de '" + ancienUsername + "' à '" + saved.getUsername() + "'", null);

        UserDetails userDetails = userDetailsService.loadUserByUsername(saved.getUsername());
        Authentication newAuth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(newAuth);
        String jwt = jwtUtils.generateJwtToken(newAuth);

        List<String> permissions = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("PERM_"))
                .map(a -> a.replace("PERM_", ""))
                .collect(Collectors.toList());

        return JwtResponse.builder()
                .token(jwt)
                .id(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .nom(saved.getNom())
                .prenom(saved.getPrenom())
                .role(saved.getRole().getCode().name())
                .permissions(permissions)
                .photoProfile(saved.getPhotoProfile())
                .siteIds(saved.getSites().stream().map(Site::getId).collect(Collectors.toSet()))
                .specialites(saved.getSpecialites())
                .candidatId(saved.getCandidat() != null ? saved.getCandidat().getId() : null)
                .doitChangerMotDePasse(saved.isDoitChangerMotDePasse())
                .build();
    }

    /** Rôles de terrain rattachables à un ou plusieurs sites (RG : gestion par site, comme
     *  pour un moniteur) ; ADMIN garde seul un compte sans site, à portée globale. */
    private static final Set<RoleEnum> ROLES_AVEC_SITES = Set.of(RoleEnum.MONITEUR, RoleEnum.SECRETAIRE, RoleEnum.CAISSIERE);

    private Set<Site> resoudreSitesPourRole(RoleEnum role, Set<Long> siteIds) {
        if (!ROLES_AVEC_SITES.contains(role)) {
            return Collections.emptySet();
        }
        if (siteIds == null || siteIds.isEmpty()) {
            throw new BadRequestException("Au moins un site de formation est obligatoire pour ce rôle");
        }
        Set<Site> sites = new java.util.HashSet<>(siteRepository.findAllById(siteIds));
        if (sites.size() != siteIds.size()) {
            throw new ResourceNotFoundException("Un ou plusieurs sites de formation sont introuvables");
        }
        return sites;
    }

    /** Si aucun profil n'est explicitement choisi, on rattache l'utilisateur au profil
     *  système de son rôle (comportement historique préservé par défaut). */
    private Profil resoudreProfil(Long profilId, RoleEnum role) {
        if (profilId != null) {
            return profilRepository.findById(profilId)
                    .orElseThrow(() -> new BadRequestException("Profil de permissions inexistant: " + profilId));
        }
        return profilRepository.findByRoleSysteme(role)
                .orElseThrow(() -> new BadRequestException("Aucun profil système trouvé pour le rôle: " + role));
    }

    private Set<TypeEpreuve> resoudreSpecialites(RoleEnum role, Set<TypeEpreuve> specialites) {
        if (role != RoleEnum.MONITEUR || specialites == null) {
            return Collections.emptySet();
        }
        return specialites;
    }

    private void validateImage(String imageData) {
        if (imageData == null || imageData.isBlank()) return;
        if (!imageData.matches("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$")) {
            throw new BadRequestException("Format d'image non pris en charge");
        }
        if (imageData.length() > 2_800_000) {
            throw new BadRequestException("L'image ne doit pas dépasser 2 Mo");
        }
    }

    public UtilisateurDTO mapToDTO(Utilisateur u) {
        return UtilisateurDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .telephone(u.getTelephone())
                .photoProfile(u.getPhotoProfile())
                .role(u.getRole().getCode().name())
                .roleLibelle(u.getRole().getLibelle())
                .profilId(u.getProfil() != null ? u.getProfil().getId() : null)
                .profilNom(u.getProfil() != null ? u.getProfil().getNom() : null)
                .siteIds(u.getSites().stream().map(Site::getId).collect(Collectors.toSet()))
                .siteNoms(u.getSites().stream().map(Site::getNom).collect(Collectors.toSet()))
                .specialites(u.getSpecialites())
                .actif(u.isActif())
                .dateCreation(u.getDateCreation())
                .build();
    }
}
