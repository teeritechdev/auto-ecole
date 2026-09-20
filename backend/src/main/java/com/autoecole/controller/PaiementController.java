package com.autoecole.controller;

import com.autoecole.dto.PaiementDTOs.*;
import com.autoecole.service.PaiementService;
import com.autoecole.service.RecuService;
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

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
@Tag(name = "Paiements", description = "Encaissements, versements et gestion des reçus")
public class PaiementController {

    private final PaiementService paiementService;
    private final RecuService recuService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_VOIR')")
    @Operation(summary = "Lister et filtrer les versements avec pagination")
    public ResponseEntity<Page<PaiementDTO>> filtrerPaiements(
            @RequestParam(required = false) Long candidatId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            @RequestParam(required = false) Long siteId,
            @PageableDefault(size = 15, sort = "datePaiement", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(paiementService.filtrerPaiements(candidatId, debut, fin, siteId, pageable));
    }

    @GetMapping("/candidat/{candidatId}")
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_VOIR')")
    @Operation(summary = "Obtenir l'historique des versements d'un candidat")
    public ResponseEntity<List<PaiementDTO>> getPaiementsByCandidat(@PathVariable Long candidatId) {
        return ResponseEntity.ok(paiementService.getPaiementsByCandidat(candidatId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_VOIR')")
    @Operation(summary = "Obtenir les détails d'un versement")
    public ResponseEntity<PaiementDTO> getPaiementById(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.getPaiementById(id));
    }

    @GetMapping("/resume")
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_VOIR')")
    @Operation(summary = "Total encaissé et reste à payer, tous dossiers actifs confondus")
    public ResponseEntity<ResumePaiementsDTO> getResume() {
        return ResponseEntity.ok(paiementService.getResume());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_CREER')")
    @Operation(summary = "Enregistrer un nouveau versement (validation 1er versement 35k-50k et solde)")
    public ResponseEntity<PaiementDTO> enregistrerPaiement(@Valid @RequestBody CreatePaiementRequest request) {
        return new ResponseEntity<>(paiementService.enregistrerPaiement(request), HttpStatus.CREATED);
    }

    @PostMapping("/frais-examen")
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_CREER')")
    @Operation(summary = "Encaisser les frais d'examen (Code/Créneau/Circulation) d'un candidat dont le forfait ne les inclut pas")
    public ResponseEntity<PaiementDTO> enregistrerFraisExamen(@Valid @RequestBody CreateFraisExamenRequest request) {
        return new ResponseEntity<>(paiementService.enregistrerFraisExamen(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_MODIFIER')")
    @Operation(summary = "Modifier un versement (avec motif obligatoire et traçabilité)")
    public ResponseEntity<PaiementDTO> modifierPaiement(
            @PathVariable Long id,
            @Valid @RequestBody ModifierPaiementRequest request
    ) {
        return ResponseEntity.ok(paiementService.modifierPaiement(id, request));
    }

    @PostMapping("/{id}/annuler")
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_ANNULER')")
    @Operation(summary = "Annuler un versement (avec motif obligatoire)")
    public ResponseEntity<PaiementDTO> annulerPaiement(
            @PathVariable Long id,
            @Valid @RequestBody AnnulerPaiementRequest request
    ) {
        return ResponseEntity.ok(paiementService.annulerPaiement(id, request));
    }

    // --- REÇUS ---
    @GetMapping("/recus/{id}")
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_VOIR')")
    @Operation(summary = "Obtenir les données d'un reçu de paiement par son id")
    public ResponseEntity<RecuDTO> getRecuById(@PathVariable Long id) {
        return ResponseEntity.ok(recuService.getRecuById(id));
    }

    @GetMapping("/recus/paiement/{paiementId}")
    @PreAuthorize("hasAuthority('PERM_PAIEMENTS_VOIR')")
    @Operation(summary = "Obtenir le reçu associé à un paiement")
    public ResponseEntity<RecuDTO> getRecuByPaiementId(@PathVariable Long paiementId) {
        return ResponseEntity.ok(recuService.getRecuByPaiementId(paiementId));
    }
}
