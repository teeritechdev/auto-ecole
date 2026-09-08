package com.autoecole.service;

import com.autoecole.dto.InscriptionDTOs.InscriptionDTO;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.CategoriePermis;
import com.autoecole.entity.Forfait;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InscriptionService {

    private final InscriptionRepository inscriptionRepository;

    /**
     * Crée le premier cycle d'inscription d'un candidat (numeroCycle=1, active=true).
     */
    @Transactional
    public Inscription creerInscriptionInitiale(Candidat candidat, CategoriePermis categorie, Forfait forfait,
                                                 LocalDate dateInscription, BigDecimal totalVerse) {
        LocalDate dateInsc = dateInscription != null ? dateInscription : LocalDate.now();
        LocalDate dateEcheance = dateInsc.plusMonths(8); // RG07 : 8 mois de validité

        BigDecimal verse = totalVerse != null ? totalVerse : BigDecimal.ZERO;

        Inscription inscription = Inscription.builder()
                .candidat(candidat)
                .categoriePermis(categorie)
                .forfait(forfait)
                .montantForfait(forfait.getMontant())
                .dateInscription(dateInsc)
                .dateEcheance(dateEcheance)
                .statutDossier(StatutDossier.EN_COURS)
                .totalVerse(verse)
                .soldeRestant(forfait.getMontant().subtract(verse))
                .numeroCycle(1)
                .active(true)
                .build();

        inscription.recalculerSoldeEtStatut();
        return inscriptionRepository.save(inscription);
    }

    public Inscription getInscriptionActive(Long candidatId) {
        return inscriptionRepository.findByCandidatIdAndActiveTrue(candidatId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucune inscription active pour le candidat id: " + candidatId));
    }

    public List<InscriptionDTO> getHistoriqueByCandidat(Long candidatId) {
        return inscriptionRepository.findByCandidatIdOrderByNumeroCycleDesc(candidatId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public Inscription mettreAJourCategorieEtForfait(Long candidatId, CategoriePermis categorie, Forfait forfait) {
        Inscription active = getInscriptionActive(candidatId);
        active.setCategoriePermis(categorie);
        if (!active.getForfait().getId().equals(forfait.getId())) {
            active.setForfait(forfait);
            active.setMontantForfait(forfait.getMontant());
            active.recalculerSoldeEtStatut();
        }
        return inscriptionRepository.save(active);
    }

    public InscriptionDTO mapToDTO(Inscription i) {
        return InscriptionDTO.builder()
                .id(i.getId())
                .candidatId(i.getCandidat() != null ? i.getCandidat().getId() : null)
                .candidatNumeroDossier(i.getCandidat() != null ? i.getCandidat().getNumeroDossier() : null)
                .categoriePermisId(i.getCategoriePermis() != null ? i.getCategoriePermis().getId() : null)
                .categoriePermisCode(i.getCategoriePermis() != null ? i.getCategoriePermis().getCode() : null)
                .categoriePermisLibelle(i.getCategoriePermis() != null ? i.getCategoriePermis().getLibelle() : null)
                .forfaitId(i.getForfait() != null ? i.getForfait().getId() : null)
                .forfaitNom(i.getForfait() != null ? i.getForfait().getNom() : null)
                .montantForfait(i.getMontantForfait())
                .dateInscription(i.getDateInscription())
                .dateEcheance(i.getDateEcheance())
                .statutDossier(i.getStatutDossier())
                .totalVerse(i.getTotalVerse())
                .soldeRestant(i.getSoldeRestant())
                .numeroCycle(i.getNumeroCycle())
                .active(i.isActive())
                .inscriptionPrecedenteId(i.getInscriptionPrecedente() != null ? i.getInscriptionPrecedente().getId() : null)
                .dateCreation(i.getDateCreation())
                .build();
    }
}
