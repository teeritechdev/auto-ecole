package com.autoecole.entity;

import com.autoecole.entity.enums.TypeEpreuve;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Regroupe plusieurs candidats programmés ensemble pour la même épreuve, à la même
 * date, par le même moniteur — l'unité que le moniteur (ou l'administrateur)
 * consulte et gère (ajout/retrait de candidats) avant que l'examen n'ait lieu.
 */
@Entity
@Table(name = "sessions_examen", indexes = {
    @Index(name = "idx_session_date", columnList = "date_passage"),
    @Index(name = "idx_session_epreuve", columnList = "type_epreuve")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionExamen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_epreuve", length = 30, nullable = false)
    private TypeEpreuve typeEpreuve;

    @Column(name = "date_passage", nullable = false)
    private LocalDate datePassage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "moniteur_id")
    private Utilisateur moniteur;

    @Column(length = 500)
    private String observations;

    @Builder.Default
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
