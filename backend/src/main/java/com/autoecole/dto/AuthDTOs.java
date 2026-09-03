package com.autoecole.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "L'ancien mot de passe est obligatoire")
        private String ancienPassword;

        @NotBlank(message = "Le nouveau mot de passe est obligatoire")
        private String nouveauPassword;
    }
}
