package com.autoecole.entity;

import com.autoecole.entity.enums.ModeReglement;
import com.autoecole.entity.enums.TypeEpreuve;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements", indexes = {
    @Index(name = "idx_paiement_inscription", columnList = "inscription_id"),
    @Index(name = "idx_paiement_date", columnList = "date_paiement")
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
    @JoinColumn(name = "inscription_id", nullable = false)
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    /** Renseigné uniquement pour un versement de type FRAIS_EXAMEN : indique pour quelle
     *  épreuve (Code/Créneau/Circulation) ce paiement, distinct du forfait de formation, a
     *  été encaissé. */
    @Enumerated(EnumType.STRING)
    @Column(name = "type_epreuve", length = 30)
    private TypeEpreuve typeEpreuve;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal montant;

    @Builder.Default
    @Column(name = "date_paiement", nullable = false)
    private LocalDateTime datePaiement = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_reglement", length = 30, nullable = false)
    @Builder.Default
    private ModeReglement modeReglement = ModeReglement.ESPECES;

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
