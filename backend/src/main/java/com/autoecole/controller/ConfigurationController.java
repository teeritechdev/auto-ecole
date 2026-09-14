package com.autoecole.controller;

import com.autoecole.entity.ConfigurationApplication;
import com.autoecole.repository.ConfigurationApplicationRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("/logo")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Récupérer le logo de l'entreprise")
    public ResponseEntity<LogoResponse> getLogo() {
        ConfigurationApplication configuration = repository.findById(1L).orElse(null);
        return ResponseEntity.ok(new LogoResponse(configuration != null ? configuration.getLogoData() : null));
    }

    @PutMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier le logo de l'entreprise")
    public ResponseEntity<LogoResponse> updateLogo(@RequestBody LogoRequest request) {
        validateLogo(request.getLogoData());
        ConfigurationApplication configuration = repository.findById(1L).orElseGet(ConfigurationApplication::new);
        configuration.setLogoData(request.getLogoData());
        repository.save(configuration);
        return ResponseEntity.ok(new LogoResponse(configuration.getLogoData()));
    }

    private void validateLogo(String logoData) {
        if (logoData == null || logoData.isBlank()) return;
        if (!logoData.matches("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$")) {
            throw new BadRequestException("Format de logo non pris en charge");
        }
        if (logoData.length() > 2_800_000) {
            throw new BadRequestException("Le logo ne doit pas dépasser 2 Mo");
        }
    }

    @GetMapping("/tarifs-examens")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAISSIERE')")
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
    @PreAuthorize("hasRole('ADMIN')")
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
    public static class LogoRequest {
        private String logoData;
    }

    @Data
    @RequiredArgsConstructor
    public static class LogoResponse {
        private final String logoData;
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
