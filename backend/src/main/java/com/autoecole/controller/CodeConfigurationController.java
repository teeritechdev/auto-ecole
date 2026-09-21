package com.autoecole.controller;

import com.autoecole.dto.CodeDTOs.CodeConfigurationDTO;
import com.autoecole.dto.CodeDTOs.UpdateCodeConfigurationRequest;
import com.autoecole.service.CodeConfigurationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/code/configuration")
@RequiredArgsConstructor
@Tag(name = "Code de la route - Configuration", description = "Règles appliquées au module d'entraînement au Code (Cycles, chronomètre, tentatives)")
public class CodeConfigurationController {

    private final CodeConfigurationService configurationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITEUR') or hasAuthority('PERM_CODE_CONFIGURATION_GERER')")
    @Operation(summary = "Récupérer la configuration du module Code de la route")
    public ResponseEntity<CodeConfigurationDTO> getConfiguration() {
        return ResponseEntity.ok(configurationService.getConfiguration());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITEUR') or hasAuthority('PERM_CODE_CONFIGURATION_GERER')")
    @Operation(summary = "Modifier la configuration du module Code de la route")
    public ResponseEntity<CodeConfigurationDTO> updateConfiguration(@Valid @RequestBody UpdateCodeConfigurationRequest request) {
        return ResponseEntity.ok(configurationService.updateConfiguration(request));
    }
}
