package com.autoecole.controller;

import com.autoecole.dto.CodeDTOs.CodeSerieDTO;
import com.autoecole.dto.CodeDTOs.CreateCodeSerieRequest;
import com.autoecole.dto.CodeDTOs.UpdateCodeSerieRequest;
import com.autoecole.service.CodeSerieService;
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
@RequestMapping("/api/code/series")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MONITEUR') or hasAuthority('PERM_CODE_QUESTIONS_GERER')")
@Tag(name = "Code de la route - Séries", description = "Gestion des séries de questions du Code de la route")
public class CodeSerieController {

    private final CodeSerieService serieService;

    @GetMapping
    @Operation(summary = "Lister toutes les séries, dans l'ordre")
    public ResponseEntity<List<CodeSerieDTO>> getAllSeries() {
        return ResponseEntity.ok(serieService.getAllSeries());
    }

    @PostMapping
    @Operation(summary = "Créer une nouvelle série")
    public ResponseEntity<CodeSerieDTO> createSerie(@Valid @RequestBody CreateCodeSerieRequest request) {
        return new ResponseEntity<>(serieService.createSerie(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une série")
    public ResponseEntity<CodeSerieDTO> updateSerie(@PathVariable Long id, @Valid @RequestBody UpdateCodeSerieRequest request) {
        return ResponseEntity.ok(serieService.updateSerie(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une série vide (sans question)")
    public ResponseEntity<Void> deleteSerie(@PathVariable Long id) {
        serieService.deleteSerie(id);
        return ResponseEntity.noContent().build();
    }
}
