package com.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Une série de questions du Code de la route, créée librement par l'ADMIN (ex: "Série 53").
 * Remplace l'ancien découpage en "Cycles" calculé à la volée : chaque série a désormais ses
 * propres questions assignées explicitement, et sa propre taille (pas de taille globale fixe).
 */
@Entity
@Table(name = "code_series", indexes = {
    @Index(name = "idx_code_serie_ordre", columnList = "ordre", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SerieCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Détermine l'ordre d'affichage et le déblocage séquentiel (une série n'est disponible
     *  que si la précédente, dans cet ordre, a été réussie — quand cette règle est active). */
    @Column(nullable = false, unique = true)
    private int ordre;

    @Builder.Default
    @Column(nullable = false)
    private boolean actif = true;

    @Builder.Default
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
