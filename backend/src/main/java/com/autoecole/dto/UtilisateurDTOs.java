package com.autoecole.dto;

import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.entity.enums.TypeEpreuve;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

public class UtilisateurDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UtilisateurDTO {
        private Long id;
        private String username;
        private String email;
        private String nom;
        private String prenom;
        private String telephone;
        private String photoProfile;
        private String role;
        private String roleLibelle;
        private Long siteId;
        private String siteNom;
        private Set<TypeEpreuve> specialites;
        private boolean actif;
        private LocalDateTime dateCreation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateUtilisateurRequest {
        @NotBlank(message = "L'identifiant est obligatoire")
        private String username;

        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        private String email;

        @NotBlank(message = "Le mot de passe est obligatoire")
        @Size(min = 8, max = 100, message = "Le mot de passe doit contenir au moins 8 caractères")
        private String password;

        @NotBlank(message = "Le nom est obligatoire")
        private String nom;

        @NotBlank(message = "Le prénom est obligatoire")
        private String prenom;

        private String telephone;

        @Size(max = 2_800_000, message = "Photo trop volumineuse (2 Mo max)")
        private String photoProfile;

        @NotNull(message = "Le rôle est obligatoire")
        private RoleEnum role;

        // Pertinent uniquement pour le rôle MONITEUR
        private Long siteId;
        private Set<TypeEpreuve> specialites;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateUtilisateurRequest {
        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        private String email;

        @Size(min = 8, max = 100, message = "Le mot de passe doit contenir au moins 8 caractères")
        private String password; // Optionnel lors de la mise à jour

        @NotBlank(message = "Le nom est obligatoire")
        private String nom;

        @NotBlank(message = "Le prénom est obligatoire")
        private String prenom;

        private String telephone;

        @NotNull(message = "Le rôle est obligatoire")
        private RoleEnum role;

        private Boolean actif;

        @Size(max = 2_800_000, message = "Photo trop volumineuse (2 Mo max)")
        private String photoProfile;

        // Pertinent uniquement pour le rôle MONITEUR
        private Long siteId;
        private Set<TypeEpreuve> specialites;
    }
}
