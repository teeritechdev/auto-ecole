package com.autoecole.controller;

import com.autoecole.dto.ParametrageDTOs.CategoriePermisDTO;
import com.autoecole.dto.ParametrageDTOs.SiteDTO;
import com.autoecole.dto.ParametrageDTOs.SiteStatDTO;
import com.autoecole.service.ParametrageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parametrage")
@RequiredArgsConstructor
@Tag(name = "Paramétrage", description = "Gestion des catégories de permis (avec tarif) et sites de formation")
public class ParametrageController {

    private final ParametrageService parametrageService;

    // --- Catégories ---
    @GetMapping("/categories")
    @Operation(summary = "Lister les catégories de permis")
    public ResponseEntity<List<CategoriePermisDTO>> getAllCategories(@RequestParam(defaultValue = "false") boolean onlyActive) {
        return ResponseEntity.ok(parametrageService.getAllCategories(onlyActive));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer une nouvelle catégorie de permis")
    public ResponseEntity<CategoriePermisDTO> createCategorie(@Valid @RequestBody CategoriePermisDTO dto) {
        return new ResponseEntity<>(parametrageService.createCategorie(dto), HttpStatus.CREATED);
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier une catégorie de permis")
    public ResponseEntity<CategoriePermisDTO> updateCategorie(@PathVariable Long id, @Valid @RequestBody CategoriePermisDTO dto) {
        return ResponseEntity.ok(parametrageService.updateCategorie(id, dto));
    }

    // --- Sites de formation ---
    @GetMapping("/sites")
    @Operation(summary = "Lister les sites de formation")
    public ResponseEntity<List<SiteDTO>> getAllSites(@RequestParam(defaultValue = "false") boolean onlyActive) {
        return ResponseEntity.ok(parametrageService.getAllSites(onlyActive));
    }

    @PostMapping("/sites")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un nouveau site de formation")
    public ResponseEntity<SiteDTO> createSite(@Valid @RequestBody SiteDTO dto) {
        return new ResponseEntity<>(parametrageService.createSite(dto), HttpStatus.CREATED);
    }

    @PutMapping("/sites/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier un site de formation")
    public ResponseEntity<SiteDTO> updateSite(@PathVariable Long id, @Valid @RequestBody SiteDTO dto) {
        return ResponseEntity.ok(parametrageService.updateSite(id, dto));
    }

    @GetMapping("/sites/statistiques")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Statistiques par site (candidats actifs, montants encaissés et restants dus)")
    public ResponseEntity<List<SiteStatDTO>> getStatistiquesSites() {
        return ResponseEntity.ok(parametrageService.getStatistiquesSites());
    }
}
