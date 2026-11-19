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
import java.time.LocalDate;

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

    /** Valeur de repli tant qu'aucun slogan n'a été saisi par l'ADMIN. */
    private static final String SLOGAN_PAR_DEFAUT = "Plateforme Intégrée de Gestion & Formation";

    private String resoudreSlogan(ConfigurationApplication configuration) {
        String slogan = configuration != null ? configuration.getSlogan() : null;
        return (slogan == null || slogan.isBlank()) ? SLOGAN_PAR_DEFAUT : slogan;
    }

    @GetMapping("/logo")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Récupérer le logo, le nom et le slogan de l'entreprise (affichés dans la barre latérale et l'en-tête) — volontairement sans l'image de connexion ni les champs légaux, inutiles à cet endroit et lourds à transporter à chaque chargement de page")
    public ResponseEntity<LogoResponse> getLogo() {
        ConfigurationApplication configuration = repository.findById(1L).orElse(null);
        String logo = configuration != null ? configuration.getLogoData() : null;
        if (logo == null || logo.isBlank()) {
            logo = chargerLogoParDefaut();
        }
        return ResponseEntity.ok(new LogoResponse(
                logo,
                resoudreNom(configuration),
                resoudreSlogan(configuration)
        ));
    }

    @GetMapping("/identite")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Récupérer l'identité complète de l'auto-école (logo, nom, contact)")
    public ResponseEntity<IdentiteResponse> getIdentite() {
        ConfigurationApplication configuration = repository.findById(1L).orElse(null);
        return ResponseEntity.ok(construireIdentiteResponse(configuration));
    }

    @PutMapping("/identite")
    @PreAuthorize("hasAuthority('PERM_CONFIGURATION_IDENTITE_MODIFIER')")
    @Operation(summary = "Modifier l'identité de l'auto-école (logo, nom, contact)")
    public ResponseEntity<IdentiteResponse> updateIdentite(@RequestBody IdentiteRequest request) {
        validateImage(request.getLogoData(), "Le logo", 2_800_000);
        validateImage(request.getImageConnexion(), "L'image de connexion", 4_200_000);
        validerAjustement(request.getImageConnexionAjustement());
        ConfigurationApplication configuration = repository.findById(1L).orElseGet(ConfigurationApplication::new);
        configuration.setLogoData(request.getLogoData());
        configuration.setImageConnexion(request.getImageConnexion());
        configuration.setImageConnexionAjustement(request.getImageConnexionAjustement() != null ? request.getImageConnexionAjustement() : "cover");
        configuration.setNomEtablissement(request.getNomEtablissement() != null ? request.getNomEtablissement().trim() : null);
        configuration.setSlogan(request.getSlogan() != null ? request.getSlogan().trim() : null);
        configuration.setActivites(request.getActivites() != null ? request.getActivites().trim() : null);
        configuration.setCodeEtablissement(request.getCodeEtablissement() != null ? request.getCodeEtablissement().trim() : null);
        configuration.setDevise(request.getDevise() != null ? request.getDevise().trim() : null);
        configuration.setTelephone(request.getTelephone());
        configuration.setEmail(request.getEmail());
        configuration.setAdresseSiege(request.getAdresseSiege());
        configuration.setNumeroAgrement(request.getNumeroAgrement());
        configuration.setDateAgrement(request.getDateAgrement());
        configuration.setRccm(request.getRccm());
        configuration.setIfu(request.getIfu());
        configuration.setNumeroPatente(request.getNumeroPatente());
        configuration.setBoitePostale(request.getBoitePostale());
        configuration.setNomDirigeant(request.getNomDirigeant());
        configuration.setComptePaiement(request.getComptePaiement());
        configuration.setMentionLegalePied(request.getMentionLegalePied());
        repository.save(configuration);
        return ResponseEntity.ok(construireIdentiteResponse(configuration));
    }

    private String chargerLogoParDefaut() {
        try (java.io.InputStream is = getClass().getResourceAsStream("/default-logo-baraka.txt")) {
            if (is != null) {
                return new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8).trim();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private IdentiteResponse construireIdentiteResponse(ConfigurationApplication configuration) {
        String logo = configuration != null ? configuration.getLogoData() : null;
        if (logo == null || logo.isBlank()) {
            logo = chargerLogoParDefaut();
        }

        return new IdentiteResponse(
                logo,
                configuration != null ? configuration.getImageConnexion() : null,
                configuration != null ? configuration.getImageConnexionAjustement() : "cover",
                resoudreNom(configuration),
                resoudreSlogan(configuration),
                configuration != null && configuration.getActivites() != null ? configuration.getActivites() : "FORMATION- ASSISTANCE ET PRESTATIONS DIVERSES EN SECURITE ROUTIERE - IMPORT EXPORT",
                configuration != null && configuration.getCodeEtablissement() != null ? configuration.getCodeEtablissement() : "AE 206",
                configuration != null && configuration.getDevise() != null ? configuration.getDevise() : "« Juste conduire »",
                configuration != null && configuration.getTelephone() != null ? configuration.getTelephone() : "76 15 97 72 – 53 58 26 01 – 79 09 33 52",
                configuration != null ? configuration.getEmail() : null,
                configuration != null && configuration.getAdresseSiege() != null ? configuration.getAdresseSiege() : "Secteur 15, Ouagadougou, Burkina Faso",
                configuration != null && configuration.getNumeroAgrement() != null ? configuration.getNumeroAgrement() : "N° 2026-0428-MATM/SG/DGTTM",
                configuration != null && configuration.getDateAgrement() != null ? configuration.getDateAgrement() : LocalDate.of(2026, 7, 30),
                configuration != null && configuration.getRccm() != null ? configuration.getRccm() : "BF-OUA-01-2024 B13-17114",
                configuration != null && configuration.getIfu() != null ? configuration.getIfu() : "00253566L",
                configuration != null ? configuration.getNumeroPatente() : null,
                configuration != null ? configuration.getBoitePostale() : null,
                configuration != null ? configuration.getNomDirigeant() : null,
                configuration != null ? configuration.getComptePaiement() : null,
                configuration != null && configuration.getMentionLegalePied() != null ? configuration.getMentionLegalePied() : "Autorisation d'exploitation N° 2026-0428-MATM/SG/DGTTM du 30/07/2026 — RCCM : BF-OUA-01-2024 B13-17114 — IFU n° : 00253566L"
        );
    }

    private void validateImage(String imageData, String libelleAvecArticle, int tailleMaxCaracteres) {
        if (imageData == null || imageData.isBlank()) return;
        // Insensible à la casse et tolérant sur "jpg" vs "jpeg" : certains navigateurs/OS
        // déduisent un type MIME légèrement différent selon l'origine du fichier (capture
        // d'écran, image transférée via une messagerie, etc.).
        if (!imageData.matches("(?i)^data:image/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$")) {
            throw new BadRequestException("Format d'image non pris en charge (" + libelleAvecArticle + ")");
        }
        if (imageData.length() > tailleMaxCaracteres) {
            throw new BadRequestException(libelleAvecArticle + " ne doit pas dépasser " + (tailleMaxCaracteres / 1_400_000) + " Mo environ");
        }
    }

    private void validerAjustement(String ajustement) {
        if (ajustement != null && !ajustement.equals("cover") && !ajustement.equals("contain")) {
            throw new BadRequestException("Ajustement d'image invalide");
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
        private final String nomEtablissement;
        private final String slogan;
    }

    @Data
    public static class IdentiteRequest {
        private String logoData;
        private String imageConnexion;
        private String imageConnexionAjustement;
        private String nomEtablissement;
        private String slogan;
        private String activites;
        private String codeEtablissement;
        private String devise;
        private String telephone;
        private String email;
        private String adresseSiege;
        private String numeroAgrement;
        private LocalDate dateAgrement;
        private String rccm;
        private String ifu;
        private String numeroPatente;
        private String boitePostale;
        private String nomDirigeant;
        private String comptePaiement;
        private String mentionLegalePied;
    }

    @Data
    @RequiredArgsConstructor
    public static class IdentiteResponse {
        private final String logoData;
        private final String imageConnexion;
        private final String imageConnexionAjustement;
        private final String nomEtablissement;
        private final String slogan;
        private final String activites;
        private final String codeEtablissement;
        private final String devise;
        private final String telephone;
        private final String email;
        private final String adresseSiege;
        private final String numeroAgrement;
        private final LocalDate dateAgrement;
        private final String rccm;
        private final String ifu;
        private final String numeroPatente;
        private final String boitePostale;
        private final String nomDirigeant;
        private final String comptePaiement;
        private final String mentionLegalePied;
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
