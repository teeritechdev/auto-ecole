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

    /** Une caissière/secrétaire restreinte à un site ne voit et n'encaisse que les paiements
     *  des candidats inscrits sur ce site (RG : gestion par site, comme pour un moniteur). */
    public Page<PaiementDTO> filtrerPaiements(Long candidatId, StatutPaiement statut, LocalDateTime debut, LocalDateTime fin, Long siteFiltreId, Pageable pageable) {
        java.util.Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        if (siteIds != null && siteIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return paiementRepository.filtrerPaiements(candidatId, statut, debut, fin, siteIds, siteFiltreId, pageable)
                .map(this::mapToDTO);
    }

    public List<PaiementDTO> getPaiementsByCandidat(Long candidatId) {
        return paiementRepository.findByCandidatIdOrderByDatePaiementDesc(candidatId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PaiementDTO getPaiementById(Long id) {
        Paiement p = paiementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement non trouvé avec l'id: " + id));
        return mapToDTO(p);
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

        // Vérifier s'il s'agit du premier versement de ce cycle d'inscription
        long nbPaiementsValides = paiementRepository.countByInscriptionIdAndStatut(inscription.getId(), StatutPaiement.VALIDE);
        TypeVersement typeVersement;

        if (nbPaiementsValides == 0) {
            // RG02 : Premier versement obligatoire entre 35 000 et 50 000 FCFA
            typeVersement = TypeVersement.PREMIER_VERSEMENT;
            BigDecimal min1er = new BigDecimal("35000");
            BigDecimal max1er = new BigDecimal("50000");
            if (montant.compareTo(min1er) < 0 || montant.compareTo(max1er) > 0) {
                throw new BadRequestException("Le premier versement doit obligatoirement être compris entre 35 000 et 50 000 FCFA (RG02). Montant saisi: " + montant + " FCFA");
            }
        } else {
            // RG03 : Versements suivants libres
            typeVersement = TypeVersement.VERSEMENT_SUIVANT;
        }

        Utilisateur currentUser = auditService.getCurrentUser();

        // 1. Enregistrement du paiement
        Paiement paiement = Paiement.builder()
                .inscription(inscription)
                .utilisateur(currentUser)
                .typeVersement(typeVersement)
                .montant(montant)
                .datePaiement(LocalDateTime.now())
                .modeReglement(request.getModeReglement() != null ? request.getModeReglement() : ModeReglement.ESPECES)
                .statut(StatutPaiement.VALIDE)
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
                .typeVersement(TypeVersement.FRAIS_EXAMEN)
                .typeEpreuve(request.getTypeEpreuve())
                .montant(montant)
                .datePaiement(LocalDateTime.now())
                .modeReglement(request.getModeReglement() != null ? request.getModeReglement() : ModeReglement.ESPECES)
                .statut(StatutPaiement.VALIDE)
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

        if (paiement.getStatut() == StatutPaiement.ANNULE) {
            throw new BadRequestException("Impossible de modifier un paiement déjà annulé");
        }

        BigDecimal ancienMontant = paiement.getMontant();
        BigDecimal nouveauMontant = request.getMontant();

        Inscription inscription = paiement.getInscription();

        // Validation si c'est le 1er versement
        if (paiement.getTypeVersement() == TypeVersement.PREMIER_VERSEMENT) {
            BigDecimal min1er = new BigDecimal("35000");
            BigDecimal max1er = new BigDecimal("50000");
            if (nouveauMontant.compareTo(min1er) < 0 || nouveauMontant.compareTo(max1er) > 0) {
                throw new BadRequestException("Le premier versement doit obligatoirement rester compris entre 35 000 et 50 000 FCFA (RG02)");
            }
        }

        Utilisateur currentUser = auditService.getCurrentUser();

        // Un versement FRAIS_EXAMEN est distinct du forfait de formation : il n'a jamais
        // alimenté totalVerse/soldeRestant, donc sa modification ne les touche pas non plus.
        if (paiement.getTypeVersement() != TypeVersement.FRAIS_EXAMEN) {
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
        paiement.setStatut(StatutPaiement.MODIFIE);
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

        if (paiement.getStatut() == StatutPaiement.ANNULE) {
            throw new BadRequestException("Ce paiement est déjà annulé");
        }

        Utilisateur currentUser = auditService.getCurrentUser();
        Inscription inscription = paiement.getInscription();

        // Un versement FRAIS_EXAMEN n'a jamais alimenté totalVerse/soldeRestant (cf.
        // enregistrerFraisExamen) : rien à déduire du forfait de formation ici.
        if (paiement.getTypeVersement() != TypeVersement.FRAIS_EXAMEN) {
            inscription.setTotalVerse(inscription.getTotalVerse().subtract(paiement.getMontant()));
            inscription.recalculerSoldeEtStatut();
            inscriptionRepository.save(inscription);
        }

        paiement.setStatut(StatutPaiement.ANNULE);
        paiement.setMotifModification(request.getMotif());
        paiement.setDateModification(LocalDateTime.now());
        paiement.setUtilisateurModif(currentUser);

        Paiement updated = paiementRepository.save(paiement);

        auditService.logAction("ANNULATION_PAIEMENT", "Paiement", paiement.getId().toString(),
                "Annulation versement de " + paiement.getMontant() + " FCFA", request.getMotif());

        return mapToDTO(updated);
    }

    public PaiementDTO mapToDTO(Paiement p) {
        Recu recu = p.getRecu() != null ? p.getRecu() : recuRepository.findByPaiementId(p.getId()).orElse(null);
        Candidat candidat = p.getInscription() != null ? p.getInscription().getCandidat() : null;

        return PaiementDTO.builder()
                .id(p.getId())
                .candidatId(candidat != null ? candidat.getId() : null)
                .candidatNumeroDossier(candidat != null ? candidat.getNumeroDossier() : null)
                .candidatNomComplet(candidat != null ? candidat.getNom() + " " + candidat.getPrenom() : null)
                .utilisateurId(p.getUtilisateur() != null ? p.getUtilisateur().getId() : null)
                .utilisateurNomComplet(p.getUtilisateur() != null ? p.getUtilisateur().getNom() + " " + p.getUtilisateur().getPrenom() : null)
                .typeVersement(p.getTypeVersement())
                .typeEpreuve(p.getTypeEpreuve())
                .montant(p.getMontant())
                .datePaiement(p.getDatePaiement())
                .modeReglement(p.getModeReglement())
                .statut(p.getStatut())
                .motifModification(p.getMotifModification())
                .dateModification(p.getDateModification())
                .utilisateurModifNom(p.getUtilisateurModif() != null ? p.getUtilisateurModif().getNom() + " " + p.getUtilisateurModif().getPrenom() : null)
                .numeroRecu(recu != null ? recu.getNumeroRecu() : null)
                .recuId(recu != null ? recu.getId() : null)
                .build();
    }
}
