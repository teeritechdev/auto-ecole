package com.autoecole.dto;

import com.autoecole.entity.enums.ModeReglement;
import com.autoecole.entity.enums.TypeEpreuve;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaiementDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaiementDTO {
        private Long id;
        private Long candidatId;
        private String candidatNumeroDossier;
        private String candidatNomComplet;
        private Long utilisateurId;
        private String utilisateurNomComplet;
        private TypeEpreuve typeEpreuve;
        private BigDecimal montant;
        private BigDecimal soldeRestant; // Reste à payer du candidat après ce versement
        private LocalDateTime datePaiement;
        private ModeReglement modeReglement;
        private String motifModification;
        private LocalDateTime dateModification;
        private String utilisateurModifNom;
        private String numeroRecu;
        private Long recuId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePaiementRequest {
        @NotNull(message = "L'identifiant du candidat est obligatoire")
        private Long candidatId;

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "1.0", message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;

        @NotNull(message = "Le mode de règlement est obligatoire")
        private ModeReglement modeReglement;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateFraisExamenRequest {
        @NotNull(message = "L'identifiant du candidat est obligatoire")
        private Long candidatId;

        @NotNull(message = "Le type d'épreuve est obligatoire")
        private TypeEpreuve typeEpreuve;

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "1.0", message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;

        @NotNull(message = "Le mode de règlement est obligatoire")
        private ModeReglement modeReglement;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ModifierPaiementRequest {
        @NotNull(message = "Le nouveau montant est obligatoire")
        @DecimalMin(value = "1.0", message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;

        @NotNull(message = "Le mode de règlement est obligatoire")
        private ModeReglement modeReglement;

        @NotBlank(message = "Le motif de modification est obligatoire")
        private String motif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnnulerPaiementRequest {
        @NotBlank(message = "Le motif d'annulation est obligatoire")
        private String motif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecuDTO {
        private Long id;
        private Long paiementId;
        private String numeroRecu;
        private LocalDateTime dateEmission;
        private Long candidatId;
        private String candidatNumeroDossier;
        private String nomClient;
        private String forfaitNom;
        private BigDecimal montantForfait;
        private BigDecimal montant;
        private BigDecimal totalVerse;
        private BigDecimal soldeRestant;
        private String modeReglement;
        private String typeVersement;
        private String imprimePar;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResumePaiementsDTO {
        private BigDecimal totalEncaisse;
        private BigDecimal totalReste;
    }
}
