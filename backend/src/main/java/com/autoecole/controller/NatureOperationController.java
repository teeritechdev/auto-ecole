package com.autoecole.controller;

import com.autoecole.dto.CaisseDTOs.CreateNatureOperationRequest;
import com.autoecole.dto.CaisseDTOs.NatureOperationDTO;
import com.autoecole.dto.CaisseDTOs.UpdateNatureOperationRequest;
import com.autoecole.service.NatureOperationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;

@RestController
@RequestMapping("/api/caisse/natures")
@RequiredArgsConstructor
@Tag(name = "Natures d'opération", description = "Catalogue des natures d'opération de la Caisse & Trésorerie")
public class NatureOperationController {

    private final NatureOperationService natureOperationService;
    private final ExportService exportService;

    @GetMapping("/export/pdf")
    @PreAuthorize("hasAuthority('PERM_CAISSE_NATURES_VOIR') or hasAuthority('PERM_CAISSE_NATURES_GERER')")
    @Operation(summary = "Exporter les natures d'opération en PDF selon les filtres actifs")
    public ResponseEntity<byte[]> exportNaturesPdf(
            @RequestParam(required = false) TypeMouvementCaisse sens,
            @RequestParam(required = false) Boolean actif,
            @RequestParam(required = false) String recherche
    ) {
        List<NatureOperationDTO> natures = natureOperationService.getFiltrees(sens, actif, recherche);
        byte[] bytes = exportService.exportNaturesOperationPdf(natures);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=natures_operations_caisse.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    @GetMapping("/export/excel")
    @PreAuthorize("hasAuthority('PERM_CAISSE_NATURES_VOIR') or hasAuthority('PERM_CAISSE_NATURES_GERER')")
    @Operation(summary = "Exporter les natures d'opération en Excel (.xlsx) selon les filtres actifs")
    public ResponseEntity<byte[]> exportNaturesExcel(
            @RequestParam(required = false) TypeMouvementCaisse sens,
            @RequestParam(required = false) Boolean actif,
            @RequestParam(required = false) String recherche
    ) throws IOException {
        List<NatureOperationDTO> natures = natureOperationService.getFiltrees(sens, actif, recherche);
        byte[] bytes = exportService.exportNaturesOperationExcel(natures);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=natures_operations_caisse.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_CAISSE_NATURES_VOIR')")
    @Operation(summary = "Lister les natures d'opération actives (pour enregistrer une opération)")
    public ResponseEntity<List<NatureOperationDTO>> getActives() {
        return ResponseEntity.ok(natureOperationService.getActives());
    }

    @GetMapping("/toutes")
    @PreAuthorize("hasAuthority('PERM_CAISSE_NATURES_GERER')")
    @Operation(summary = "Lister toutes les natures d'opération, actives et inactives (gestion ADMIN)")
    public ResponseEntity<List<NatureOperationDTO>> getToutes() {
        return ResponseEntity.ok(natureOperationService.getToutes());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CAISSE_NATURES_GERER')")
    @Operation(summary = "Créer une nature d'opération (réservé ADMIN)")
    public ResponseEntity<NatureOperationDTO> creer(@Valid @RequestBody CreateNatureOperationRequest request) {
        return new ResponseEntity<>(natureOperationService.creer(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CAISSE_NATURES_GERER')")
    @Operation(summary = "Modifier une nature d'opération, y compris son statut actif/inactif (réservé ADMIN)")
    public ResponseEntity<NatureOperationDTO> modifier(@PathVariable Long id, @Valid @RequestBody UpdateNatureOperationRequest request) {
        return ResponseEntity.ok(natureOperationService.modifier(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CAISSE_NATURES_GERER')")
    @Operation(summary = "Supprimer une nature d'opération (réservé ADMIN)")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        natureOperationService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
