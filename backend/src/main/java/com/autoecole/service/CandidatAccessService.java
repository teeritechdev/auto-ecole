package com.autoecole.service;

import com.autoecole.entity.Candidat;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Centralise la restriction d'accès d'un compte CANDIDAT à son propre dossier : un candidat
 * connecté ne doit jamais pouvoir consulter la progression, les tentatives ou l'historique
 * d'un autre candidat (RG-CAND-05 du cahier des charges du module Code), même en appelant
 * directement l'API avec l'id d'un autre dossier.
 */
@Service
@RequiredArgsConstructor
public class CandidatAccessService {

    private final AuditService auditService;

    public boolean estCandidatConnecte() {
        Utilisateur u = auditService.getCurrentUser();
        return u != null && u.getRole() != null && u.getRole().getCode() == RoleEnum.CANDIDAT;
    }

    /** Le dossier Candidat lié au compte CANDIDAT actuellement connecté. */
    public Candidat getCandidatCourant() {
        Utilisateur u = auditService.getCurrentUser();
        if (u == null || u.getCandidat() == null) {
            throw new ResourceNotFoundException("Aucun dossier candidat associé à ce compte");
        }
        return u.getCandidat();
    }

    /**
     * Vérifie, uniquement si l'utilisateur connecté est un CANDIDAT, qu'il consulte bien son
     * propre dossier : lève une exception "introuvable" (comme SiteAccessService pour les
     * moniteurs) plutôt qu'un 403 explicite, pour ne pas confirmer l'existence du dossier
     * ciblé. Sans effet pour les autres rôles (ADMIN, MONITEUR, ...).
     */
    public void verifierEstSoiMeme(Long candidatIdCible) {
        if (!estCandidatConnecte()) return;
        Candidat soi = getCandidatCourant();
        if (candidatIdCible == null || !soi.getId().equals(candidatIdCible)) {
            throw new ResourceNotFoundException("Candidat introuvable");
        }
    }
}
