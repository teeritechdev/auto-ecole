package com.autoecole.controller;

import com.autoecole.dto.CaisseDTOs.*;
import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.service.CaisseService;
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

import com.autoecole.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/caisse")
@RequiredArgsConstructor
@Tag(name = "Caisse", description = "Caisse & Trésorerie interne : opérations diverses (recettes/dépenses), indépendante des paiements de formation")
public class CaisseController {

    private final CaisseService caisseService;
    private final ExportService exportService;

    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('PERM_CAISSE_VOIR')")
    @Operation(summary = "Lister et filtrer les opérations de caisse avec pagination")
    public ResponseEntity<Page<TransactionCaisseDTO>> filtrerTransactions(
            @RequestParam(required = false) TypeMouvementCaisse type,
            @RequestParam(required = false) Long natureOperationId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            @RequestParam(required = false) Long siteId,
            @PageableDefault(size = 15, sort = "dateTransaction", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(caisseService.filtrerTransactions(type, natureOperationId, debut, fin, siteId, pageable));
    }

    @GetMapping("/recap")
    @PreAuthorize("hasAuthority('PERM_CAISSE_VOIR')")
    @Operation(summary = "Obtenir le récapitulatif du solde de caisse (total et journalier), pour un site donné ou tous sites confondus (ADMIN)")
    public ResponseEntity<RecapCaisseDTO> getRecapCaisse(@RequestParam(required = false) Long siteId) {
        return ResponseEntity.ok(caisseService.getRecapCaisse(siteId));
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasAuthority('PERM_CAISSE_CREER')")
    @Operation(summary = "Enregistrer une opération de caisse (le sens est hérité de la nature d'opération choisie)")
    public ResponseEntity<TransactionCaisseDTO> enregistrerTransaction(
            @Valid @RequestBody CreateTransactionCaisseRequest request
    ) {
        return new ResponseEntity<>(caisseService.enregistrerTransaction(request), HttpStatus.CREATED);
    }

    @DeleteMapping("/transactions/{id}")
    @PreAuthorize("hasAuthority('PERM_CAISSE_SUPPRIMER')")
    @Operation(summary = "Supprimer une opération de caisse (réservé ADMIN)")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Correction d'écriture") String motif
    ) {
        caisseService.deleteTransaction(id, motif);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export/pdf")
    @PreAuthorize("hasAuthority('PERM_CAISSE_VOIR') or hasAuthority('PERM_RAPPORTS_CAISSE')")
    @Operation(summary = "Exporter le journal de caisse en PDF avec filtres")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) TypeMouvementCaisse type,
            @RequestParam(required = false) Long natureOperationId,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        List<TransactionCaisseDTO> transactions = caisseService.getTransactionsPourRapport(type, natureOperationId, debut, fin, siteId);
        byte[] bytes = exportService.exportCaissePdf(transactions);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=journal_caisse.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    @GetMapping("/export/excel")
    @PreAuthorize("hasAuthority('PERM_CAISSE_VOIR') or hasAuthority('PERM_RAPPORTS_CAISSE')")
    @Operation(summary = "Exporter le journal de caisse en Excel avec filtres")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) TypeMouvementCaisse type,
            @RequestParam(required = false) Long natureOperationId,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) throws IOException {
        List<TransactionCaisseDTO> transactions = caisseService.getTransactionsPourRapport(type, natureOperationId, debut, fin, siteId);
        byte[] bytes = exportService.exportCaisseExcel(transactions);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=journal_caisse.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }
}
