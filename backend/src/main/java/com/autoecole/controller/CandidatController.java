package com.autoecole.controller;

import com.autoecole.dto.CandidatDTOs.*;
import com.autoecole.entity.enums.EtapeParcours;
import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.entity.enums.StatutInscription;
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
import com.autoecole.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/candidats")
@RequiredArgsConstructor
@Tag(name = "Candidats", description = "Gestion des dossiers et inscriptions des candidats")
public class CandidatController {

    private final CandidatService candidatService;
    private final ExportService exportService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_VOIR')")
    @Operation(summary = "Rechercher et filtrer les candidats avec pagination")
    public ResponseEntity<Page<CandidatDTO>> rechercherCandidats(
            @RequestParam(required = false) String recherche,
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) StatutInscription statutInscription,
            @RequestParam(required = false, defaultValue = "false") boolean ignoreEtapeFilter,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) EtapeParcours etapeParcours,
            @RequestParam(required = false) Boolean priseEnChargeExamens,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate dateExamenProgramme,
            @PageableDefault(size = 15, sort = "dateCreation", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(candidatService.rechercherCandidats(recherche, statut, categorieId, statutInscription, ignoreEtapeFilter, siteId, etapeParcours, priseEnChargeExamens, dateExamenProgramme, pageable));
    }

    @GetMapping("/statistiques")
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_VOIR')")
    @Operation(summary = "Répartition homme/femme, globale et par site, sur le même sous-ensemble filtré que la recherche")
    public ResponseEntity<CandidatStatistiquesDTO> getStatistiques(
            @RequestParam(required = false) String recherche,
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) StatutInscription statutInscription,
            @RequestParam(required = false, defaultValue = "false") boolean ignoreEtapeFilter,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) EtapeParcours etapeParcours,
            @RequestParam(required = false) Boolean priseEnChargeExamens,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate dateExamenProgramme
    ) {
        return ResponseEntity.ok(candidatService.getStatistiques(recherche, statut, categorieId, statutInscription, ignoreEtapeFilter, siteId, etapeParcours, priseEnChargeExamens, dateExamenProgramme));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_VOIR') or hasRole('CANDIDAT')")
    @Operation(summary = "Obtenir la fiche complète d'un candidat")
    public ResponseEntity<CandidatDTO> getCandidatById(@PathVariable Long id) {
        return ResponseEntity.ok(candidatService.getCandidatById(id));
    }

    @GetMapping("/dossier/{numeroDossier}")
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_VOIR')")
    @Operation(summary = "Rechercher un candidat par son numéro de dossier")
    public ResponseEntity<CandidatDTO> getCandidatByNumeroDossier(@PathVariable String numeroDossier) {
        return ResponseEntity.ok(candidatService.getCandidatByNumeroDossier(numeroDossier));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_CREER')")
    @Operation(summary = "Créer un nouveau candidat avec inscription et 1er versement optionnel")
    public ResponseEntity<CandidatDTO> createCandidat(@Valid @RequestBody CreateCandidatRequest request) {
        return new ResponseEntity<>(candidatService.createCandidat(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_MODIFIER')")
    @Operation(summary = "Modifier les informations d'un candidat")
    public ResponseEntity<CandidatDTO> updateCandidat(@PathVariable Long id, @Valid @RequestBody UpdateCandidatRequest request) {
        return ResponseEntity.ok(candidatService.updateCandidat(id, request));
    }

    @PatchMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_RESET_PASSWORD')")
    @Operation(summary = "Réinitialiser le mot de passe du compte de connexion d'un candidat qui l'a oublié")
    public ResponseEntity<IdentifiantsCompteDTO> resetPassword(@PathVariable Long id) {
        return ResponseEntity.ok(candidatService.resetPasswordCompte(id));
    }

    @PostMapping("/{id}/reinscrire")
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_CREER')")
    @Operation(summary = "Rattacher une nouvelle inscription (redoublant) à un candidat déjà connu, au lieu de créer un dossier en doublon")
    public ResponseEntity<CandidatDTO> reinscrireCandidat(@PathVariable Long id, @Valid @RequestBody ReinscrireCandidatRequest request) {
        return ResponseEntity.ok(candidatService.reinscrireCandidat(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_SUPPRIMER') or hasRole('ADMIN')")
    @Operation(summary = "Supprimer un dossier candidat (réservé ADMIN)")
    public ResponseEntity<Void> deleteCandidat(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Suppression administrative") String motif
    ) {
        candidatService.deleteCandidat(id, motif);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export/pdf")
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_VOIR') or hasAuthority('PERM_RAPPORTS_CANDIDATS')")
    @Operation(summary = "Exporter la liste des candidats en PDF avec filtres")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) String recherche,
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) StatutInscription statutInscription,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) EtapeParcours etape,
            @RequestParam(required = false) Boolean priseEnChargeExamens,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate dateExamenProgramme
    ) {
        List<CandidatDTO> candidats = candidatService.getTousLesCandidatsPourRapport(
                recherche, statut, categorieId, statutInscription, siteId, etape, priseEnChargeExamens, dateExamenProgramme);
        byte[] bytes = exportService.exportCandidatsPdf(candidats);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=candidats_auto_ecole.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    @GetMapping("/export/excel")
    @PreAuthorize("hasAuthority('PERM_CANDIDATS_VOIR') or hasAuthority('PERM_RAPPORTS_CANDIDATS')")
    @Operation(summary = "Exporter la liste des candidats en Excel avec filtres")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) String recherche,
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) StatutInscription statutInscription,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) EtapeParcours etape,
            @RequestParam(required = false) Boolean priseEnChargeExamens,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate dateExamenProgramme
    ) throws IOException {
        List<CandidatDTO> candidats = candidatService.getTousLesCandidatsPourRapport(
                recherche, statut, categorieId, statutInscription, siteId, etape, priseEnChargeExamens, dateExamenProgramme);
        byte[] bytes = exportService.exportCandidatsExcel(candidats);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=candidats_auto_ecole.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }
}
