package com.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Catalogue technique des permissions du système : chaque permission correspond à un point
 * de contrôle d'accès réel dans le code (un endpoint, une action d'écran). Ce catalogue est
 * défini par le code (cf. DataInitializerService), pas par l'administrateur — seule
 * l'attribution des permissions à un {@link Profil} est configurable depuis l'interface.
 */
@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 60, unique = true, nullable = false)
    private String code;

    @Column(length = 50, nullable = false)
    private String module;

    @Column(length = 150, nullable = false)
    private String libelle;
}
