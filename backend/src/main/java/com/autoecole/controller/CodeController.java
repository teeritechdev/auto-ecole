package com.autoecole.controller;

import com.autoecole.dto.CodeDTOs.*;
import com.autoecole.service.CodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/code")
@RequiredArgsConstructor
@Tag(name = "Code de la route", description = "Progression, Cycles et tentatives du module d'entraînement au Code")
public class CodeController {

    private final CodeService codeService;

    @GetMapping("/progression/{candidatId}")
    @PreAuthorize("hasAuthority('PERM_CODE_SUIVI')")
    @Operation(summary = "Progression d'un candidat, Cycle par Cycle")
    public ResponseEntity<CodeProgressionDTO> getProgression(@PathVariable Long candidatId) {
        return ResponseEntity.ok(codeService.getProgression(candidatId));
    }

    @GetMapping("/historique/{candidatId}")
    @PreAuthorize("hasAuthority('PERM_CODE_SUIVI')")
    @Operation(summary = "Historique de toutes les tentatives d'un candidat")
    public ResponseEntity<List<CodeHistoriqueLigneDTO>> getHistorique(@PathVariable Long candidatId) {
        return ResponseEntity.ok(codeService.getHistorique(candidatId));
    }

    @PostMapping("/cycles/{numero}/start")
    @PreAuthorize("hasAuthority('PERM_CODE_PRATIQUER')")
    @Operation(summary = "Démarrer (ou reprendre) une tentative sur un Cycle autorisé")
    public ResponseEntity<EtatTentativeDTO> demarrerCycle(@PathVariable int numero) {
        return new ResponseEntity<>(codeService.demarrerCycle(numero), HttpStatus.CREATED);
    }

    @GetMapping("/tentatives/{id}")
    @PreAuthorize("hasAuthority('PERM_CODE_PRATIQUER')")
    @Operation(summary = "État courant d'une tentative (question en cours ou résultat final)")
    public ResponseEntity<EtatTentativeDTO> getEtatTentative(@PathVariable Long id) {
        return ResponseEntity.ok(codeService.getEtatTentative(id));
    }

    @PostMapping("/tentatives/{id}/answer")
    @PreAuthorize("hasAuthority('PERM_CODE_PRATIQUER')")
    @Operation(summary = "Répondre à la question courante d'une tentative")
    public ResponseEntity<EtatTentativeDTO> repondre(@PathVariable Long id, @RequestBody RepondreQuestionRequest request) {
        return ResponseEntity.ok(codeService.repondre(id, request.getReponse()));
    }

    @PostMapping("/tentatives/{id}/precedente")
    @PreAuthorize("hasAuthority('PERM_CODE_PRATIQUER')")
    @Operation(summary = "Revenir à la question précédente (si autorisé par la configuration)")
    public ResponseEntity<EtatTentativeDTO> revenirQuestionPrecedente(@PathVariable Long id) {
        return ResponseEntity.ok(codeService.revenirQuestionPrecedente(id));
    }

    @PostMapping("/tentatives/{id}/finish")
    @PreAuthorize("hasAuthority('PERM_CODE_PRATIQUER')")
    @Operation(summary = "Terminer explicitement une tentative en cours")
    public ResponseEntity<EtatTentativeDTO> terminerTentative(@PathVariable Long id) {
        return ResponseEntity.ok(codeService.terminerTentative(id));
    }
}
