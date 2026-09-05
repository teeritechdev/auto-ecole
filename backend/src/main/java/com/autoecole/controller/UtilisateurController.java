package com.autoecole.controller;

import com.autoecole.dto.UtilisateurDTOs.*;
import com.autoecole.service.UtilisateurService;
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
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@Tag(name = "Utilisateurs", description = "Administration des comptes et rôles")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lister tous les comptes utilisateurs")
    public ResponseEntity<List<UtilisateurDTO>> getAllUtilisateurs() {
        return ResponseEntity.ok(utilisateurService.getAllUtilisateurs());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtenir les détails d'un utilisateur par son id")
    public ResponseEntity<UtilisateurDTO> getUtilisateurById(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.getUtilisateurById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un nouveau compte utilisateur")
    public ResponseEntity<UtilisateurDTO> createUtilisateur(@Valid @RequestBody CreateUtilisateurRequest request) {
        return new ResponseEntity<>(utilisateurService.createUtilisateur(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier un compte utilisateur existant")
    public ResponseEntity<UtilisateurDTO> updateUtilisateur(@PathVariable Long id, @Valid @RequestBody UpdateUtilisateurRequest request) {
        return ResponseEntity.ok(utilisateurService.updateUtilisateur(id, request));
    }

    @PatchMapping("/{id}/toggle-actif")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activer ou désactiver un compte utilisateur")
    public ResponseEntity<Void> toggleActif(@PathVariable Long id) {
        utilisateurService.toggleActif(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/photo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UtilisateurDTO> updatePhoto(@PathVariable Long id, @RequestBody PhotoRequest request) {
        return ResponseEntity.ok(utilisateurService.updatePhoto(id, request.getPhotoProfile()));
    }

    @PatchMapping("/me/photo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UtilisateurDTO> updateMyPhoto(@RequestBody PhotoRequest request) {
        return ResponseEntity.ok(utilisateurService.updateCurrentUserPhoto(request.getPhotoProfile()));
    }

    @lombok.Data
    public static class PhotoRequest {
        private String photoProfile;
    }
}
