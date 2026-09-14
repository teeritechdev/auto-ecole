package com.autoecole.entity;

import com.autoecole.entity.enums.TypeMouvementCaisse;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Une opération de la Caisse & Trésorerie interne : caisse de dépenses/recettes diverses
 * totalement autonome, indépendante des candidats, des inscriptions et des paiements de
 * formation (ceux-ci sont suivis exclusivement dans le module Paiements). Chaque opération
 * est rattachée à une {@link NatureOperation} qui détermine son sens (recette/dépense) —
 * ce sens n'est jamais ressaisi ici, il est copié depuis la nature au moment de la création.
 */
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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "nature_operation_id", nullable = false)
    private NatureOperation natureOperation;

    /** Copié depuis natureOperation.sens à la création (jamais saisi directement) : conservé
     *  en colonne propre pour que les agrégations (solde, totaux) restent de simples sommes. */
    @Enumerated(EnumType.STRING)
    @Column(name = "type_mouvement", length = 30, nullable = false)
    private TypeMouvementCaisse typeMouvement;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal montant;

    @Column(length = 255, nullable = false)
    private String libelle;

    @Column(name = "numero_facture", length = 100)
    private String numeroFacture;

    @Builder.Default
    @Column(name = "date_transaction", nullable = false)
    private LocalDateTime dateTransaction = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;
}
