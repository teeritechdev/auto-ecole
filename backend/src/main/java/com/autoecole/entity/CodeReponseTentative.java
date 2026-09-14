package com.autoecole.entity;

import com.autoecole.entity.enums.LettreReponse;
import jakarta.persistence.*;
import lombok.*;

/**
 * Réponse (ou absence de réponse, si le temps imparti est écoulé) d'un candidat à une
 * question donnée, dans le cadre d'une tentative de Cycle.
 */
@Entity
@Table(name = "code_reponses_tentative", indexes = {
    @Index(name = "idx_code_reponse_tentative", columnList = "tentative_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeReponseTentative {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tentative_id", nullable = false)
    private CodeTentative tentative;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private CodeQuestion question;

    @Column(name = "ordre_dans_cycle", nullable = false)
    private int ordreDansCycle;

    /** Nulle si le candidat n'a pas répondu à temps. */
    @Enumerated(EnumType.STRING)
    @Column(name = "reponse_donnee", length = 1)
    private LettreReponse reponseDonnee;

    @Column(nullable = false)
    private boolean correcte;

    @Column(name = "temps_reponse_secondes")
    private Integer tempsReponseSecondes;
}
