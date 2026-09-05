package com.autoecole.controller;

import com.autoecole.dto.ExamenDTOs.*;
import com.autoecole.entity.enums.ResultatExamen;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.service.ExamenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/examens")
@RequiredArgsConstructor
@Tag(name = "Examens", description = "Suivi pédagogique et gestion des épreuves (Code, Créneau, Circulation)")
public class ExamenController {

    private final ExamenService examenService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITEUR', 'SECRETAIRE')")
    @Operation(summary = "Lister et filtrer les passages d'examens avec pagination")
    public ResponseEntity<Page<PassageExamenDTO>> filtrerPassages(
            @RequestParam(required = false) Long candidatId,
            @RequestParam(required = false) TypeEpreuve typeEpreuve,
            @RequestParam(required = false) ResultatExamen resultat,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @PageableDefault(size = 15, sort = "datePassage", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(examenService.filtrerPassages(candidatId, typeEpreuve, resultat, date, pageable));
    }

    @GetMapping("/candidat/{candidatId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITEUR', 'SECRETAIRE')")
    @Operation(summary = "Obtenir l'historique complet des passages d'un candidat")
    public ResponseEntity<List<PassageExamenDTO>> getPassagesByCandidat(@PathVariable Long candidatId) {
        return ResponseEntity.ok(examenService.getPassagesByCandidat(candidatId));
    }

    @GetMapping("/candidat/{candidatId}/bilan")
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITEUR', 'SECRETAIRE')")
    @Operation(summary = "Obtenir le bilan synthétique des 3 épreuves pour un candidat")
    public ResponseEntity<BilanExamensCandidatDTO> getBilanExamensCandidat(@PathVariable Long candidatId) {
        return ResponseEntity.ok(examenService.getBilanExamensCandidat(candidatId));
    }

    @GetMapping("/prochains")
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITEUR', 'SECRETAIRE')")
    @Operation(summary = "Obtenir les prochains examens programmés")
    public ResponseEntity<List<PassageExamenDTO>> getProchainsExamens() {
        return ResponseEntity.ok(examenService.getProchainsExamens());
    }

    @GetMapping("/a-valider")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lister les candidats proposés par les moniteurs")
    public ResponseEntity<List<PassageExamenDTO>> getPassagesAValider() {
        return ResponseEntity.ok(examenService.getPassagesAValider());
    }

    @PostMapping("/valider")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Valider plusieurs candidats pour leur épreuve")
    public ResponseEntity<List<PassageExamenDTO>> validerPassages(@Valid @RequestBody ValidationPassagesRequest request) {
        return ResponseEntity.ok(examenService.validerPassages(request.getPassageIds()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITEUR')")
    @Operation(summary = "Programmer ou enregistrer un passage d'examen (limite 5 passages par épreuve)")
    public ResponseEntity<PassageExamenDTO> programmerPassage(@Valid @RequestBody CreatePassageRequest request) {
        return new ResponseEntity<>(examenService.programmerOuEnregistrerPassage(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/resultat")
    @PreAuthorize("hasAnyRole('ADMIN', 'MONITEUR')")
    @Operation(summary = "Mettre à jour le résultat d'un passage (Réussi, Échec, Ajourné)")
    public ResponseEntity<PassageExamenDTO> updateResultat(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePassageRequest request
    ) {
        return ResponseEntity.ok(examenService.updateResultatPassage(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un passage d'examen (réservé ADMIN)")
    public ResponseEntity<Void> deletePassage(@PathVariable Long id) {
        examenService.deletePassage(id);
        return ResponseEntity.noContent().build();
    }
}
