package com.autoecole.entity;

import com.autoecole.entity.enums.TypeMouvementCaisse;
import jakarta.persistence.*;
import lombok.*;

/**
 * Nature d'une opération de Caisse & Trésorerie (ex : "Achat carburant", "Salaires",
 * "Entretien véhicule") : catalogue géré par l'ADMIN, indépendant du code. Le sens
 * (recette/dépense) est fixé une fois pour toutes ici et hérité par chaque opération qui
 * utilise cette nature — jamais ressaisi au niveau de l'opération elle-même.
 */
@Entity
@Table(name = "natures_operation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NatureOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 30, nullable = false, unique = true)
    private String code;

    @Column(length = 150, nullable = false)
    private String libelle;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private TypeMouvementCaisse sens;

    @Column(name = "plan_comptable", length = 30)
    private String planComptable;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(nullable = false)
    private boolean actif = true;
}
