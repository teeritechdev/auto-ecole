package com.autoecole.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "configuration_application")
@Getter
@Setter
@NoArgsConstructor
public class ConfigurationApplication {

    @Id
    private Long id = 1L;

    @Column(name = "logo_data", columnDefinition = "TEXT")
    private String logoData;

    /**
     * Prix unitaire des frais d'examen par épreuve, utilisés par la Caisse & Trésorerie
     * interne pour calculer automatiquement le montant à décaisser lors d'une prise en
     * charge de candidats programmés à une date d'examen donnée.
     */
    @Column(name = "prix_examen_code", precision = 12, scale = 2)
    private BigDecimal prixExamenCode = BigDecimal.ZERO;

    @Column(name = "prix_examen_creneau", precision = 12, scale = 2)
    private BigDecimal prixExamenCreneau = BigDecimal.ZERO;

    @Column(name = "prix_examen_circulation", precision = 12, scale = 2)
    private BigDecimal prixExamenCirculation = BigDecimal.ZERO;
}
