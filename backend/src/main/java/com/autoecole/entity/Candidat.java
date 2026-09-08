package com.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "candidats", indexes = {
    @Index(name = "idx_candidat_num_dossier", columnList = "numero_dossier", unique = true),
    @Index(name = "idx_candidat_nom", columnList = "nom, prenom")
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

    @Column(name = "date_reception_dossier")
    private LocalDate dateReceptionDossier;

    @Column(name = "date_depot_dossier")
    private LocalDate dateDepotDossier;

    @Builder.Default
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    /**
     * Historique complet des cycles d'inscription du candidat (inscription initiale
     * puis reprises successives après expiration). Une seule est "active" à la fois.
     */
    @Builder.Default
    @OneToMany(mappedBy = "candidat", fetch = FetchType.LAZY)
    private List<Inscription> inscriptions = new ArrayList<>();
}
