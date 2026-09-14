package com.autoecole.entity;

import com.autoecole.entity.enums.LettreReponse;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Une question de la banque du Code de la route. L'ordre définit à la fois l'affichage
 * stable (pas de mélange aléatoire, cf. §4 du cahier des charges du module) et le découpage
 * en Cycles, calculé à la volée par CodeQuestionService (pas de table CodeCycle persistée).
 */
@Entity
@Table(name = "code_questions", indexes = {
    @Index(name = "idx_code_question_ordre", columnList = "ordre", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private int ordre;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String enonce;

    /** Image encodée en base64 (data URL), même convention que le logo de l'application. */
    @Column(name = "image_data", columnDefinition = "TEXT")
    private String imageData;

    @Column(name = "reponse_a", nullable = false, length = 500)
    private String reponseA;

    @Column(name = "reponse_b", nullable = false, length = 500)
    private String reponseB;

    @Column(name = "reponse_c", length = 500)
    private String reponseC;

    @Column(name = "reponse_d", length = 500)
    private String reponseD;

    @Enumerated(EnumType.STRING)
    @Column(name = "bonne_reponse", nullable = false, length = 1)
    private LettreReponse bonneReponse;

    @Column(columnDefinition = "TEXT")
    private String explication;

    @Builder.Default
    @Column(nullable = false)
    private boolean actif = true;

    @Builder.Default
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
