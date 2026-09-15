package com.autoecole.controller;

import com.autoecole.dto.PermissionDTOs.PermissionDTO;
import com.autoecole.dto.ProfilDTOs.CreateProfilRequest;
import com.autoecole.dto.ProfilDTOs.ProfilDTO;
import com.autoecole.dto.ProfilDTOs.UpdateProfilRequest;
import com.autoecole.service.ProfilService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profils")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Profils & Permissions", description = "Gestion des profils de permissions assignables aux comptes utilisateurs")
public class ProfilController {

    private final ProfilService profilService;

    @GetMapping("/permissions")
    @Operation(summary = "Lister le catalogue complet des permissions du système")
    public ResponseEntity<List<PermissionDTO>> getCatalogue() {
        return ResponseEntity.ok(profilService.getCatalogue());
    }

    @GetMapping
    @Operation(summary = "Lister tous les profils (système et personnalisés) avec leurs permissions")
    public ResponseEntity<List<ProfilDTO>> getAllProfils() {
        return ResponseEntity.ok(profilService.getAllProfils());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtenir le détail d'un profil")
    public ResponseEntity<ProfilDTO> getProfilById(@PathVariable Long id) {
        return ResponseEntity.ok(profilService.getProfilById(id));
    }

    @PostMapping
    @Operation(summary = "Créer un profil personnalisé avec un jeu de permissions")
    public ResponseEntity<ProfilDTO> createProfil(@Valid @RequestBody CreateProfilRequest request) {
        return new ResponseEntity<>(profilService.createProfil(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier les permissions (ou le nom/description) d'un profil")
    public ResponseEntity<ProfilDTO> updateProfil(@PathVariable Long id, @Valid @RequestBody UpdateProfilRequest request) {
        return ResponseEntity.ok(profilService.updateProfil(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un profil personnalisé (interdit s'il est encore assigné à des comptes)")
    public ResponseEntity<Void> deleteProfil(@PathVariable Long id) {
        profilService.deleteProfil(id);
        return ResponseEntity.noContent().build();
    }
}
