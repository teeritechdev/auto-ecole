package com.autoecole.controller;

import com.autoecole.dto.CandidatDTOs.CandidatDTO;
import com.autoecole.dto.CaisseDTOs.TransactionCaisseDTO;
import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.service.CaisseService;
import com.autoecole.service.CandidatService;
import com.autoecole.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
@Tag(name = "Rapports", description = "Génération et exports de rapports en PDF et Excel")
public class RapportController {

    private final ExportService exportService;
    private final CandidatService candidatService;
    private final CaisseService caisseService;

    @GetMapping("/candidats/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETAIRE')")
    @Operation(summary = "Exporter la liste des candidats en Excel (.xlsx)")
    public ResponseEntity<byte[]> exportCandidatsExcel(
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) Long categorieId
    ) throws IOException {
        List<CandidatDTO> candidats = candidatService.getTousLesCandidatsPourRapport(statut, categorieId);
        byte[] bytes = exportService.exportCandidatsExcel(candidats);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=candidats_auto_ecole.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/candidats/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETAIRE')")
    @Operation(summary = "Exporter la liste des candidats en PDF")
    public ResponseEntity<byte[]> exportCandidatsPdf(
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) Long categorieId
    ) {
        List<CandidatDTO> candidats = candidatService.getTousLesCandidatsPourRapport(statut, categorieId);
        byte[] bytes = exportService.exportCandidatsPdf(candidats);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=candidats_auto_ecole.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    @GetMapping("/releve-paiement/{candidatId}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAISSIERE', 'SECRETAIRE')")
    @Operation(summary = "Générer le relevé de paiement individuel d'un candidat en PDF")
    public ResponseEntity<byte[]> exportRelevePaiementPdf(@PathVariable Long candidatId) {
        byte[] bytes = exportService.exportRelevePaiementCandidatPdf(candidatId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=releve_paiement_" + candidatId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    @GetMapping("/recu/{recuId}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAISSIERE', 'SECRETAIRE')")
    @Operation(summary = "Imprimer ou exporter un reçu officiel en PDF")
    public ResponseEntity<byte[]> exportRecuPdf(@PathVariable Long recuId) {
        byte[] bytes = exportService.exportRecuPdf(recuId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=recu_" + recuId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    @GetMapping("/caisse/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAISSIERE')")
    @Operation(summary = "Générer le relevé de caisse périodique en PDF")
    public ResponseEntity<byte[]> exportCaissePdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) {
        List<TransactionCaisseDTO> transactions = caisseService.getTransactionsPourRapport(debut, fin);
        byte[] bytes = exportService.exportCaissePdf(transactions);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=journal_caisse.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    @GetMapping("/caisse/excel")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAISSIERE')")
    @Operation(summary = "Générer le relevé de caisse périodique en Excel")
    public ResponseEntity<byte[]> exportCaisseExcel(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin
    ) throws IOException {
        List<TransactionCaisseDTO> transactions = caisseService.getTransactionsPourRapport(debut, fin);
        byte[] bytes = exportService.exportCaisseExcel(transactions);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=journal_caisse.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }
}
