package com.autoecole.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class AuditDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HistoriqueActionDTO {
        private Long id;
        private Long utilisateurId;
        private String utilisateurNomComplet;
        private String action;
        private String entiteCible;
        private String identifiantCible;
        private String details;
        private String motif;
        private LocalDateTime timestamp;
        private String ipAddress;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SuppressionAuditRequest {
        @NotEmpty(message = "Sélectionnez au moins une entrée à supprimer")
        private List<Long> ids;

        @NotBlank(message = "Le motif de suppression est obligatoire")
        private String motif;
    }
}
