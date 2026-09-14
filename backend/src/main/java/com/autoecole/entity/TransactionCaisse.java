package com.autoecole.entity;

import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.entity.enums.TypeOperationCaisse;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "transactions_caisse", indexes = {
    @Index(name = "idx_caisse_date", columnList = "date_transaction"),
    @Index(name = "idx_caisse_type", columnList = "type_mouvement")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionCaisse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_mouvement", length = 30, nullable = false)
    private TypeMouvementCaisse typeMouvement;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal montant;

    @Column(length = 255, nullable = false)
    private String libelle;

    @Column(length = 100)
    private String categorie;

    @Column(name = "reference_piece", length = 100)
    private String referencePiece;

    @Builder.Default
    @Column(name = "date_transaction", nullable = false)
    private LocalDateTime dateTransaction = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paiement_id")
    private Paiement paiement;

    /**
     * Sous-type de l'opération, pour la caisse interne indépendante des paiements de
     * formation (cf. CaisseService) : FRAIS_EXAMEN (décaissement calculé automatiquement),
     * PRELEVEMENT_FORMATION (encaissement puisé dans les frais de formation), ou AUTRE
     * (saisie libre classique).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type_operation", length = 30, nullable = false)
    @Builder.Default
    private TypeOperationCaisse typeOperation = TypeOperationCaisse.AUTRE;

    /** Renseigné uniquement pour un décaissement de type FRAIS_EXAMEN. */
    @Column(name = "date_examen")
    private LocalDate dateExamen;

    /** Renseigné uniquement pour un décaissement de type FRAIS_EXAMEN. */
    @Enumerated(EnumType.STRING)
    @Column(name = "type_epreuve_examen", length = 30)
    private TypeEpreuve typeEpreuveExamen;

    /** Candidats couverts par un décaissement FRAIS_EXAMEN (traçabilité). */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "transaction_caisse_candidats",
            joinColumns = @JoinColumn(name = "transaction_caisse_id"),
            inverseJoinColumns = @JoinColumn(name = "candidat_id"))
    @Builder.Default
    private Set<Candidat> candidatsConcernes = new HashSet<>();
}
