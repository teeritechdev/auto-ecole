package com.autoecole.entity;

import com.autoecole.entity.enums.ModeReglement;
import com.autoecole.entity.enums.StatutPaiement;
import com.autoecole.entity.enums.TypeVersement;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements", indexes = {
    @Index(name = "idx_paiement_candidat", columnList = "candidat_id"),
    @Index(name = "idx_paiement_date", columnList = "date_paiement"),
    @Index(name = "idx_paiement_statut", columnList = "statut")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_versement", length = 30, nullable = false)
    private TypeVersement typeVersement;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal montant;

    @Builder.Default
    @Column(name = "date_paiement", nullable = false)
    private LocalDateTime datePaiement = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_reglement", length = 30, nullable = false)
    @Builder.Default
    private ModeReglement modeReglement = ModeReglement.ESPECES;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    @Builder.Default
    private StatutPaiement statut = StatutPaiement.VALIDE;

    @Column(name = "motif_modification", length = 255)
    private String motifModification;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_modif_id")
    private Utilisateur utilisateurModif;

    @OneToOne(mappedBy = "paiement", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Recu recu;
}
