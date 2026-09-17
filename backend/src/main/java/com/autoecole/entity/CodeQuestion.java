package com.autoecole.entity;

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

    /** Image encodée en base64 (data URL), même convention que le logo de l'application.
     *  Pour une question "façon scan" (l'image contient déjà l'énoncé et les choix A/B/C/D),
     *  reponseA-D peuvent rester vides : cf. nombreOptions et getNombreOptionsEffectif(). */
    @Column(name = "image_data", columnDefinition = "TEXT")
    private String imageData;

    @Column(name = "reponse_a", length = 500)
    private String reponseA;

    @Column(name = "reponse_b", length = 500)
    private String reponseB;

    @Column(name = "reponse_c", length = 500)
    private String reponseC;

    @Column(name = "reponse_d", length = 500)
    private String reponseD;

    /** Nombre de choix affichés pour cette question (2 à 4). Nul pour les questions créées
     *  avant la réforme multi-réponses/texte-optionnel : cf. getNombreOptionsEffectif(), qui
     *  retombe alors sur la présence de texte en C/D (toutes les lettres existaient forcément
     *  dans l'ancien modèle). Ce champ redevient définitif dès la première modification de la
     *  question, une fois le formulaire d'administration réenregistré. */
    @Column(name = "nombre_options")
    private Integer nombreOptions;

    /** CSV trié des lettres correctes (ex: "A" ou "A,C", cf. LettreReponse.toCsv/fromCsv).
     *  Réutilise la colonne "bonne_reponse" du modèle à réponse unique d'avant la réforme :
     *  une lettre seule y était déjà stockée sous cette forme, donc aucune migration n'est
     *  nécessaire pour les questions existantes. */
    @Column(name = "bonne_reponse", nullable = false, length = 20)
    private String bonneReponses;

    public int getNombreOptionsEffectif() {
        if (nombreOptions != null) return nombreOptions;
        if (reponseD != null && !reponseD.isBlank()) return 4;
        if (reponseC != null && !reponseC.isBlank()) return 3;
        return 2;
    }

    @Column(columnDefinition = "TEXT")
    private String explication;

    @Builder.Default
    @Column(nullable = false)
    private boolean actif = true;

    @Builder.Default
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
