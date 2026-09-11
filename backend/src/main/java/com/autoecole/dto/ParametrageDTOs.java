package com.autoecole.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

public class ParametrageDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoriePermisDTO {
        private Long id;
        @NotBlank(message = "Le code catégorie est obligatoire")
        private String code;
        @NotBlank(message = "Le libellé est obligatoire")
        private String libelle;
        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.0", inclusive = false, message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;
        private String description;
        private boolean actif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SiteDTO {
        private Long id;
        @NotBlank(message = "Le nom du site est obligatoire")
        private String nom;
        private String adresse;
        private boolean actif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SiteStatDTO {
        private Long siteId;
        private String siteNom;
        private long nombreCandidatsActifs;
        private BigDecimal montantEncaisse;
        private BigDecimal montantRestantDu;
    }
}
