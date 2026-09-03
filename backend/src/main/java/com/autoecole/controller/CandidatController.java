package com.autoecole.controller;

import com.autoecole.dto.CandidatDTOs.*;
import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.service.CandidatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/candidats")
@RequiredArgsConstructor
@Tag(name = "Candidats", description = "Gestion des dossiers et inscriptions des candidats")
public class CandidatController {

    private final CandidatService candidatService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETAIRE', 'CAISSIERE', 'MONITEUR')")
    @Operation(summary = "Rechercher et filtrer les candidats avec pagination")
    public ResponseEntity<Page<CandidatDTO>> rechercherCandidats(
            @RequestParam(required = false) String recherche,
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) Long categorieId,
            @PageableDefault(size = 15, sort = "dateInscription", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(candidatService.rechercherCandidats(recherche, statut, categorieId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETAIRE', 'CAISSIERE', 'MONITEUR')")
    @Operation(summary = "Obtenir la fiche complète d'un candidat")
    public ResponseEntity<CandidatDTO> getCandidatById(@PathVariable Long id) {
        return ResponseEntity.ok(candidatService.getCandidatById(id));
    }

    @GetMapping("/dossier/{numeroDossier}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETAIRE', 'CAISSIERE', 'MONITEUR')")
    @Operation(summary = "Rechercher un candidat par son numéro de dossier")
    public ResponseEntity<CandidatDTO> getCandidatByNumeroDossier(@PathVariable String numeroDossier) {
        return ResponseEntity.ok(candidatService.getCandidatByNumeroDossier(numeroDossier));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETAIRE')")
    @Operation(summary = "Créer un nouveau candidat avec inscription et 1er versement optionnel")
    public ResponseEntity<CandidatDTO> createCandidat(@Valid @RequestBody CreateCandidatRequest request) {
        return new ResponseEntity<>(candidatService.createCandidat(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETAIRE')")
    @Operation(summary = "Modifier les informations d'un candidat")
    public ResponseEntity<CandidatDTO> updateCandidat(@PathVariable Long id, @Valid @RequestBody UpdateCandidatRequest request) {
        return ResponseEntity.ok(candidatService.updateCandidat(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un dossier candidat (réservé ADMIN)")
    public ResponseEntity<Void> deleteCandidat(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Suppression administrative") String motif
    ) {
        candidatService.deleteCandidat(id, motif);
        return ResponseEntity.noContent().build();
    }
}
