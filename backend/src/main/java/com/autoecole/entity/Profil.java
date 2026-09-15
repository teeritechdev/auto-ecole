package com.autoecole.entity;

import com.autoecole.entity.enums.RoleEnum;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

/**
 * Profil de permissions assignable à un utilisateur. Les 5 profils "système" (un par
 * {@link RoleEnum}) sont créés automatiquement et reproduisent le comportement historique
 * de l'application ; l'administrateur peut en outre créer des profils personnalisés avec
 * exactement les permissions voulues (cf. ProfilService).
 *
 * Distinct du {@link Role} de l'utilisateur : le rôle reste le type technique du compte
 * (il conditionne des règles métier indépendantes des permissions, comme la restriction par
 * site ou les spécialités d'un moniteur - cf. SiteAccessService) ; le profil détermine quelles
 * fonctionnalités lui sont accessibles.
 */
@Entity
@Table(name = "profils")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, unique = true, nullable = false)
    private String nom;

    @Column(length = 255)
    private String description;

    /** Vrai pour les 5 profils créés automatiquement (un par rôle) : non supprimables. */
    @Builder.Default
    @Column(nullable = false)
    private boolean systeme = false;

    /** Renseigné uniquement pour un profil système : le rôle qu'il représente par défaut. */
    @Enumerated(EnumType.STRING)
    @Column(name = "role_systeme", length = 30, unique = true)
    private RoleEnum roleSysteme;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "profil_permissions",
            joinColumns = @JoinColumn(name = "profil_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"))
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();
}
