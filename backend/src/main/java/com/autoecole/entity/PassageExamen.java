package com.autoecole.entity;

import com.autoecole.entity.enums.ResultatExamen;
import com.autoecole.entity.enums.StatutValidation;
import com.autoecole.entity.enums.TypeEpreuve;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "passages_examens", indexes = {
    @Index(name = "idx_passage_inscription", columnList = "inscription_id"),
    @Index(name = "idx_passage_epreuve", columnList = "type_epreuve"),
    @Index(name = "idx_passage_date", columnList = "date_passage")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_inscription_epreuve_passage", columnNames = {"inscription_id", "type_epreuve", "numero_passage"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PassageExamen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inscription_id", nullable = false)
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "session_id", nullable = false)
    private SessionExamen session;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_epreuve", length = 30, nullable = false)
    private TypeEpreuve typeEpreuve;

    @Column(name = "numero_passage", nullable = false)
    private Integer numeroPassage; // 1 à 5

    @Column(name = "date_passage", nullable = false)
    private LocalDate datePassage;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private ResultatExamen resultat = ResultatExamen.PROGRAMME;

    @Column(length = 500)
    private String observations;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "moniteur_id")
    private Utilisateur moniteur;

    @Builder.Default
    @Column(name = "date_enregistrement", nullable = false)
    private LocalDateTime dateEnregistrement = LocalDateTime.now();

    /**
     * Revue administrative : en attente à la programmation, validé (reste visible
     * partout), ou retiré (masqué de la session mais tracé côté moniteur pour
     * reprogrammation - cf. StatutValidation).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_validation", length = 20, nullable = false)
    @Builder.Default
    private StatutValidation statutValidation = StatutValidation.EN_ATTENTE;
}
