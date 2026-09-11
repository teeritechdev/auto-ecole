package com.autoecole.service;

import com.autoecole.dto.InscriptionDTOs.InscriptionDTO;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.CategoriePermis;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.Site;
import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.entity.enums.StatutInscription;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
    private final SiteAccessService siteAccessService;

    @Value("${app.inscription.duree-validite-mois:8}")
    private int dureeValiditeMois;

    /**
     * Crée le premier cycle d'inscription d'un candidat (numeroCycle=1, active=true).
     */
    @Transactional
    public Inscription creerInscriptionInitiale(Candidat candidat, CategoriePermis categorie, Site site,
                                                 LocalDate dateInscription, BigDecimal montant, BigDecimal totalVerse, StatutInscription statutInscription) {
        LocalDate dateInsc = dateInscription != null ? dateInscription : LocalDate.now();
        LocalDate dateEcheance = dateInsc.plusMonths(dureeValiditeMois); // RG07 : durée de validité configurable

        BigDecimal verse = totalVerse != null ? totalVerse : BigDecimal.ZERO;

        Inscription inscription = Inscription.builder()
                .candidat(candidat)
                .categoriePermis(categorie)
                .site(site)
                .montantForfait(montant)
                .dateInscription(dateInsc)
                .dateEcheance(dateEcheance)
                .statutDossier(StatutDossier.EN_COURS)
                .statutInscription(statutInscription != null ? statutInscription : StatutInscription.NOUVEAU)
                .totalVerse(verse)
                .soldeRestant(montant.subtract(verse))
                .numeroCycle(1)
                .active(true)
                .build();

        inscription.recalculerSoldeEtStatut();
        return inscriptionRepository.save(inscription);
    }

    /**
     * Rattache une nouvelle inscription (nouveau cycle, marqué REDOUBLANT) à un candidat déjà
     * connu de l'auto-école, plutôt que de créer un dossier candidat en doublon. L'ancienne
     * inscription active est désactivée mais reste consultable dans l'historique.
     */
    @Transactional
    public Inscription creerNouveauCycle(Candidat candidat, CategoriePermis categorie, Site site,
                                          LocalDate dateInscription, BigDecimal montant, BigDecimal totalVerse) {
        Inscription ancienneActive = inscriptionRepository.findByCandidatIdAndActiveTrue(candidat.getId()).orElse(null);
        if (ancienneActive != null) {
            ancienneActive.setActive(false);
            inscriptionRepository.save(ancienneActive);
        }

        LocalDate dateInsc = dateInscription != null ? dateInscription : LocalDate.now();
        LocalDate dateEcheance = dateInsc.plusMonths(dureeValiditeMois);
        BigDecimal verse = totalVerse != null ? totalVerse : BigDecimal.ZERO;
        int nouveauCycle = ancienneActive != null ? ancienneActive.getNumeroCycle() + 1 : 1;

        Inscription inscription = Inscription.builder()
                .candidat(candidat)
                .categoriePermis(categorie)
                .site(site)
                .montantForfait(montant)
                .dateInscription(dateInsc)
                .dateEcheance(dateEcheance)
                .statutDossier(StatutDossier.EN_COURS)
                .statutInscription(StatutInscription.REDOUBLANT)
                .totalVerse(verse)
                .soldeRestant(montant.subtract(verse))
                .numeroCycle(nouveauCycle)
                .active(true)
                .inscriptionPrecedente(ancienneActive)
                .build();

        inscription.recalculerSoldeEtStatut();
        return inscriptionRepository.save(inscription);
    }

    public Inscription getInscriptionActive(Long candidatId) {
        return inscriptionRepository.findByCandidatIdAndActiveTrue(candidatId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucune inscription active pour le candidat id: " + candidatId));
    }

    /**
     * Vérifie qu'un moniteur (le cas échéant) a le droit d'accéder à ce candidat, c'est-à-dire
     * que le candidat est inscrit sur le même site que celui du moniteur connecté. Ne fait rien
     * pour les autres rôles (accès non restreint par site).
     */
    public void verifierAccesCandidat(Long candidatId) {
        Inscription active = getInscriptionActive(candidatId);
        siteAccessService.verifierAccesSite(active.getSite() != null ? active.getSite().getId() : null);
    }

    public List<InscriptionDTO> getHistoriqueByCandidat(Long candidatId) {
        return inscriptionRepository.findByCandidatIdOrderByNumeroCycleDesc(candidatId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public Inscription mettreAJourCategorieEtMontant(Long candidatId, CategoriePermis categorie, BigDecimal montant, Site site) {
        Inscription active = getInscriptionActive(candidatId);
        active.setCategoriePermis(categorie);
        active.setSite(site);
        if (active.getMontantForfait().compareTo(montant) != 0) {
            active.setMontantForfait(montant);
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
                .siteId(i.getSite() != null ? i.getSite().getId() : null)
                .siteNom(i.getSite() != null ? i.getSite().getNom() : null)
                .montantForfait(i.getMontantForfait())
                .dateInscription(i.getDateInscription())
                .dateEcheance(i.getDateEcheance())
                .statutDossier(i.getStatutDossier())
                .statutInscription(i.getStatutInscription())
                .totalVerse(i.getTotalVerse())
                .soldeRestant(i.getSoldeRestant())
                .numeroCycle(i.getNumeroCycle())
                .active(i.isActive())
                .inscriptionPrecedenteId(i.getInscriptionPrecedente() != null ? i.getInscriptionPrecedente().getId() : null)
                .dateCreation(i.getDateCreation())
                .build();
    }
}
