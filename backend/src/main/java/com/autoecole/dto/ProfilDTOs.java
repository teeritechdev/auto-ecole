package com.autoecole.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

public class ProfilDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProfilDTO {
        private Long id;
        private String nom;
        private String description;
        private boolean systeme;
        private String roleSysteme;
        private boolean verrouille; // profil ADMIN système : toujours accès total, non modifiable
        private int nombreUtilisateurs;
        private Set<String> permissionCodes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateProfilRequest {
        @NotBlank(message = "Le nom du profil est obligatoire")
        private String nom;

        private String description;

        @NotNull(message = "La liste des permissions est obligatoire (peut être vide)")
        private Set<String> permissionCodes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateProfilRequest {
        @NotBlank(message = "Le nom du profil est obligatoire")
        private String nom;

        private String description;

        @NotNull(message = "La liste des permissions est obligatoire (peut être vide)")
        private Set<String> permissionCodes;
    }
}
