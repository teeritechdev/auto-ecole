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

@RestController
@RequestMapping("/api/caisse")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'CAISSIERE')")
@Tag(name = "Caisse", description = "Gestion des entrées, sorties et du solde de caisse de l'auto-école")
public class CaisseController {

    private final CaisseService caisseService;

    @GetMapping("/transactions")
    @Operation(summary = "Lister et filtrer les mouvements de caisse avec pagination")
    public ResponseEntity<Page<TransactionCaisseDTO>> filtrerTransactions(
            @RequestParam(required = false) TypeMouvementCaisse type,
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            @PageableDefault(size = 15, sort = "dateTransaction", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(caisseService.filtrerTransactions(type, categorie, debut, fin, pageable));
    }

    @GetMapping("/recap")
    @Operation(summary = "Obtenir le récapitulatif du solde de caisse (total et journalier)")
    public ResponseEntity<RecapCaisseDTO> getRecapCaisse() {
        return ResponseEntity.ok(caisseService.getRecapCaisse());
    }

    @PostMapping("/transactions")
    @Operation(summary = "Enregistrer une transaction de caisse manuelle (Entrée / Sortie)")
    public ResponseEntity<TransactionCaisseDTO> enregistrerTransaction(
            @Valid @RequestBody CreateTransactionCaisseRequest request
    ) {
        return new ResponseEntity<>(caisseService.enregistrerTransaction(request), HttpStatus.CREATED);
    }

    @DeleteMapping("/transactions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer une transaction de caisse (réservé ADMIN)")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Correction d'écriture") String motif
    ) {
        caisseService.deleteTransaction(id, motif);
        return ResponseEntity.noContent().build();
    }
}
