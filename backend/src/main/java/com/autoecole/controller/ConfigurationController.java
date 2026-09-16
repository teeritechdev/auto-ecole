package com.autoecole.controller;

import com.autoecole.entity.ConfigurationApplication;
import com.autoecole.repository.ConfigurationApplicationRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.autoecole.exception.BadRequestException;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/configuration")
@RequiredArgsConstructor
@Tag(name = "Configuration", description = "Configuration visuelle de l'application")
public class ConfigurationController {

    private final ConfigurationApplicationRepository repository;

    /** Valeur de repli tant qu'aucun nom n'a été saisi par l'ADMIN dans l'onglet Identité. */
    @Value("${app.etablissement.nom}")
    private String nomEtablissementParDefaut;

    private String resoudreNom(ConfigurationApplication configuration) {
        String nom = configuration != null ? configuration.getNomEtablissement() : null;
        return (nom == null || nom.isBlank()) ? nomEtablissementParDefaut : nom;
    }

    @GetMapping("/logo")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Récupérer le logo de l'entreprise (affiché dans la barre latérale)")
    public ResponseEntity<LogoResponse> getLogo() {
        ConfigurationApplication configuration = repository.findById(1L).orElse(null);
        return ResponseEntity.ok(new LogoResponse(configuration != null ? configuration.getLogoData() : null));
    }

    @GetMapping("/identite")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Récupérer l'identité complète de l'auto-école (logo, nom, contact)")
    public ResponseEntity<IdentiteResponse> getIdentite() {
        ConfigurationApplication configuration = repository.findById(1L).orElse(null);
        return ResponseEntity.ok(new IdentiteResponse(
                configuration != null ? configuration.getLogoData() : null,
                configuration != null ? configuration.getImageConnexion() : null,
                resoudreNom(configuration),
                configuration != null ? configuration.getTelephone() : null,
                configuration != null ? configuration.getEmail() : null,
                configuration != null ? configuration.getAdresseSiege() : null
        ));
    }

    @PutMapping("/identite")
    @PreAuthorize("hasAuthority('PERM_CONFIGURATION_IDENTITE_MODIFIER')")
    @Operation(summary = "Modifier l'identité de l'auto-école (logo, nom, contact)")
    public ResponseEntity<IdentiteResponse> updateIdentite(@RequestBody IdentiteRequest request) {
        validateImage(request.getLogoData(), "Le logo", 2_800_000);
        validateImage(request.getImageConnexion(), "L'image de connexion", 4_200_000);
        ConfigurationApplication configuration = repository.findById(1L).orElseGet(ConfigurationApplication::new);
        configuration.setLogoData(request.getLogoData());
        configuration.setImageConnexion(request.getImageConnexion());
        configuration.setNomEtablissement(request.getNomEtablissement() != null ? request.getNomEtablissement().trim() : null);
        configuration.setTelephone(request.getTelephone());
        configuration.setEmail(request.getEmail());
        configuration.setAdresseSiege(request.getAdresseSiege());
        repository.save(configuration);
        return ResponseEntity.ok(new IdentiteResponse(
                configuration.getLogoData(),
                configuration.getImageConnexion(),
                resoudreNom(configuration),
                configuration.getTelephone(),
                configuration.getEmail(),
                configuration.getAdresseSiege()
        ));
    }

    private void validateImage(String imageData, String libelleAvecArticle, int tailleMaxCaracteres) {
        if (imageData == null || imageData.isBlank()) return;
        if (!imageData.matches("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$")) {
            throw new BadRequestException("Format d'image non pris en charge (" + libelleAvecArticle + ")");
        }
        if (imageData.length() > tailleMaxCaracteres) {
            throw new BadRequestException(libelleAvecArticle + " ne doit pas dépasser " + (tailleMaxCaracteres / 1_400_000) + " Mo environ");
        }
    }

    @GetMapping("/tarifs-examens")
    @PreAuthorize("hasAuthority('PERM_CONFIGURATION_TARIFS_VOIR')")
    @Operation(summary = "Récupérer le prix unitaire des frais d'examen par épreuve")
    public ResponseEntity<TarifsExamensResponse> getTarifsExamens() {
        ConfigurationApplication configuration = repository.findById(1L).orElseGet(ConfigurationApplication::new);
        return ResponseEntity.ok(new TarifsExamensResponse(
                configuration.getPrixExamenCode(),
                configuration.getPrixExamenCreneau(),
                configuration.getPrixExamenCirculation()
        ));
    }

    @PutMapping("/tarifs-examens")
    @PreAuthorize("hasAuthority('PERM_CONFIGURATION_TARIFS_MODIFIER')")
    @Operation(summary = "Modifier le prix unitaire des frais d'examen par épreuve")
    public ResponseEntity<TarifsExamensResponse> updateTarifsExamens(@RequestBody TarifsExamensRequest request) {
        validerTarif(request.getPrixExamenCode());
        validerTarif(request.getPrixExamenCreneau());
        validerTarif(request.getPrixExamenCirculation());

        ConfigurationApplication configuration = repository.findById(1L).orElseGet(ConfigurationApplication::new);
        configuration.setPrixExamenCode(request.getPrixExamenCode());
        configuration.setPrixExamenCreneau(request.getPrixExamenCreneau());
        configuration.setPrixExamenCirculation(request.getPrixExamenCirculation());
        repository.save(configuration);

        return ResponseEntity.ok(new TarifsExamensResponse(
                configuration.getPrixExamenCode(),
                configuration.getPrixExamenCreneau(),
                configuration.getPrixExamenCirculation()
        ));
    }

    private void validerTarif(BigDecimal tarif) {
        if (tarif == null || tarif.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Le prix d'un examen ne peut pas être négatif");
        }
    }

    @Data
    @RequiredArgsConstructor
    public static class LogoResponse {
        private final String logoData;
    }

    @Data
    public static class IdentiteRequest {
        private String logoData;
        private String imageConnexion;
        private String nomEtablissement;
        private String telephone;
        private String email;
        private String adresseSiege;
    }

    @Data
    @RequiredArgsConstructor
    public static class IdentiteResponse {
        private final String logoData;
        private final String imageConnexion;
        private final String nomEtablissement;
        private final String telephone;
        private final String email;
        private final String adresseSiege;
    }

    @Data
    public static class TarifsExamensRequest {
        private BigDecimal prixExamenCode;
        private BigDecimal prixExamenCreneau;
        private BigDecimal prixExamenCirculation;
    }

    @Data
    @RequiredArgsConstructor
    public static class TarifsExamensResponse {
        private final BigDecimal prixExamenCode;
        private final BigDecimal prixExamenCreneau;
        private final BigDecimal prixExamenCirculation;
    }
}
