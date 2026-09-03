package com.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recus", indexes = {
    @Index(name = "idx_recu_numero", columnList = "numero_recu", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "paiement_id", nullable = false, unique = true)
    private Paiement paiement;

    @Column(name = "numero_recu", length = 30, unique = true, nullable = false)
    private String numeroRecu;

    @Builder.Default
    @Column(name = "date_emission", nullable = false)
    private LocalDateTime dateEmission = LocalDateTime.now();

    @Column(name = "nom_client", length = 200, nullable = false)
    private String nomClient;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal montant;

    @Column(name = "solde_restant", precision = 12, scale = 2, nullable = false)
    private BigDecimal soldeRestant;

    @Column(name = "imprime_par", length = 100)
    private String imprimePar;
}
