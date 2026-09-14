package com.autoecole.dto;

import com.autoecole.entity.enums.LettreReponse;
import com.autoecole.entity.enums.StatutTentativeCode;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class CodeDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeConfigurationDTO {
        private int questionsParCycle;
        private int seuilReussite;
        private int tempsParQuestionSecondes;
        private int dureeMaxCycleSecondes;
        private int tentativesMax;
        private boolean repriseAutoriseeApresEchec;
        private boolean retourQuestionPrecedenteAutorise;
        private boolean correctionImmediate;
        private boolean deblocageAutomatiqueCycleSuivant;
        private Integer dureeExpirationAccesJours;

        // Informations calculées, pour affichage (§4, §22 du cahier des charges du module)
        private long nombreQuestionsActives;
        private int nombreDeCycles;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateCodeConfigurationRequest {
        @Min(value = 1, message = "Le nombre de questions par Cycle doit être supérieur à 0")
        private int questionsParCycle;

        @Min(value = 1, message = "Le seuil de réussite doit être supérieur à 0")
        private int seuilReussite;

        @Min(value = 1, message = "Le temps par question doit être supérieur à 0")
        private int tempsParQuestionSecondes;

        @Min(value = 1, message = "La durée maximale du Cycle doit être supérieure à 0")
        private int dureeMaxCycleSecondes;

        @Min(value = 1, message = "Le nombre de tentatives doit être supérieur à 0")
        private int tentativesMax;

        private boolean repriseAutoriseeApresEchec;
        private boolean retourQuestionPrecedenteAutorise;
        private boolean correctionImmediate;
        private boolean deblocageAutomatiqueCycleSuivant;

        @Min(value = 1, message = "La durée d'expiration de l'accès doit être supérieure à 0 jour")
        private Integer dureeExpirationAccesJours;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeQuestionDTO {
        private Long id;
        private int ordre;
        private String enonce;
        private String imageData;
        private String reponseA;
        private String reponseB;
        private String reponseC;
        private String reponseD;
        private LettreReponse bonneReponse;
        private String explication;
        private boolean actif;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCodeQuestionRequest {
        // Optionnel : si absent, la question est ajoutée à la fin de la banque
        private Integer ordre;

        @NotBlank(message = "L'énoncé est obligatoire")
        private String enonce;

        private String imageData;

        @NotBlank(message = "La réponse A est obligatoire")
        private String reponseA;

        @NotBlank(message = "La réponse B est obligatoire")
        private String reponseB;

        private String reponseC;
        private String reponseD;

        @NotNull(message = "La bonne réponse est obligatoire")
        private LettreReponse bonneReponse;

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

        @NotBlank(message = "La réponse A est obligatoire")
        private String reponseA;

        @NotBlank(message = "La réponse B est obligatoire")
        private String reponseB;

        private String reponseC;
        private String reponseD;

        @NotNull(message = "La bonne réponse est obligatoire")
        private LettreReponse bonneReponse;

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
    }

    public enum StatutCycle {
        VERROUILLE,
        DISPONIBLE,
        REUSSI,
        ECHEC
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeCycleStatutDTO {
        private int numeroCycle;
        private int nombreQuestions;
        private StatutCycle statut;
        private Integer meilleurScore;
        private int nbTentativesUtilisees;
        private int tentativesMax;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeProgressionDTO {
        private Long candidatId;
        private int totalCycles;
        private int cyclesReussis;
        private double pourcentageProgression;
        private boolean accesExpire;
        private List<CodeCycleStatutDTO> cycles;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TentativeEnCoursDTO {
        private Long tentativeId;
        private int numeroCycle;
        private int numeroTentative;
        private int indexQuestionCourante;
        private int totalQuestionsDuCycle;
        private CodeQuestionPourCandidatDTO question;
        private int tempsParQuestionSecondes;
        private int dureeMaxCycleSecondes;
        private LocalDateTime dateDebut;
        private LocalDateTime dateAffichageQuestionCourante;
        private boolean retourAutorise;
        private boolean peutRevenirEnArriere;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepondreQuestionRequest {
        // Nulle si le candidat n'a pas eu le temps de répondre (le frontend l'envoie
        // à l'expiration locale du minuteur ; le serveur revérifie de toute façon le délai).
        private LettreReponse reponse;
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
        private LettreReponse bonneReponse;
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
        private int numeroCycle;
        private int score;
        private int totalQuestions;
        private int seuilReussite;
        private StatutTentativeCode statut;
        private boolean reussi;
        private boolean cycleSuivantDebloque;
        private boolean peutReprendre;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeHistoriqueLigneDTO {
        private Long tentativeId;
        private int numeroCycle;
        private int numeroTentative;
        private LocalDateTime dateDebut;
        private LocalDateTime dateFin;
        private int score;
        private int totalQuestions;
        private StatutTentativeCode statut;
    }
}
