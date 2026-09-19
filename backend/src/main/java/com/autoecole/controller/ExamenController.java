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
    @PreAuthorize("hasAuthority('PERM_EXAMENS_VOIR')")
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
    @PreAuthorize("hasAuthority('PERM_EXAMENS_VOIR')")
    @Operation(summary = "Obtenir l'historique complet des passages d'un candidat")
    public ResponseEntity<List<PassageExamenDTO>> getPassagesByCandidat(@PathVariable Long candidatId) {
        return ResponseEntity.ok(examenService.getPassagesByCandidat(candidatId));
    }

    @GetMapping("/candidat/{candidatId}/bilan")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_VOIR')")
    @Operation(summary = "Obtenir le bilan synthétique des 3 épreuves pour un candidat")
    public ResponseEntity<BilanExamensCandidatDTO> getBilanExamensCandidat(@PathVariable Long candidatId) {
        return ResponseEntity.ok(examenService.getBilanExamensCandidat(candidatId));
    }

    @GetMapping("/prochains")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_VOIR')")
    @Operation(summary = "Obtenir les prochains examens programmés")
    public ResponseEntity<List<PassageExamenDTO>> getProchainsExamens() {
        return ResponseEntity.ok(examenService.getProchainsExamens());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_EXAMENS_PROGRAMMER')")
    @Operation(summary = "Programmer ou enregistrer un passage d'examen (limite 5 passages par épreuve)")
    public ResponseEntity<PassageExamenDTO> programmerPassage(@Valid @RequestBody CreatePassageRequest request) {
        return new ResponseEntity<>(examenService.programmerOuEnregistrerPassage(request), HttpStatus.CREATED);
    }

    @PostMapping("/sessions")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_PROGRAMMER')")
    @Operation(summary = "Créer une session d'examen pour un groupe de candidats")
    public ResponseEntity<SessionExamenDTO> creerSession(@Valid @RequestBody CreatePassageBulkRequest request) {
        return new ResponseEntity<>(examenService.creerSession(request), HttpStatus.CREATED);
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_VOIR')")
    @Operation(summary = "Lister les sessions d'examen")
    public ResponseEntity<List<SessionExamenDTO>> listerSessions() {
        return ResponseEntity.ok(examenService.listerSessions());
    }

    @GetMapping("/sessions/{id}")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_VOIR')")
    @Operation(summary = "Détail d'une session d'examen et de ses candidats")
    public ResponseEntity<SessionExamenDTO> getSessionDetail(@PathVariable Long id) {
        return ResponseEntity.ok(examenService.getSessionDetail(id));
    }

    @PostMapping("/sessions/{id}/candidats")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_GERER_SESSION')")
    @Operation(summary = "Ajouter des candidats à une session d'examen existante")
    public ResponseEntity<SessionExamenDTO> ajouterCandidatsASession(
            @PathVariable Long id,
            @Valid @RequestBody AjouterCandidatsSessionRequest request
    ) {
        return ResponseEntity.ok(examenService.ajouterCandidatsASession(id, request));
    }

    @DeleteMapping("/sessions/{id}/candidats/{passageId}")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_GERER_SESSION')")
    @Operation(summary = "Retirer un candidat d'une session d'examen")
    public ResponseEntity<Void> retirerCandidatDeSession(@PathVariable Long id, @PathVariable Long passageId) {
        examenService.retirerCandidatDeSession(id, passageId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/sessions/{id}")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_GERER_SESSION')")
    @Operation(summary = "Modifier la date d'une session d'examen")
    public ResponseEntity<SessionExamenDTO> modifierDateSession(@PathVariable Long id, @Valid @RequestBody UpdateSessionRequest request) {
        return ResponseEntity.ok(examenService.modifierDateSession(id, request));
    }

    @DeleteMapping("/sessions/{id}")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_GERER_SESSION') or hasAuthority('PERM_EXAMENS_SUPPRIMER')")
    @Operation(summary = "Supprimer une session d'examen et libérer ses candidats")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        examenService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/resultat")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_GERER_SESSION')")
    @Operation(summary = "Mettre à jour le résultat d'un passage (Réussi, Échec, Ajourné)")
    public ResponseEntity<PassageExamenDTO> updateResultat(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePassageRequest request
    ) {
        return ResponseEntity.ok(examenService.updateResultatPassage(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_EXAMENS_SUPPRIMER')")
    @Operation(summary = "Supprimer un passage d'examen")
    public ResponseEntity<Void> deletePassage(@PathVariable Long id) {
        examenService.deletePassage(id);
        return ResponseEntity.noContent().build();
    }
}
