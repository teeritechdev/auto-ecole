package com.autoecole.dto;

import com.autoecole.entity.enums.ResultatExamen;
import com.autoecole.entity.enums.TypeEpreuve;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExamenDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PassageExamenDTO {
        private Long id;
        private Long candidatId;
        private String candidatNumeroDossier;
        private String candidatNomComplet;
        private TypeEpreuve typeEpreuve;
        private Integer numeroPassage;
        private long nombreEchecs;
        private LocalDate datePassage;
        private ResultatExamen resultat;
        private String observations;
        private Long moniteurId;
        private String moniteurNomComplet;
        private LocalDateTime dateEnregistrement;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePassageRequest {
        @NotNull(message = "Le candidat est obligatoire")
        private Long candidatId;

        @NotNull(message = "Le type d'épreuve est obligatoire (CODE, CRENEAU, CIRCULATION)")
        private TypeEpreuve typeEpreuve;

        @Min(value = 1, message = "Le numéro de passage minimum est 1")
        @Max(value = 5, message = "Le nombre maximal de passages autorisés par épreuve est 5")
        private Integer numeroPassage; // Si null, calculé automatiquement (dernier + 1)

        @NotNull(message = "La date du passage est obligatoire")
        private LocalDate datePassage;

        private ResultatExamen resultat; // Par défaut PROGRAMME

        private String observations;

        private Long moniteurId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePassageBulkRequest {
        @NotNull(message = "La liste des candidats est obligatoire")
        private java.util.List<Long> candidatIds;

        @NotNull(message = "Le type d'épreuve est obligatoire (CODE, CRENEAU, CIRCULATION)")
        private TypeEpreuve typeEpreuve;

        @NotNull(message = "La date du passage est obligatoire")
        private LocalDate datePassage;

        private Long moniteurId;
        private String observations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdatePassageRequest {
        @NotNull(message = "La date du passage est obligatoire")
        private LocalDate datePassage;

        @NotNull(message = "Le résultat est obligatoire")
        private ResultatExamen resultat;

        private String observations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionExamenDTO {
        private Long id;
        private TypeEpreuve typeEpreuve;
        private LocalDate datePassage;
        private Long siteId;
        private String siteNom;
        private Long moniteurId;
        private String moniteurNomComplet;
        private java.util.Set<TypeEpreuve> moniteurSpecialites;
        private String observations;
        private boolean datePassee;
        private boolean terminee;
        private java.util.List<PassageExamenDTO> candidats;
    }

    @Data
    @NoArgsConstructor
    public static class AjouterCandidatsSessionRequest {
        @NotNull(message = "La liste des candidats est obligatoire")
        private java.util.List<Long> candidatIds;
    }

    @Data
    @NoArgsConstructor
    public static class UpdateSessionRequest {
        @NotNull(message = "La date de l'examen est obligatoire")
        private LocalDate datePassage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BilanExamensCandidatDTO {
        private Long candidatId;
        private String candidatNumeroDossier;
        private String candidatNomComplet;
        private java.util.List<PassageExamenDTO> passagesCode;
        private java.util.List<PassageExamenDTO> passagesCreneau;
        private java.util.List<PassageExamenDTO> passagesCirculation;
        private boolean codeReussi;
        private boolean creneauReussi;
        private boolean circulationReussi;
    }
}
