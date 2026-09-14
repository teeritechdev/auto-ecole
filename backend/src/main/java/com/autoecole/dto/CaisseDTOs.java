package com.autoecole.dto;

import com.autoecole.entity.enums.TypeMouvementCaisse;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CaisseDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NatureOperationDTO {
        private Long id;
        private String code;
        private String libelle;
        private TypeMouvementCaisse sens;
        private String planComptable;
        private String description;
        private boolean actif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateNatureOperationRequest {
        @NotBlank(message = "Le code est obligatoire")
        private String code;

        @NotBlank(message = "Le libellé est obligatoire")
        private String libelle;

        @NotNull(message = "Le sens (recette ou dépense) est obligatoire")
        private TypeMouvementCaisse sens;

        private String planComptable;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateNatureOperationRequest {
        @NotBlank(message = "Le libellé est obligatoire")
        private String libelle;

        private String planComptable;
        private String description;
        private boolean actif;
        // Le sens n'est volontairement pas modifiable après création : des opérations
        // existantes ont déjà hérité du sens d'origine, le changer les rendrait incohérentes
        // avec le solde déjà calculé.
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionCaisseDTO {
        private Long id;
        private NatureOperationDTO natureOperation;
        private TypeMouvementCaisse typeMouvement;
        private BigDecimal montant;
        private String libelle;
        private String numeroFacture;
        private LocalDateTime dateTransaction;
        private Long utilisateurId;
        private String utilisateurNomComplet;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTransactionCaisseRequest {
        @NotNull(message = "La nature de l'opération est obligatoire")
        private Long natureOperationId;

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "1.0", message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;

        @NotBlank(message = "Le libellé est obligatoire")
        private String libelle;

        private String numeroFacture;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecapCaisseDTO {
        private BigDecimal totalEntrees;
        private BigDecimal totalSorties;
        private BigDecimal soldeCaisse;
        private BigDecimal totalEntreesJour;
        private BigDecimal totalSortiesJour;
        private BigDecimal soldeJour;
    }
}
