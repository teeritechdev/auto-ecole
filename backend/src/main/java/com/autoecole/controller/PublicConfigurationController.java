package com.autoecole.controller;

import com.autoecole.entity.ConfigurationApplication;
import com.autoecole.repository.ConfigurationApplicationRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Identité minimale exposée SANS authentification pour l'écran de connexion (nom, logo,
 * illustration, et coordonnées publiques déjà imprimées sur les documents officiels) :
 * ce point d'entrée reste volontairement en dehors de /api/configuration (réservé aux
 * utilisateurs authentifiés) et n'expose toujours pas les tarifs.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Configuration publique", description = "Identité de l'auto-école affichée avant connexion")
public class PublicConfigurationController {

    private final ConfigurationApplicationRepository repository;

    @Value("${app.etablissement.nom}")
    private String nomEtablissementParDefaut;

    private static final String SLOGAN_PAR_DEFAUT = "Plateforme Intégrée de Gestion & Formation";

    @GetMapping("/identite")
    @Operation(summary = "Récupérer l'identité (nom, slogan, logo, image, contact) de l'auto-école pour l'écran de connexion")
    public ResponseEntity<IdentitePubliqueResponse> getIdentitePublique() {
        ConfigurationApplication configuration = repository.findById(1L).orElse(null);
        String nom = configuration != null ? configuration.getNomEtablissement() : null;
        if (nom == null || nom.isBlank()) {
            nom = nomEtablissementParDefaut;
        }
        String slogan = configuration != null ? configuration.getSlogan() : null;
        if (slogan == null || slogan.isBlank()) {
            slogan = SLOGAN_PAR_DEFAUT;
        }
        String logo = configuration != null ? configuration.getLogoData() : null;
        if (logo == null || logo.isBlank()) {
            try (java.io.InputStream is = getClass().getResourceAsStream("/default-logo-baraka.txt")) {
                if (is != null) {
                    logo = new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8).trim();
                }
            } catch (Exception ignored) {}
        }
        String telephone = configuration != null && configuration.getTelephone() != null ? configuration.getTelephone() : "76 15 97 72 – 53 58 26 01 – 79 09 33 52";
        String adresse = configuration != null && configuration.getAdresseSiege() != null ? configuration.getAdresseSiege() : "Secteur 15, Ouagadougou, Burkina Faso";

        return ResponseEntity.ok(new IdentitePubliqueResponse(
                nom,
                slogan,
                logo,
                configuration != null ? configuration.getImageConnexion() : null,
                configuration != null ? configuration.getImageConnexionAjustement() : "cover",
                telephone,
                adresse
        ));
    }

    @Data
    @AllArgsConstructor
    public static class IdentitePubliqueResponse {
        private String nomEtablissement;
        private String slogan;
        private String logoData;
        private String imageConnexion;
        private String imageConnexionAjustement;
        private String telephone;
        private String adresseSiege;
    }
}
