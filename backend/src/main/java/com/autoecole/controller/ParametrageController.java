package com.autoecole.controller;

import com.autoecole.dto.ParametrageDTOs.CategoriePermisDTO;
import com.autoecole.dto.ParametrageDTOs.ForfaitDTO;
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
@Tag(name = "Paramétrage", description = "Gestion des forfaits et catégories de permis")
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

    // --- Forfaits ---
    @GetMapping("/forfaits")
    @Operation(summary = "Lister les forfaits disponibles")
    public ResponseEntity<List<ForfaitDTO>> getAllForfaits(@RequestParam(defaultValue = "false") boolean onlyActive) {
        return ResponseEntity.ok(parametrageService.getAllForfaits(onlyActive));
    }

    @PostMapping("/forfaits")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un nouveau forfait")
    public ResponseEntity<ForfaitDTO> createForfait(@Valid @RequestBody ForfaitDTO dto) {
        return new ResponseEntity<>(parametrageService.createForfait(dto), HttpStatus.CREATED);
    }

    @PutMapping("/forfaits/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier un forfait")
    public ResponseEntity<ForfaitDTO> updateForfait(@PathVariable Long id, @Valid @RequestBody ForfaitDTO dto) {
        return ResponseEntity.ok(parametrageService.updateForfait(id, dto));
    }
}
