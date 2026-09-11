package com.autoecole.controller;

import com.autoecole.dto.InscriptionDTOs.InscriptionDTO;
import com.autoecole.service.InscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inscriptions")
@RequiredArgsConstructor
@Tag(name = "Inscriptions", description = "Historique des cycles d'inscription d'un candidat")
public class InscriptionController {

    private final InscriptionService inscriptionService;

    @GetMapping("/candidat/{candidatId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETAIRE', 'CAISSIERE')")
    @Operation(summary = "Historique des cycles d'inscription d'un candidat (inscription initiale + reprises)")
    public ResponseEntity<List<InscriptionDTO>> getHistoriqueByCandidat(@PathVariable Long candidatId) {
        return ResponseEntity.ok(inscriptionService.getHistoriqueByCandidat(candidatId));
    }
}
