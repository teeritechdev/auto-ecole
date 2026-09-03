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
    public static class TransactionCaisseDTO {
        private Long id;
        private TypeMouvementCaisse typeMouvement;
        private BigDecimal montant;
        private String libelle;
        private String categorie;
        private String referencePiece;
        private LocalDateTime dateTransaction;
        private Long utilisateurId;
        private String utilisateurNomComplet;
        private Long paiementId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTransactionCaisseRequest {
        @NotNull(message = "Le type de mouvement est obligatoire (ENTREE, SORTIE)")
        private TypeMouvementCaisse typeMouvement;

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "1.0", message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;

        @NotBlank(message = "Le libellé est obligatoire")
        private String libelle;

        private String categorie;
        private String referencePiece;
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
