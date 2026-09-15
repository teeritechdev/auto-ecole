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

    /**
     * Nullable : un compte CANDIDAT auto-créé (cf. CandidatAccountService) n'a pas
     * nécessairement d'email connu — l'authentification se fait alors par username.
     */
    @Column(length = 100, unique = true)
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
     * Profil de permissions assigné à l'utilisateur (cf. Profil). Nullable en base pour ne
     * pas casser les lignes existantes lors de la migration ; toujours résolu par
     * l'application (à défaut, le profil système correspondant au rôle) - cf.
     * UtilisateurService et DataInitializerService.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "profil_id")
    private Profil profil;

    /**
     * Sites de rattachement, principalement utilisés pour les moniteurs :
     * déterminent les candidats auxquels ils ont accès (cf. RoleEnum.MONITEUR).
     * Un moniteur peut être affecté à plusieurs sites, comme pour ses spécialités.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "moniteur_sites",
            joinColumns = @JoinColumn(name = "utilisateur_id"),
            inverseJoinColumns = @JoinColumn(name = "site_id"))
    @Builder.Default
    private Set<Site> sites = new HashSet<>();

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

    /**
     * Dossier candidat associé, pour un compte de rôle CANDIDAT auto-créé à la première
     * inscription (cf. CandidatAccountService). Nul pour tous les autres rôles.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidat_id", unique = true)
    private Candidat candidat;

    /**
     * Force le changement de mot de passe à la prochaine connexion : utilisé pour le mot
     * de passe temporaire généré automatiquement lors de la création d'un compte CANDIDAT.
     */
    @Builder.Default
    @org.hibernate.annotations.ColumnDefault("false")
    @Column(name = "doit_changer_mot_de_passe", nullable = false)
    private boolean doitChangerMotDePasse = false;
}
