package com.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "forfaits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Forfait {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, unique = true, nullable = false)
    private String nom;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montant;

    @Column(length = 255)
    private String description;

    @Builder.Default
    @Column(nullable = false)
    private boolean actif = true;
}
