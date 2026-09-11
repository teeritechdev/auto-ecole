package com.autoecole.dto;

import com.autoecole.entity.enums.TypeEpreuve;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

public class AuthDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "L'identifiant est obligatoire")
        private String username;

        @NotBlank(message = "Le mot de passe est obligatoire")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JwtResponse {
        private String token;
        @Builder.Default
        private String type = "Bearer";
        private Long id;
        private String username;
        private String email;
        private String nom;
        private String prenom;
        private String role;
        private String photoProfile;
        private Long siteId;
        private Set<TypeEpreuve> specialites;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "L'ancien mot de passe est obligatoire")
        private String ancienPassword;

        @NotBlank(message = "Le nouveau mot de passe est obligatoire")
        @Size(min = 8, max = 100, message = "Le nouveau mot de passe doit contenir au moins 8 caractères")
        private String nouveauPassword;
    }
}
