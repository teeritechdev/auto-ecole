package com.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, unique = true, nullable = false)
    private String nom;

    @Column(length = 255)
    private String adresse;

    @Builder.Default
    @Column(nullable = false)
    private boolean actif = true;
}
