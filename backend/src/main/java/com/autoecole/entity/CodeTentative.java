package com.autoecole.entity;

import com.autoecole.entity.enums.StatutTentativeCode;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Une tentative d'un candidat sur une {@link SerieCode} donnée. Les colonnes "snap*" figent
 * la configuration réellement appliquée au moment du démarrage, pour qu'une modification
 * ultérieure des règles ne réinterprète jamais rétroactivement une tentative déjà en cours
 * ou terminée.
 */
@Entity
@Table(name = "code_tentatives", indexes = {
    @Index(name = "idx_code_tentative_candidat", columnList = "candidat_id"),
    @Index(name = "idx_code_tentative_candidat_serie", columnList = "candidat_id, serie_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeTentative {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;

    /** Inscription active au moment du démarrage de la tentative, si nécessaire. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id")
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "serie_id", nullable = false)
    private SerieCode serie;

    @Column(name = "numero_tentative", nullable = false)
    private int numeroTentative;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    /** Timestamp serveur d'affichage de la question courante : base du contrôle du
     *  temps par question, non falsifiable côté client. */
    @Column(name = "date_affichage_question_courante")
    private LocalDateTime dateAffichageQuestionCourante;

    @Builder.Default
    @Column(name = "index_question_courante", nullable = false)
    private int indexQuestionCourante = 0;

    @Builder.Default
    @Column(nullable = false)
    private int score = 0;

    @Builder.Default
    @Column(name = "nb_bonnes_reponses", nullable = false)
    private int nbBonnesReponses = 0;

    @Builder.Default
    @Column(name = "nb_mauvaises_reponses", nullable = false)
    private int nbMauvaisesReponses = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private StatutTentativeCode statut = StatutTentativeCode.EN_COURS;

    // --- Configuration appliquée à cette tentative (snapshot, cf. javadoc de la classe) ---

    /** Nombre de questions de cette série au moment du démarrage de la tentative (fixé une
     *  fois pour toutes : ajouter/retirer des questions à la série ensuite ne doit jamais
     *  réinterpréter rétroactivement une tentative déjà en cours ou terminée). */
    @Column(name = "total_questions_serie", nullable = false)
    private int totalQuestionsSerie;

    @Column(name = "snap_seuil_reussite", nullable = false)
    private int snapSeuilReussite;

    @Column(name = "snap_temps_par_question_secondes", nullable = false)
    private int snapTempsParQuestionSecondes;

    @Column(name = "snap_duree_max_serie_secondes", nullable = false)
    private int snapDureeMaxSerieSecondes;

    @Column(name = "snap_retour_autorise", nullable = false)
    private boolean snapRetourAutorise;

    @Column(name = "snap_correction_immediate", nullable = false)
    private boolean snapCorrectionImmediate;
}
