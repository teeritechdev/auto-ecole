package com.autoecole.entity;

import com.autoecole.entity.enums.ResultatExamen;
import com.autoecole.entity.enums.TypeEpreuve;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "passages_examens", indexes = {
    @Index(name = "idx_passage_candidat", columnList = "candidat_id"),
    @Index(name = "idx_passage_epreuve", columnList = "type_epreuve"),
    @Index(name = "idx_passage_date", columnList = "date_passage")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_candidat_epreuve_passage", columnNames = {"candidat_id", "type_epreuve", "numero_passage"})
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
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;

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

    @Builder.Default
    @Column(name = "valide_par_admin", nullable = false)
    private boolean valideParAdmin = false;
}
