package com.autoecole.dto;

import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.entity.enums.TypeOperationCaisse;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
        private TypeOperationCaisse typeOperation;
        private LocalDate dateExamen;
        private TypeEpreuve typeEpreuveExamen;
        private List<CandidatConcerneDTO> candidatsConcernes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CandidatConcerneDTO {
        private Long id;
        private String numeroDossier;
        private String nomComplet;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTransactionCaisseRequest {
        @NotNull(message = "Le type de mouvement est obligatoire (ENTREE, SORTIE)")
        private TypeMouvementCaisse typeMouvement;

        // Obligatoire, sauf pour un décaissement FRAIS_EXAMEN (calculé automatiquement
        // côté serveur à partir du nombre de candidats sélectionnés et du tarif configuré).
        @DecimalMin(value = "1.0", message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;

        @NotBlank(message = "Le libellé est obligatoire")
        private String libelle;

        private String categorie;
        private String referencePiece;

        // Sous-type de l'opération ; AUTRE si non précisé (comportement historique).
        private TypeOperationCaisse typeOperation;

        // Renseignés uniquement pour typeOperation = FRAIS_EXAMEN
        private LocalDate dateExamen;
        private TypeEpreuve typeEpreuve;
        private List<Long> candidatIds;
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

        // Informations sur les frais de formation, pour le plafond du prélèvement
        // (typeOperation = PRELEVEMENT_FORMATION) : montant déjà encaissé en formation,
        // montant déjà prélevé vers la caisse interne, et solde disponible.
        private BigDecimal totalFormationEncaisse;
        private BigDecimal totalPreleveFormation;
        private BigDecimal disponiblePourPrelevement;
    }
}
