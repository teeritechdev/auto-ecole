package com.autoecole.entity;

import com.autoecole.entity.enums.TypeMouvementCaisse;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

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
}
