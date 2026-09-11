package com.autoecole.controller;

import com.autoecole.dto.AuditDTOs.HistoriqueActionDTO;
import com.autoecole.dto.AuditDTOs.SuppressionAuditRequest;
import com.autoecole.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit", description = "Journalisation et traçabilité des opérations sensibles")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "Consulter le journal d'audit des actions sensibles")
    public ResponseEntity<Page<HistoriqueActionDTO>> getHistorique(
            @RequestParam(required = false) String entite,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            @RequestParam(required = false) Long utilisateurId,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(auditService.getHistorique(entite, action, debut, fin, utilisateurId, pageable));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une entrée du journal d'audit (motif obligatoire, action elle-même journalisée)")
    public ResponseEntity<Void> supprimerAction(@PathVariable Long id, @RequestParam String motif) {
        auditService.supprimerActions(List.of(id), motif);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/supprimer")
    @Operation(summary = "Supprimer plusieurs entrées du journal d'audit (motif obligatoire, action elle-même journalisée)")
    public ResponseEntity<Void> supprimerActions(@Valid @RequestBody SuppressionAuditRequest request) {
        auditService.supprimerActions(request.getIds(), request.getMotif());
        return ResponseEntity.noContent().build();
    }
}
