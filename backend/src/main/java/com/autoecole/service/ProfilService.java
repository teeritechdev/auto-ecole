package com.autoecole.service;

import com.autoecole.dto.PermissionDTOs.PermissionDTO;
import com.autoecole.dto.ProfilDTOs.CreateProfilRequest;
import com.autoecole.dto.ProfilDTOs.ProfilDTO;
import com.autoecole.dto.ProfilDTOs.UpdateProfilRequest;
import com.autoecole.entity.Permission;
import com.autoecole.entity.Profil;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.PermissionRepository;
import com.autoecole.repository.ProfilRepository;
import com.autoecole.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Gestion des profils de permissions (onglet Permissions de Paramétrage). Le profil système
 * ADMIN garde toujours l'intégralité du catalogue et n'est jamais modifiable ici : il reste
 * le compte à accès total garanti, quoi que l'administrateur configure par ailleurs
 * (cf. UserDetailsImpl, qui accorde de toute façon toutes les permissions au rôle ADMIN).
 */
@Service
@RequiredArgsConstructor
public class ProfilService {

    private final ProfilRepository profilRepository;
    private final PermissionRepository permissionRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AuditService auditService;

    public List<PermissionDTO> getCatalogue() {
        // Trié par id (= ordre logique métier défini dans DataInitializerService : modules
        // regroupés dans un ordre de workflow, actions Voir/Créer/Modifier/Supprimer dans
        // cet ordre au sein d'un module), plutôt qu'alphabétique qui mélangerait par ex.
        // "Annuler un versement" avant "Voir les versements".
        return permissionRepository.findAll().stream()
                .sorted((a, b) -> Long.compare(a.getId(), b.getId()))
                .map(this::mapPermission)
                .collect(Collectors.toList());
    }

    public List<ProfilDTO> getAllProfils() {
        return profilRepository.findAll().stream()
                .sorted((a, b) -> Boolean.compare(b.isSysteme(), a.isSysteme()) != 0
                        ? Boolean.compare(b.isSysteme(), a.isSysteme())
                        : a.getNom().compareToIgnoreCase(b.getNom()))
                .map(this::mapProfil)
                .collect(Collectors.toList());
    }

    public ProfilDTO getProfilById(Long id) {
        return mapProfil(trouverProfil(id));
    }

    @Transactional
    public ProfilDTO createProfil(CreateProfilRequest request) {
        String nom = request.getNom().trim();
        if (nom.isBlank()) {
            throw new BadRequestException("Le nom du profil est obligatoire");
        }
        if (profilRepository.existsByNomIgnoreCase(nom)) {
            throw new BadRequestException("Un profil avec ce nom existe déjà: " + nom);
        }

        Profil profil = Profil.builder()
                .nom(nom)
                .description(request.getDescription())
                .systeme(false)
                .permissions(resoudrePermissions(request.getPermissionCodes()))
                .build();

        Profil saved = profilRepository.save(profil);
        auditService.logAction("CREATION_PROFIL", "Profil", saved.getNom(), "Création du profil de permissions", null);
        return mapProfil(saved);
    }

    @Transactional
    public ProfilDTO updateProfil(Long id, UpdateProfilRequest request) {
        Profil profil = trouverProfil(id);
        if (profil.isSysteme() && profil.getRoleSysteme() == com.autoecole.entity.enums.RoleEnum.ADMIN) {
            throw new BadRequestException("Le profil Administrateur garde toujours l'ensemble des permissions et ne peut pas être modifié");
        }

        String nom = request.getNom().trim();
        if (nom.isBlank()) {
            throw new BadRequestException("Le nom du profil est obligatoire");
        }
        if (!nom.equalsIgnoreCase(profil.getNom()) && profilRepository.existsByNomIgnoreCase(nom)) {
            throw new BadRequestException("Un profil avec ce nom existe déjà: " + nom);
        }

        profil.setNom(nom);
        profil.setDescription(request.getDescription());
        profil.setPermissions(resoudrePermissions(request.getPermissionCodes()));

        Profil updated = profilRepository.save(profil);
        auditService.logAction("MODIFICATION_PROFIL", "Profil", updated.getNom(), "Modification des permissions du profil", null);
        return mapProfil(updated);
    }

    @Transactional
    public void deleteProfil(Long id) {
        Profil profil = trouverProfil(id);
        if (profil.isSysteme()) {
            throw new BadRequestException("Un profil système ne peut pas être supprimé");
        }
        long nbUtilisateurs = utilisateurRepository.countByProfilId(id);
        if (nbUtilisateurs > 0) {
            throw new BadRequestException("Ce profil est assigné à " + nbUtilisateurs + " compte(s) : réaffectez-les avant de le supprimer");
        }
        profilRepository.delete(profil);
        auditService.logAction("SUPPRESSION_PROFIL", "Profil", profil.getNom(), "Suppression du profil de permissions", null);
    }

    private Set<Permission> resoudrePermissions(Set<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return new HashSet<>();
        }
        Set<Permission> permissions = codes.stream()
                .map(code -> permissionRepository.findByCode(code)
                        .orElseThrow(() -> new BadRequestException("Permission inconnue: " + code)))
                .collect(Collectors.toSet());
        return permissions;
    }

    private Profil trouverProfil(Long id) {
        return profilRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profil non trouvé avec l'id: " + id));
    }

    private ProfilDTO mapProfil(Profil p) {
        boolean verrouille = p.isSysteme() && p.getRoleSysteme() == com.autoecole.entity.enums.RoleEnum.ADMIN;
        return ProfilDTO.builder()
                .id(p.getId())
                .nom(p.getNom())
                .description(p.getDescription())
                .systeme(p.isSysteme())
                .roleSysteme(p.getRoleSysteme() != null ? p.getRoleSysteme().name() : null)
                .verrouille(verrouille)
                .nombreUtilisateurs((int) utilisateurRepository.countByProfilId(p.getId()))
                .permissionCodes(p.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet()))
                .build();
    }

    private PermissionDTO mapPermission(Permission p) {
        return PermissionDTO.builder()
                .id(p.getId())
                .code(p.getCode())
                .module(p.getModule())
                .libelle(p.getLibelle())
                .build();
    }
}
