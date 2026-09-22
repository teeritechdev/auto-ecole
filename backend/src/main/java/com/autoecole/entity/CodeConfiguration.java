package com.autoecole.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Règles appliquées par le module Code de la route, en une seule ligne (id=1), même
 * patron singleton que ConfigurationApplication. Modifiable par ADMIN et MONITEUR.
 */
@Entity
@Table(name = "code_configuration")
@Getter
@Setter
@NoArgsConstructor
public class CodeConfiguration {

    @Id
    private Long id = 1L;

    @Column(name = "seuil_reussite", nullable = false)
    private int seuilReussite = 24;

    @Column(name = "temps_par_question_secondes", nullable = false)
    private int tempsParQuestionSecondes = 30;

    @Column(name = "duree_max_serie_secondes", nullable = false)
    private int dureeMaxSerieSecondes = 900;

    @Column(name = "tentatives_max", nullable = false)
    private int tentativesMax = 3;

    @Column(name = "reprise_autorisee_apres_echec", nullable = false)
    private boolean repriseAutoriseeApresEchec = true;

    @Column(name = "retour_question_precedente_autorise", nullable = false)
    private boolean retourQuestionPrecedenteAutorise = true;

    @Column(name = "correction_immediate", nullable = false)
    private boolean correctionImmediate = true;

    /**
     * true (par défaut) : une série n'est disponible qu'après réussite de la précédente
     * (dans l'ordre des séries). false : toutes les séries sont disponibles dès le départ
     * (pas de verrouillage séquentiel).
     */
    @Column(name = "deblocage_automatique_serie_suivante", nullable = false)
    private boolean deblocageAutomatiqueSerieSuivante = true;

    /** Nombre de jours après la date d'inscription au-delà desquels l'accès au module Code
     *  est fermé ; null = pas d'expiration propre au module (indépendante des 8 mois de
     *  validité de l'inscription, cf. §14 du cahier des charges du module Code). */
    @Column(name = "duree_expiration_acces_jours")
    private Integer dureeExpirationAccesJours;
}
