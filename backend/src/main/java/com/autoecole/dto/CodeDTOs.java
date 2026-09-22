package com.autoecole.dto;

import com.autoecole.entity.enums.LettreReponse;
import com.autoecole.entity.enums.StatutTentativeCode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class CodeDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeConfigurationDTO {
        private int seuilReussite;
        private int tempsParQuestionSecondes;
        private int dureeMaxSerieSecondes;
        private boolean repriseAutoriseeApresEchec;
        private boolean retourQuestionPrecedenteAutorise;
        private boolean correctionImmediate;
        private boolean deblocageAutomatiqueSerieSuivante;
        private Integer dureeExpirationAccesJours;

        // Informations calculées, pour affichage (§4, §22 du cahier des charges du module)
        private long nombreDeSeries;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateCodeConfigurationRequest {
        @Min(value = 1, message = "Le seuil de réussite doit être supérieur à 0")
        private int seuilReussite;

        @Min(value = 1, message = "Le temps par question doit être supérieur à 0")
        private int tempsParQuestionSecondes;

        @Min(value = 1, message = "La durée maximale de la série doit être supérieure à 0")
        private int dureeMaxSerieSecondes;

        private boolean repriseAutoriseeApresEchec;
        private boolean retourQuestionPrecedenteAutorise;
        private boolean correctionImmediate;
        private boolean deblocageAutomatiqueSerieSuivante;

        @Min(value = 1, message = "La durée d'expiration de l'accès doit être supérieure à 0 jour")
        private Integer dureeExpirationAccesJours;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeSerieDTO {
        private Long id;
        private String nom;
        private String description;
        private int ordre;
        private boolean actif;
        private long nombreQuestions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCodeSerieRequest {
        @NotBlank(message = "Le nom de la série est obligatoire")
        private String nom;

        private String description;

        // Optionnel : si absent, la série est ajoutée en fin de liste
        private Integer ordre;

        private Boolean actif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateCodeSerieRequest {
        @NotBlank(message = "Le nom de la série est obligatoire")
        private String nom;

        private String description;

        @NotNull(message = "L'ordre est obligatoire")
        private Integer ordre;

        private boolean actif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeQuestionDTO {
        private Long id;
        private Long serieId;
        private int ordre;
        private String enonce;
        private String imageData;
        private String reponseA;
        private String reponseB;
        private String reponseC;
        private String reponseD;
        private String sousTitreGroupeAB;
        private String sousTitreGroupeCD;
        private int nombreOptions;
        private Set<LettreReponse> bonnesReponses;
        private String explication;
        private boolean actif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCodeQuestionRequest {
        @NotNull(message = "La série est obligatoire")
        private Long serieId;

        // Optionnel : si absent, la question est ajoutée à la fin de la série
        private Integer ordre;

        @NotBlank(message = "L'énoncé est obligatoire")
        private String enonce;

        private String imageData;

        // Optionnels : une question "façon scan" affiche déjà les choix dans l'image
        private String reponseA;
        private String reponseB;
        private String reponseC;
        private String reponseD;

        // Optionnels : libellés de sous-groupe façon examen officiel (ex: "pour aller à
        // la station service" au-dessus de A/B, "pour aller à Dreux" au-dessus de C/D)
        private String sousTitreGroupeAB;
        private String sousTitreGroupeCD;

        @NotNull(message = "Le nombre de choix est obligatoire")
        @Min(value = 2, message = "Le nombre de choix doit être entre 2 et 4")
        @Max(value = 4, message = "Le nombre de choix doit être entre 2 et 4")
        private Integer nombreOptions;

        @NotEmpty(message = "Au moins une bonne réponse doit être désignée")
        private Set<LettreReponse> bonnesReponses;

        private String explication;
        private Boolean actif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateCodeQuestionRequest {
        @NotNull(message = "L'ordre est obligatoire")
        private Integer ordre;

        @NotBlank(message = "L'énoncé est obligatoire")
        private String enonce;

        private String imageData;

        // Optionnels : une question "façon scan" affiche déjà les choix dans l'image
        private String reponseA;
        private String reponseB;
        private String reponseC;
        private String reponseD;

        private String sousTitreGroupeAB;
        private String sousTitreGroupeCD;

        @NotNull(message = "Le nombre de choix est obligatoire")
        @Min(value = 2, message = "Le nombre de choix doit être entre 2 et 4")
        @Max(value = 4, message = "Le nombre de choix doit être entre 2 et 4")
        private Integer nombreOptions;

        @NotEmpty(message = "Au moins une bonne réponse doit être désignée")
        private Set<LettreReponse> bonnesReponses;

        private String explication;
        private boolean actif;
    }

    /** Question telle que présentée au candidat pendant une tentative : jamais la bonne
     *  réponse ni l'explication, pour empêcher toute triche côté client (cf. §18 du cahier
     *  des charges du module : ne jamais faire confiance à Angular pour la sécurité). */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeQuestionPourCandidatDTO {
        private Long id;
        private int ordre;
        private String enonce;
        private String imageData;
        private String reponseA;
        private String reponseB;
        private String reponseC;
        private String reponseD;
        private String sousTitreGroupeAB;
        private String sousTitreGroupeCD;
        private int nombreOptions;
    }

    public enum StatutSerie {
        VERROUILLE,
        DISPONIBLE,
        REUSSI,
        ECHEC,
        EN_COURS
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeSerieStatutDTO {
        private Long serieId;
        private String serieNom;
        private int nombreQuestions;
        private StatutSerie statut;
        private Integer meilleurScore;
        private int nbTentativesUtilisees;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeProgressionDTO {
        private Long candidatId;
        private int totalSeries;
        private int seriesReussies;
        private double pourcentageProgression;
        private boolean accesExpire;
        private List<CodeSerieStatutDTO> series;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TentativeEnCoursDTO {
        private Long tentativeId;
        private Long serieId;
        private String serieNom;
        private int numeroTentative;
        private int indexQuestionCourante;
        private int totalQuestionsDeLaSerie;
        private CodeQuestionPourCandidatDTO question;
        private int tempsParQuestionSecondes;
        private int dureeMaxSerieSecondes;
        private LocalDateTime dateDebut;
        private LocalDateTime dateAffichageQuestionCourante;
        private boolean retourAutorise;
        private boolean peutRevenirEnArriere;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepondreQuestionRequest {
        // Vide/nul si le candidat n'a pas eu le temps de répondre (le frontend l'envoie
        // à l'expiration locale du minuteur ; le serveur revérifie de toute façon le délai).
        private Set<LettreReponse> reponses;
    }

    /** Correction de la question qui vient d'être répondue, renseignée uniquement par
     *  /answer et uniquement si la configuration "correction immédiate" était active au
     *  démarrage de la tentative (snapCorrectionImmediate) — jamais avant que le candidat
     *  n'ait répondu, jamais si le paramètre est désactivé. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CorrectionReponseDTO {
        private boolean correcte;
        private Set<LettreReponse> bonnesReponses;
        private String explication;
    }

    /** Réponse à /answer, /precedente, /start et /tentatives/{id} : soit la tentative se
     *  poursuit (question suivante), soit elle vient de se terminer (résultat) — exactement
     *  un des deux champs est renseigné. "correction" n'est renseignée que par /answer,
     *  lorsque la configuration "correction immédiate" est active pour cette tentative. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EtatTentativeDTO {
        private TentativeEnCoursDTO enCours;
        private CodeResultatTentativeDTO resultat;
        private CorrectionReponseDTO correction;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeResultatTentativeDTO {
        private Long tentativeId;
        private Long serieId;
        private String serieNom;
        private int score;
        private int totalQuestions;
        private int seuilReussite;
        private StatutTentativeCode statut;
        private boolean reussi;
        private boolean serieSuivanteDebloquee;
        private boolean peutReprendre;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeHistoriqueLigneDTO {
        private Long tentativeId;
        private Long serieId;
        private String serieNom;
        private int numeroTentative;
        private LocalDateTime dateDebut;
        private LocalDateTime dateFin;
        private int score;
        private int totalQuestions;
        private StatutTentativeCode statut;
    }
}
