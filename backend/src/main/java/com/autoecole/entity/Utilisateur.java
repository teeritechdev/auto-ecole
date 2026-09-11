package com.autoecole.entity;

import com.autoecole.entity.enums.TypeEpreuve;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "utilisateurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, unique = true, nullable = false)
    private String username;

    @Column(length = 100, unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 100, nullable = false)
    private String nom;

    @Column(length = 100, nullable = false)
    private String prenom;

    @Column(length = 30)
    private String telephone;

    @Column(name = "photo_profile", columnDefinition = "TEXT")
    private String photoProfile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /**
     * Site de rattachement, principalement utilisé pour les moniteurs :
     * détermine les candidats auxquels ils ont accès (cf. RoleEnum.MONITEUR).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "site_id")
    private Site site;

    /**
     * Épreuves dans lesquelles le moniteur est spécialisé (Code, Créneau, Circulation).
     * Sans objet pour les autres rôles.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "moniteur_specialites", joinColumns = @JoinColumn(name = "utilisateur_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "specialite", length = 20)
    @Builder.Default
    private Set<TypeEpreuve> specialites = new HashSet<>();

    @Builder.Default
    @Column(nullable = false)
    private boolean actif = true;

    @Builder.Default
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
