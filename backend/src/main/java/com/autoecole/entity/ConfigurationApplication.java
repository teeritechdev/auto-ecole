package com.autoecole.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "configuration_application")
@Getter
@Setter
@NoArgsConstructor
public class ConfigurationApplication {

    @Id
    private Long id = 1L;

    @Column(name = "logo_data", columnDefinition = "TEXT")
    private String logoData;

    /** Photo d'illustration affichée en pleine hauteur sur le panneau gauche de l'écran de
     *  connexion (facultative : un dégradé de marque s'affiche tant qu'elle n'est pas définie). */
    @Column(name = "image_connexion", columnDefinition = "TEXT")
    private String imageConnexion;

    /** "cover" (remplit tout l'écran, recadre l'image si besoin) ou "contain" (l'image
     *  entière reste visible, sans recadrage) — réglable par l'ADMIN car une image très
     *  large peut sembler "zoomée" à outrance une fois recadrée en cover. */
    @Column(name = "image_connexion_ajustement", length = 20)
    private String imageConnexionAjustement = "cover";

    /** Identité affichée sur les documents officiels (reçus, PDF) et sur l'écran de
     *  connexion ; nullable en base, avec repli sur app.etablissement.nom (application.yml)
     *  tant qu'aucune valeur n'a été saisie par l'ADMIN (cf. ConfigurationController). */
    @Column(name = "nom_etablissement", length = 150)
    private String nomEtablissement;

    /** Sous-titre affiché sous le nom sur l'écran de connexion (ex: "Plateforme Intégrée
     *  de Gestion & Formation") ; nullable, avec un repli générique côté frontend tant
     *  qu'aucune valeur n'a été saisie par l'ADMIN. */
    @Column(name = "slogan", length = 150)
    private String slogan;

    @Column(name = "telephone", length = 30)
    private String telephone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "adresse_siege", length = 255)
    private String adresseSiege;

    /**
     * Prix unitaire des frais d'examen par épreuve, utilisés par la Caisse & Trésorerie
     * interne pour calculer automatiquement le montant à décaisser lors d'une prise en
     * charge de candidats programmés à une date d'examen donnée.
     */
    @Column(name = "prix_examen_code", precision = 12, scale = 2)
    private BigDecimal prixExamenCode = BigDecimal.ZERO;

    @Column(name = "prix_examen_creneau", precision = 12, scale = 2)
    private BigDecimal prixExamenCreneau = BigDecimal.ZERO;

    @Column(name = "prix_examen_circulation", precision = 12, scale = 2)
    private BigDecimal prixExamenCirculation = BigDecimal.ZERO;

    /** Numéro d'agrément délivré par le Ministère des Transports (DGTTM) pour exploiter
     *  l'auto-école, et sa date d'obtention/dernier renouvellement. */
    @Column(name = "numero_agrement", length = 50)
    private String numeroAgrement;

    @Column(name = "date_agrement")
    private LocalDate dateAgrement;

    /** Identifiants légaux affichés sur les documents officiels (RCCM et IFU, espace OHADA
     *  / Burkina Faso), plus le numéro de patente selon le régime fiscal de l'entreprise. */
    @Column(name = "rccm", length = 100)
    private String rccm;

    @Column(name = "ifu", length = 50)
    private String ifu;

    @Column(name = "numero_patente", length = 50)
    private String numeroPatente;

    @Column(name = "boite_postale", length = 50)
    private String boitePostale;

    /** Nom du responsable légal, affiché en pied des reçus (ex: "Le Directeur, ..."). */
    @Column(name = "nom_dirigeant", length = 150)
    private String nomDirigeant;

    /** Coordonnées de règlement affichées sur les documents officiels : compte bancaire
     *  et/ou numéro Mobile Money (Orange Money, Moov Money). */
    @Column(name = "compte_paiement", length = 255)
    private String comptePaiement;

    /** Mention légale libre affichée en pied de page des reçus/PDF (agrément, RCCM, IFU...),
     *  pour éviter de recomposer ce texte en dur dans le code de génération des documents. */
    @Column(name = "mention_legale_pied", length = 500)
    private String mentionLegalePied;
}
