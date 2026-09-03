package com.autoecole.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
}
