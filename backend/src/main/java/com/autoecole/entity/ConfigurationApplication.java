package com.autoecole.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

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
}
