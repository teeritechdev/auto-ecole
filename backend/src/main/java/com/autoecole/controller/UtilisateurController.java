package com.autoecole.controller;

import com.autoecole.dto.AuthDTOs.JwtResponse;
import com.autoecole.dto.CandidatDTOs.IdentifiantsCompteDTO;
import com.autoecole.dto.UtilisateurDTOs.*;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.exception.BadRequestException;
import com.autoecole.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.autoecole.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@Tag(name = "Utilisateurs", description = "Administration des comptes et rôles")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final ExportService exportService;

    @GetMapping("/export/pdf")
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_VOIR')")
    @Operation(summary = "Exporter la liste des utilisateurs en PDF selon les filtres actifs")
    public ResponseEntity<byte[]> exportUtilisateursPdf(
            @RequestParam(required = false) String recherche,
            @RequestParam(required = false) RoleEnum role,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Boolean actif
    ) {
        List<UtilisateurDTO> users = utilisateurService.getUtilisateursFiltres(recherche, role, siteId, actif);
        byte[] bytes = exportService.exportUtilisateursPdf(users);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=utilisateurs.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    @GetMapping("/export/excel")
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_VOIR')")
    @Operation(summary = "Exporter la liste des utilisateurs en Excel (.xlsx) selon les filtres actifs")
    public ResponseEntity<byte[]> exportUtilisateursExcel(
            @RequestParam(required = false) String recherche,
            @RequestParam(required = false) RoleEnum role,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Boolean actif
    ) throws IOException {
        List<UtilisateurDTO> users = utilisateurService.getUtilisateursFiltres(recherche, role, siteId, actif);
        byte[] bytes = exportService.exportUtilisateursExcel(users);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=utilisateurs.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_VOIR')")
    @Operation(summary = "Lister tous les comptes utilisateurs")
    public ResponseEntity<List<UtilisateurDTO>> getAllUtilisateurs() {
        return ResponseEntity.ok(utilisateurService.getAllUtilisateurs());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_VOIR')")
    @Operation(summary = "Obtenir les détails d'un utilisateur par son id")
    public ResponseEntity<UtilisateurDTO> getUtilisateurById(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.getUtilisateurById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_CREER')")
    @Operation(summary = "Créer un nouveau compte utilisateur")
    public ResponseEntity<UtilisateurDTO> createUtilisateur(@Valid @RequestBody CreateUtilisateurRequest request) {
        return new ResponseEntity<>(utilisateurService.createUtilisateur(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_MODIFIER')")
    @Operation(summary = "Modifier un compte utilisateur existant")
    public ResponseEntity<UtilisateurDTO> updateUtilisateur(@PathVariable Long id, @Valid @RequestBody UpdateUtilisateurRequest request) {
        return ResponseEntity.ok(utilisateurService.updateUtilisateur(id, request));
    }

    @PatchMapping("/{id}/toggle-actif")
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_MODIFIER')")
    @Operation(summary = "Activer ou désactiver un compte utilisateur")
    public ResponseEntity<Void> toggleActif(@PathVariable Long id) {
        utilisateurService.toggleActif(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_RESET_PASSWORD')")
    @Operation(summary = "Réinitialiser le mot de passe d'un compte du personnel qui l'a oublié")
    public ResponseEntity<IdentifiantsCompteDTO> resetPassword(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.resetPassword(id));
    }

    @PatchMapping("/{id}/photo")
    @PreAuthorize("hasAuthority('PERM_UTILISATEURS_MODIFIER')")
    public ResponseEntity<UtilisateurDTO> updatePhoto(@PathVariable Long id, @Valid @RequestBody PhotoRequest request) {
        validatePhoto(request.getPhotoProfile());
        return ResponseEntity.ok(utilisateurService.updatePhoto(id, request.getPhotoProfile()));
    }

    @PatchMapping("/me/photo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UtilisateurDTO> updateMyPhoto(@Valid @RequestBody PhotoRequest request) {
        validatePhoto(request.getPhotoProfile());
        return ResponseEntity.ok(utilisateurService.updateCurrentUserPhoto(request.getPhotoProfile()));
    }

    @PatchMapping("/me/username")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Modifier mon propre nom d'utilisateur (accessible à tout compte connecté)")
    public ResponseEntity<JwtResponse> updateMyUsername(@Valid @RequestBody UpdateUsernameRequest request) {
        return ResponseEntity.ok(utilisateurService.updateCurrentUsername(request.getUsername()));
    }

    private void validatePhoto(String photoProfile) {
        if (photoProfile == null || photoProfile.isBlank()) return;
        if (!photoProfile.matches("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$")) {
            throw new BadRequestException("Format de photo non pris en charge");
        }
    }

    @lombok.Data
    public static class PhotoRequest {
        @jakarta.validation.constraints.Size(max = 2_800_000, message = "Photo trop volumineuse (2 Mo max)")
        private String photoProfile;
    }
}
