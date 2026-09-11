package com.autoecole.dto;

import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.entity.enums.StatutInscription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class InscriptionDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InscriptionDTO {
        private Long id;
        private Long candidatId;
        private String candidatNumeroDossier;
        private Long categoriePermisId;
        private String categoriePermisCode;
        private String categoriePermisLibelle;
        private Long siteId;
        private String siteNom;
        private BigDecimal montantForfait;
        private LocalDate dateInscription;
        private LocalDate dateEcheance;
        private StatutDossier statutDossier;
        private StatutInscription statutInscription;
        private BigDecimal totalVerse;
        private BigDecimal soldeRestant;
        private int numeroCycle;
        private boolean active;
        private Long inscriptionPrecedenteId;
        private LocalDateTime dateCreation;
    }
}
