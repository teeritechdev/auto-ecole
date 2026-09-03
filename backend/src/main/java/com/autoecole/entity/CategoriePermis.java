package com.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories_permis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoriePermis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20, unique = true, nullable = false)
    private String code; // A1, B, C, etc.

    @Column(length = 100, nullable = false)
    private String libelle;

    @Column(length = 255)
    private String description;

    @Builder.Default
    @Column(nullable = false)
    private boolean actif = true;
}
