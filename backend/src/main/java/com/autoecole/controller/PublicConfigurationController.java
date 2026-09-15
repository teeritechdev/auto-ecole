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
 * Identité minimale (nom, logo) exposée SANS authentification pour l'écran de connexion :
 * ce point d'entrée reste volontairement en dehors de /api/configuration (réservé aux
 * utilisateurs authentifiés) et n'expose ni tarifs ni coordonnées de contact.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Configuration publique", description = "Identité de l'auto-école affichée avant connexion")
public class PublicConfigurationController {

    private final ConfigurationApplicationRepository repository;

    @Value("${app.etablissement.nom}")
    private String nomEtablissementParDefaut;

    @GetMapping("/identite")
    @Operation(summary = "Récupérer le nom et le logo de l'auto-école pour l'écran de connexion")
    public ResponseEntity<IdentitePubliqueResponse> getIdentitePublique() {
        ConfigurationApplication configuration = repository.findById(1L).orElse(null);
        String nom = configuration != null ? configuration.getNomEtablissement() : null;
        if (nom == null || nom.isBlank()) {
            nom = nomEtablissementParDefaut;
        }
        return ResponseEntity.ok(new IdentitePubliqueResponse(nom, configuration != null ? configuration.getLogoData() : null));
    }

    @Data
    @AllArgsConstructor
    public static class IdentitePubliqueResponse {
        private String nomEtablissement;
        private String logoData;
    }
}
