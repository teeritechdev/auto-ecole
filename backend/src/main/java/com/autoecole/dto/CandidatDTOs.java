package com.autoecole.dto;

import com.autoecole.entity.enums.ModeReglement;
import com.autoecole.entity.enums.StatutDossier;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class CandidatDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CandidatDTO {
        private Long id;
        private String numeroDossier;
        private String nom;
        private String prenom;
        private LocalDate dateNaissance;
        private String lieuNaissance;
        private String telephone;
        private String email;
        private String contactsUrgence;
        private LocalDate dateInscription;
        private LocalDate dateReceptionDossier;
        private LocalDate dateDepotDossier;
        private LocalDate dateEcheance;
        private StatutDossier statutDossier;
        private Long inscriptionActiveId;
        private int numeroCycle;
        private Long categoriePermisId;
        private String categoriePermisCode;
        private String categoriePermisLibelle;
        private Long forfaitId;
        private String forfaitNom;
        private BigDecimal montantForfait;
        private BigDecimal totalVerse;
        private BigDecimal soldeRestant;
        private LocalDateTime dateCreation;
        private boolean procheExpiration;
        private long joursRestants;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateCandidatRequest {
        @NotBlank(message = "Le nom est obligatoire")
        private String nom;

        @NotBlank(message = "Le prénom est obligatoire")
        private String prenom;

        @NotNull(message = "La date de naissance est obligatoire")
        private LocalDate dateNaissance;

        private String lieuNaissance;

        @NotBlank(message = "Le numéro de téléphone est obligatoire")
        private String telephone;

        private String email;
        private String contactsUrgence;

        @NotNull(message = "La date d'inscription est obligatoire")
        private LocalDate dateInscription;

        private LocalDate dateReceptionDossier;
        private LocalDate dateDepotDossier;

        @NotNull(message = "La catégorie de permis est obligatoire")
        private Long categoriePermisId;

        @NotNull(message = "Le forfait est obligatoire")
        private Long forfaitId;

        // Premier versement optionnel/intégré
        private BigDecimal montantPremierVersement;
        private ModeReglement modeReglementPremierVersement;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateCandidatRequest {
        @NotBlank(message = "Le nom est obligatoire")
        private String nom;

        @NotBlank(message = "Le prénom est obligatoire")
        private String prenom;

        @NotNull(message = "La date de naissance est obligatoire")
        private LocalDate dateNaissance;

        private String lieuNaissance;

        @NotBlank(message = "Le numéro de téléphone est obligatoire")
        private String telephone;

        private String email;
        private String contactsUrgence;
        private LocalDate dateReceptionDossier;
        private LocalDate dateDepotDossier;

        @NotNull(message = "La catégorie de permis est obligatoire")
        private Long categoriePermisId;

        @NotNull(message = "Le forfait est obligatoire")
        private Long forfaitId;
    }
}
