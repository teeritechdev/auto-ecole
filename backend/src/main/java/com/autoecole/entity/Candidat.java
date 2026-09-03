package com.autoecole.entity;

import com.autoecole.entity.enums.StatutDossier;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidats", indexes = {
    @Index(name = "idx_candidat_num_dossier", columnList = "numero_dossier", unique = true),
    @Index(name = "idx_candidat_nom", columnList = "nom, prenom"),
    @Index(name = "idx_candidat_statut", columnList = "statut_dossier")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_dossier", length = 30, unique = true, nullable = false)
    private String numeroDossier;

    @Column(length = 100, nullable = false)
    private String nom;

    @Column(length = 100, nullable = false)
    private String prenom;

    @Column(name = "date_naissance", nullable = false)
    private LocalDate dateNaissance;

    @Column(name = "lieu_naissance", length = 100)
    private String lieuNaissance;

    @Column(length = 30, nullable = false)
    private String telephone;

    @Column(length = 100)
    private String email;

    @Column(name = "contacts_urgence", length = 255)
    private String contactsUrgence;

    @Column(name = "date_inscription", nullable = false)
    private LocalDate dateInscription;

    @Column(name = "date_reception_dossier")
    private LocalDate dateReceptionDossier;

    @Column(name = "date_depot_dossier")
    private LocalDate dateDepotDossier;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance; // 8 mois après date_inscription

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_dossier", length = 30, nullable = false)
    @Builder.Default
    private StatutDossier statutDossier = StatutDossier.EN_COURS;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categorie_permis_id", nullable = false)
    private CategoriePermis categoriePermis;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "forfait_id", nullable = false)
    private Forfait forfait;

    @Column(name = "montant_forfait", precision = 12, scale = 2, nullable = false)
    private BigDecimal montantForfait;

    @Column(name = "total_verse", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalVerse = BigDecimal.ZERO;

    @Column(name = "solde_restant", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal soldeRestant = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    /**
     * Méthode utilitaire de recalcul du statut et du solde
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
    }
}
