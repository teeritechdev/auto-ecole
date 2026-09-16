package com.autoecole.dto;

import com.autoecole.entity.enums.EtapeParcours;
import com.autoecole.entity.enums.ModeReglement;
import com.autoecole.entity.enums.Sexe;
import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.entity.enums.StatutInscription;
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
        private Sexe sexe;
        private String telephone;
        private String email;
        private String contactsUrgence;
        private LocalDate dateInscription;
        private LocalDate dateReceptionDossier;
        private LocalDate dateDepotDossier;
        private LocalDate dateEcheance;
        private StatutDossier statutDossier;
        private StatutInscription statutInscription;
        private Long inscriptionActiveId;
        private int numeroCycle;
        private Long categoriePermisId;
        private String categoriePermisCode;
        private String categoriePermisLibelle;
        private Long siteId;
        private String siteNom;
        private BigDecimal montantForfait;
        private BigDecimal totalVerse;
        private BigDecimal soldeRestant;
        private LocalDateTime dateCreation;
        private boolean procheExpiration;
        private long joursRestants;

        // Étape courante du parcours (Inscription -> Code -> Examen-Code -> ... -> Permis obtenu / Expiré).
        private EtapeParcours etapeParcours;

        // Progression du parcours d'examen (Code -> Créneau -> Circulation), indépendante
        // de la spécialité du moniteur consultant : sert à déterminer à quel moniteur
        // (de quelle spécialité) le candidat doit être proposé ensuite.
        private boolean codeReussi;
        private boolean creneauReussi;
        private boolean circulationReussi;

        // Indique si les frais de formation englobent la prise en charge totale
        // des frais d'examen par l'auto-école.
        private boolean priseEnChargeExamens;

        // Renseigné UNE SEULE FOIS, uniquement dans la réponse de création d'un candidat
        // dont le compte de connexion vient d'être généré automatiquement (jamais
        // re-transmis ni stocké ensuite) : à communiquer immédiatement au candidat.
        private IdentifiantsCompteDTO identifiantsCompte;
    }

    /** Identifiants affichés une seule fois à la Secrétaire/l'Admin qui valide l'inscription
     *  initiale d'un candidat, faute de mécanisme d'envoi d'email/SMS dans l'application. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IdentifiantsCompteDTO {
        private String username;
        private String motDePasseTemporaire;
    }

    /** Statistiques homme/femme (globales + par site) calculées sur le même sous-ensemble
     *  filtré que la liste de candidats affichée au-dessus, pour rester cohérentes avec les
     *  filtres actifs (recherche, site, étape, etc.). */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CandidatStatistiquesDTO {
        private long totalHommes;
        private long totalFemmes;
        private long totalNonRenseigne;
        private List<SiteStatSexeDTO> parSite;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SiteStatSexeDTO {
        private Long siteId;
        private String siteNom;
        private long hommes;
        private long femmes;
        private long nonRenseigne;
        private long total;
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

        @NotNull(message = "Le sexe est obligatoire")
        private Sexe sexe;

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

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.0", inclusive = false, message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;

        @NotNull(message = "Le site de formation est obligatoire")
        private Long siteId;

        // Nouveau par défaut si non précisé
        private StatutInscription statutInscription;

        // Premier versement optionnel/intégré
        private BigDecimal montantPremierVersement;
        private ModeReglement modeReglementPremierVersement;

        // Les frais de formation englobent-ils la prise en charge totale des frais d'examen ?
        private boolean priseEnChargeExamens;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReinscrireCandidatRequest {
        @NotNull(message = "La catégorie de permis est obligatoire")
        private Long categoriePermisId;

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.0", inclusive = false, message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;

        @NotNull(message = "Le site de formation est obligatoire")
        private Long siteId;

        @NotNull(message = "La date d'inscription est obligatoire")
        private LocalDate dateInscription;

        private BigDecimal montantPremierVersement;
        private ModeReglement modeReglementPremierVersement;

        // Les frais de formation englobent-ils la prise en charge totale des frais d'examen ?
        private boolean priseEnChargeExamens;
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

        @NotNull(message = "Le sexe est obligatoire")
        private Sexe sexe;

        @NotBlank(message = "Le numéro de téléphone est obligatoire")
        private String telephone;

        private String email;
        private String contactsUrgence;
        private LocalDate dateReceptionDossier;
        private LocalDate dateDepotDossier;

        @NotNull(message = "La catégorie de permis est obligatoire")
        private Long categoriePermisId;

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.0", inclusive = false, message = "Le montant doit être supérieur à 0")
        private BigDecimal montant;

        @NotNull(message = "Le site de formation est obligatoire")
        private Long siteId;

        // Les frais de formation englobent-ils la prise en charge totale des frais d'examen ?
        private boolean priseEnChargeExamens;
    }
}
