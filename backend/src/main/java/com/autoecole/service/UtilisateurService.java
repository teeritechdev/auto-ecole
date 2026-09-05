package com.autoecole.service;

import com.autoecole.dto.UtilisateurDTOs.CreateUtilisateurRequest;
import com.autoecole.dto.UtilisateurDTOs.UpdateUtilisateurRequest;
import com.autoecole.dto.UtilisateurDTOs.UtilisateurDTO;
import com.autoecole.entity.Role;
import com.autoecole.entity.Utilisateur;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.RoleRepository;
import com.autoecole.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public List<UtilisateurDTO> getAllUtilisateurs() {
        return utilisateurRepository.findAll().stream()
                .map(this::mapToDTO)
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
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Un compte avec cet email existe déjà: " + request.getEmail());
        }

        Role role = roleRepository.findByCode(request.getRole())
                .orElseThrow(() -> new BadRequestException("Rôle inexistant: " + request.getRole()));

        Utilisateur user = Utilisateur.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .nom(request.getNom().trim())
                .prenom(request.getPrenom().trim())
                .telephone(request.getTelephone())
                .photoProfile(request.getPhotoProfile())
                .role(role)
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

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Un compte avec cet email existe déjà: " + request.getEmail());
        }

        Role role = roleRepository.findByCode(request.getRole())
                .orElseThrow(() -> new BadRequestException("Rôle inexistant: " + request.getRole()));

        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setNom(request.getNom().trim());
        user.setPrenom(request.getPrenom().trim());
        user.setTelephone(request.getTelephone());
        user.setPhotoProfile(request.getPhotoProfile());
        user.setRole(role);

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
                .actif(u.isActif())
                .dateCreation(u.getDateCreation())
                .build();
    }
}
