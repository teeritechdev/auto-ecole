package com.autoecole.entity;

import com.autoecole.entity.enums.EtapeParcours;
import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.entity.enums.StatutInscription;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inscriptions", indexes = {
    @Index(name = "idx_inscription_candidat", columnList = "candidat_id"),
    @Index(name = "idx_inscription_statut", columnList = "statut_dossier"),
    @Index(name = "idx_inscription_active", columnList = "candidat_id, active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categorie_permis_id", nullable = false)
    private CategoriePermis categoriePermis;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "site_id")
    private Site site;

    @Column(name = "montant_forfait", precision = 12, scale = 2, nullable = false)
    private BigDecimal montantForfait;

    @Column(name = "date_inscription", nullable = false)
    private LocalDate dateInscription;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance; // 8 mois après date_inscription

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_dossier", length = 30, nullable = false)
    @Builder.Default
    private StatutDossier statutDossier = StatutDossier.EN_COURS;

    /**
     * Indique si le candidat est nouveau ou déjà connu de l'auto-école (redoublant),
     * saisi par le secrétariat à l'inscription.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_inscription", length = 20, nullable = false)
    @Builder.Default
    private StatutInscription statutInscription = StatutInscription.NOUVEAU;

    @Column(name = "total_verse", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalVerse = BigDecimal.ZERO;

    @Column(name = "solde_restant", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal soldeRestant = BigDecimal.ZERO;

    /**
     * Numéro du cycle d'inscription pour ce candidat : 1 = inscription initiale,
     * 2 = 1ère reprise après expiration, etc.
     */
    @Column(name = "numero_cycle", nullable = false)
    @Builder.Default
    private int numeroCycle = 1;

    /**
     * Une seule inscription active par candidat à la fois : celle sur laquelle
     * portent les nouveaux paiements et passages d'examens. Les inscriptions
     * précédentes (expirées ou clôturées par une reprise) passent à false mais
     * restent consultables dans l'historique du candidat.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    /**
     * Référence vers l'inscription expirée que ce cycle reprend, le cas échéant.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_precedente_id")
    private Inscription inscriptionPrecedente;

    @Builder.Default
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    /**
     * Étape du parcours pédagogique (Inscription -> Code -> Examen-Code -> Créneau -> ...).
     * Avance/recule au fil des versements et des résultats d'examens (cf. ExamenService,
     * PaiementService) ; sert notamment à déterminer quels candidats un moniteur voit,
     * selon sa/ses spécialité(s).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "etape_parcours", length = 30, nullable = false)
    @Builder.Default
    private EtapeParcours etapeParcours = EtapeParcours.INSCRIPTION;

    /**
     * Méthode utilitaire de recalcul du statut et du solde de ce cycle d'inscription.
     */
    public void recalculerSoldeEtStatut() {
        if (this.montantForfait == null) {
            this.montantForfait = BigDecimal.ZERO;
        }
        if (this.totalVerse == null) {
            this.totalVerse = BigDecimal.ZERO;
        }
        this.soldeRestant = this.montantForfait.subtract(this.totalVerse);
        if (this.soldeRestant.compareTo(BigDecimal.ZERO) < 0) {
            this.soldeRestant = BigDecimal.ZERO;
        }

        LocalDate now = LocalDate.now();
        boolean estExpire = this.dateEcheance != null && now.isAfter(this.dateEcheance);

        if (this.soldeRestant.compareTo(BigDecimal.ZERO) == 0) {
            this.statutDossier = StatutDossier.SOLDE;
        } else if (estExpire) {
            this.statutDossier = StatutDossier.EXPIRE_NON_SOLDE;
        } else {
            this.statutDossier = StatutDossier.EN_COURS;
        }

        // Étape du parcours : l'expiration est prioritaire sur tout le reste ; sinon,
        // le premier versement fait passer le candidat d'Inscription à Code (les étapes
        // suivantes sont gérées par ExamenService au fil des examens programmés/notés).
        if (estExpire) {
            this.etapeParcours = EtapeParcours.EXPIRE;
        } else if (this.etapeParcours == EtapeParcours.INSCRIPTION && this.totalVerse.compareTo(BigDecimal.ZERO) > 0) {
            this.etapeParcours = EtapeParcours.CODE;
        }
    }
}
