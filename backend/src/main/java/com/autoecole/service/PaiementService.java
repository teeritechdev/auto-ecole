package com.autoecole.service;

import com.autoecole.dto.PaiementDTOs.AnnulerPaiementRequest;
import com.autoecole.dto.PaiementDTOs.CreateFraisExamenRequest;
import com.autoecole.dto.PaiementDTOs.CreatePaiementRequest;
import com.autoecole.dto.PaiementDTOs.ModifierPaiementRequest;
import com.autoecole.dto.PaiementDTOs.PaiementDTO;
import com.autoecole.dto.PaiementDTOs.RecuDTO;
import com.autoecole.dto.PaiementDTOs.ResumePaiementsDTO;
import com.autoecole.entity.*;
import com.autoecole.entity.enums.*;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.InscriptionRepository;
import com.autoecole.repository.PaiementRepository;
import com.autoecole.repository.RecuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final InscriptionRepository inscriptionRepository;
    private final InscriptionService inscriptionService;
    private final RecuRepository recuRepository;
    private final CandidatService candidatService;
    private final AuditService auditService;
    private final SiteAccessService siteAccessService;
    private final CandidatAccessService candidatAccessService;

    /** Une caissière/secrétaire restreinte à un site ne voit et n'encaisse que les paiements
     *  des candidats inscrits sur ce site (RG : gestion par site, comme pour un moniteur). */
    public Page<PaiementDTO> filtrerPaiements(Long candidatId, LocalDateTime debut, LocalDateTime fin, Long siteFiltreId, Pageable pageable) {
        java.util.Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        if (siteIds != null && siteIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return paiementRepository.filtrerPaiements(candidatId, debut, fin, siteIds, siteFiltreId, pageable)
                .map(this::mapToDTO);
    }

    public List<PaiementDTO> getPaiementsByCandidat(Long candidatId) {
        candidatAccessService.verifierEstSoiMeme(candidatId);
        if (!candidatAccessService.estCandidatConnecte()) {
            inscriptionService.verifierAccesCandidat(candidatId);
        }
        return paiementRepository.findByCandidatIdOrderByDatePaiementDesc(candidatId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PaiementDTO getPaiementById(Long id) {
        Paiement p = paiementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement non trouvé avec l'id: " + id));
        verifierAccesPaiement(p);
        return mapToDTO(p);
    }

    /** Un utilisateur restreint par site (caissière/secrétaire/moniteur) ne peut consulter,
     *  modifier ou annuler que les paiements des candidats inscrits sur l'un de ses sites
     *  (même règle que filtrerPaiements) : sans ce contrôle, l'id numérique du paiement
     *  suffirait à agir sur les dossiers d'un autre site (IDOR). */
    private void verifierAccesPaiement(Paiement paiement) {
        Inscription inscription = paiement.getInscription();
        Long siteId = inscription != null && inscription.getSite() != null ? inscription.getSite().getId() : null;
        siteAccessService.verifierAccesSite(siteId);
    }

    /** Total encaissé et reste à payer, sur les dossiers actifs du/des site(s) de l'utilisateur
     *  courant si restreint (en-tête de la page Paiements), tous sites confondus pour ADMIN. */
    public ResumePaiementsDTO getResume() {
        java.util.Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        if (siteIds != null && siteIds.isEmpty()) {
            return ResumePaiementsDTO.builder().totalEncaisse(BigDecimal.ZERO).totalReste(BigDecimal.ZERO).build();
        }
        return ResumePaiementsDTO.builder()
                .totalEncaisse(inscriptionRepository.sumTotalVerseActif(siteIds))
                .totalReste(inscriptionRepository.sumSoldeRestantActif(siteIds))
                .build();
    }

    @Transactional
    public PaiementDTO enregistrerPaiement(CreatePaiementRequest request) {
        Inscription inscription = inscriptionService.getInscriptionActive(request.getCandidatId());
        Candidat candidat = inscription.getCandidat();

        BigDecimal montant = request.getMontant();
        if (montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Le montant du versement doit être supérieur à 0");
        }

        // Vérifier si l'inscription est déjà soldée
        if (inscription.getSoldeRestant().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Le dossier de ce candidat est déjà intégralement soldé");
        }

        // Vérifier le dépassement du solde restant
        if (montant.compareTo(inscription.getSoldeRestant()) > 0) {
            throw new BadRequestException("Le montant versé (" + montant + " FCFA) dépasse le solde restant dû (" + inscription.getSoldeRestant() + " FCFA)");
        }

        Utilisateur currentUser = auditService.getCurrentUser();

        // 1. Enregistrement du paiement
        Paiement paiement = Paiement.builder()
                .inscription(inscription)
                .utilisateur(currentUser)
                .montant(montant)
                .datePaiement(LocalDateTime.now())
                .modeReglement(request.getModeReglement() != null ? request.getModeReglement() : ModeReglement.ESPECES)
                .build();

        Paiement savedPaiement = paiementRepository.save(paiement);

        // 2. Mise à jour atomique du solde de l'inscription (RG09, RG07)
        inscription.setTotalVerse(inscription.getTotalVerse().add(montant));
        inscription.recalculerSoldeEtStatut();
        inscriptionRepository.save(inscription);

        // 3. Génération du reçu unique séquentiel (RG08)
        String numeroRecu = candidatService.genererNumeroRecuUnique(LocalDateTime.now().getYear());
        Recu recu = Recu.builder()
                .paiement(savedPaiement)
                .numeroRecu(numeroRecu)
                .nomClient(candidat.getNom() + " " + candidat.getPrenom())
                .montant(montant)
                .soldeRestant(inscription.getSoldeRestant())
                .imprimePar(currentUser != null ? currentUser.getNom() + " " + currentUser.getPrenom() : "Caisse")
                .build();
        recuRepository.save(recu);

        // Note : les paiements de formation n'alimentent jamais la Caisse & Trésorerie —
        // c'est une caisse de dépenses/recettes diverses totalement autonome (cf. CaisseService),
        // sans aucun lien avec les candidats, les inscriptions ou les paiements.
        auditService.logAction("ENCAISSEMENT_VERSEMENT", "Paiement", numeroRecu,
                "Encaissement de " + montant + " FCFA pour le candidat " + candidat.getNumeroDossier() + " (Nouveau solde: " + inscription.getSoldeRestant() + " FCFA)", null);

        return mapToDTO(savedPaiement);
    }

    /** Encaissement des frais d'examen (Code/Créneau/Circulation) pour un candidat dont le
     *  forfait de formation ne les inclut pas (Inscription.priseEnChargeExamens = false) :
     *  distinct du versement de formation, ce paiement n'alimente jamais totalVerse/soldeRestant
     *  de l'inscription, qui ne concernent que le forfait. */
    @Transactional
    public PaiementDTO enregistrerFraisExamen(CreateFraisExamenRequest request) {
        Inscription inscription = inscriptionService.getInscriptionActive(request.getCandidatId());
        Candidat candidat = inscription.getCandidat();

        if (inscription.isPriseEnChargeExamens()) {
            throw new BadRequestException("Les frais d'examen de ce candidat sont déjà inclus dans son forfait de formation");
        }

        BigDecimal montant = request.getMontant();
        if (montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Le montant doit être supérieur à 0");
        }

        Utilisateur currentUser = auditService.getCurrentUser();

        Paiement paiement = Paiement.builder()
                .inscription(inscription)
                .utilisateur(currentUser)
                .typeEpreuve(request.getTypeEpreuve())
                .montant(montant)
                .datePaiement(LocalDateTime.now())
                .modeReglement(request.getModeReglement() != null ? request.getModeReglement() : ModeReglement.ESPECES)
                .build();

        Paiement savedPaiement = paiementRepository.save(paiement);

        String numeroRecu = candidatService.genererNumeroRecuUnique(LocalDateTime.now().getYear());
        Recu recu = Recu.builder()
                .paiement(savedPaiement)
                .numeroRecu(numeroRecu)
                .nomClient(candidat.getNom() + " " + candidat.getPrenom())
                .montant(montant)
                .soldeRestant(inscription.getSoldeRestant())
                .imprimePar(currentUser != null ? currentUser.getNom() + " " + currentUser.getPrenom() : "Caisse")
                .build();
        recuRepository.save(recu);

        auditService.logAction("ENCAISSEMENT_FRAIS_EXAMEN", "Paiement", numeroRecu,
                "Encaissement de " + montant + " FCFA pour les frais d'examen (" + request.getTypeEpreuve()
                        + ") du candidat " + candidat.getNumeroDossier(), null);

        return mapToDTO(savedPaiement);
    }

    @Transactional
    public PaiementDTO modifierPaiement(Long paiementId, ModifierPaiementRequest request) {
        Paiement paiement = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement introuvable"));
        verifierAccesPaiement(paiement);

        BigDecimal ancienMontant = paiement.getMontant();
        BigDecimal nouveauMontant = request.getMontant();

        Inscription inscription = paiement.getInscription();

        Utilisateur currentUser = auditService.getCurrentUser();

        // Un versement avec typeEpreuve non nul correspond aux frais d'examen distincts du forfait
        if (paiement.getTypeEpreuve() == null) {
            BigDecimal difference = nouveauMontant.subtract(ancienMontant);
            BigDecimal nouveauTotal = inscription.getTotalVerse().add(difference);

            if (nouveauTotal.compareTo(inscription.getMontantForfait()) > 0) {
                throw new BadRequestException("La modification entraîne un dépassement du forfait");
            }

            inscription.setTotalVerse(nouveauTotal);
            inscription.recalculerSoldeEtStatut();
            inscriptionRepository.save(inscription);
        }

        // Mise à jour du paiement
        paiement.setMontant(nouveauMontant);
        paiement.setModeReglement(request.getModeReglement());
        paiement.setMotifModification(request.getMotif());
        paiement.setDateModification(LocalDateTime.now());
        paiement.setUtilisateurModif(currentUser);

        Paiement updated = paiementRepository.save(paiement);

        // Mise à jour du reçu
        recuRepository.findByPaiementId(paiementId).ifPresent(recu -> {
            recu.setMontant(nouveauMontant);
            recu.setSoldeRestant(inscription.getSoldeRestant());
            recuRepository.save(recu);
        });

        auditService.logAction("MODIFICATION_PAIEMENT", "Paiement", paiement.getId().toString(),
                "Modification montant de " + ancienMontant + " à " + nouveauMontant + " FCFA", request.getMotif());

        return mapToDTO(updated);
    }

    @Transactional
    public PaiementDTO annulerPaiement(Long paiementId, AnnulerPaiementRequest request) {
        Paiement paiement = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement introuvable"));
        verifierAccesPaiement(paiement);

        Utilisateur currentUser = auditService.getCurrentUser();
        Inscription inscription = paiement.getInscription();

        // Si le versement était lié au forfait de formation, déduire son montant
        if (paiement.getTypeEpreuve() == null) {
            BigDecimal nouveauTotal = inscription.getTotalVerse().subtract(paiement.getMontant());
            if (nouveauTotal.compareTo(BigDecimal.ZERO) < 0) {
                nouveauTotal = BigDecimal.ZERO;
            }
            inscription.setTotalVerse(nouveauTotal);
            inscription.recalculerSoldeEtStatut();
            inscriptionRepository.save(inscription);
        }

        auditService.logAction("ANNULATION_PAIEMENT", "Paiement", paiement.getId().toString(),
                "Suppression versement de " + paiement.getMontant() + " FCFA", request.getMotif());

        // Suppression en cascade du reçu et du paiement
        recuRepository.findByPaiementId(paiementId).ifPresent(recuRepository::delete);
        paiementRepository.delete(paiement);

        return null;
    }

    public PaiementDTO mapToDTO(Paiement p) {
        if (p == null) return null;
        Recu recu = p.getRecu() != null ? p.getRecu() : recuRepository.findByPaiementId(p.getId()).orElse(null);
        Inscription inscription = p.getInscription();
        Candidat candidat = inscription != null ? inscription.getCandidat() : null;
        BigDecimal soldeRestant = recu != null && recu.getSoldeRestant() != null 
                ? recu.getSoldeRestant() 
                : (inscription != null ? inscription.getSoldeRestant() : null);

        return PaiementDTO.builder()
                .id(p.getId())
                .candidatId(candidat != null ? candidat.getId() : null)
                .candidatNumeroDossier(candidat != null ? candidat.getNumeroDossier() : null)
                .candidatNomComplet(candidat != null ? candidat.getNom() + " " + candidat.getPrenom() : null)
                .utilisateurId(p.getUtilisateur() != null ? p.getUtilisateur().getId() : null)
                .utilisateurNomComplet(p.getUtilisateur() != null ? p.getUtilisateur().getNom() + " " + p.getUtilisateur().getPrenom() : null)
                .typeEpreuve(p.getTypeEpreuve())
                .montant(p.getMontant())
                .soldeRestant(soldeRestant)
                .datePaiement(p.getDatePaiement())
                .modeReglement(p.getModeReglement())
                .motifModification(p.getMotifModification())
                .dateModification(p.getDateModification())
                .utilisateurModifNom(p.getUtilisateurModif() != null ? p.getUtilisateurModif().getNom() + " " + p.getUtilisateurModif().getPrenom() : null)
                .numeroRecu(recu != null ? recu.getNumeroRecu() : null)
                .recuId(recu != null ? recu.getId() : null)
                .build();
    }
}
