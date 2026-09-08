package com.autoecole.service;

import com.autoecole.dto.PaiementDTOs.AnnulerPaiementRequest;
import com.autoecole.dto.PaiementDTOs.CreatePaiementRequest;
import com.autoecole.dto.PaiementDTOs.ModifierPaiementRequest;
import com.autoecole.dto.PaiementDTOs.PaiementDTO;
import com.autoecole.dto.PaiementDTOs.RecuDTO;
import com.autoecole.entity.*;
import com.autoecole.entity.enums.*;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.InscriptionRepository;
import com.autoecole.repository.PaiementRepository;
import com.autoecole.repository.RecuRepository;
import com.autoecole.repository.TransactionCaisseRepository;
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
    private final TransactionCaisseRepository transactionCaisseRepository;
    private final CandidatService candidatService;
    private final AuditService auditService;

    public Page<PaiementDTO> filtrerPaiements(Long candidatId, StatutPaiement statut, LocalDateTime debut, LocalDateTime fin, Pageable pageable) {
        return paiementRepository.filtrerPaiements(candidatId, statut, debut, fin, pageable)
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

        // 4. Mouvement de caisse automatique (ENTREE)
        TransactionCaisse tx = TransactionCaisse.builder()
                .typeMouvement(TypeMouvementCaisse.ENTREE)
                .montant(montant)
                .libelle("Versement " + typeVersement.name() + " - Dossier " + candidat.getNumeroDossier() + " (" + candidat.getNom() + " " + candidat.getPrenom() + ")")
                .categorie("RECETTE_FORMATION")
                .referencePiece(numeroRecu)
                .utilisateur(currentUser)
                .paiement(savedPaiement)
                .build();
        transactionCaisseRepository.save(tx);

        auditService.logAction("ENCAISSEMENT_VERSEMENT", "Paiement", numeroRecu,
                "Encaissement de " + montant + " FCFA pour le candidat " + candidat.getNumeroDossier() + " (Nouveau solde: " + inscription.getSoldeRestant() + " FCFA)", null);

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

        // Recalcul du total versé de l'inscription
        BigDecimal difference = nouveauMontant.subtract(ancienMontant);
        BigDecimal nouveauTotal = inscription.getTotalVerse().add(difference);

        if (nouveauTotal.compareTo(inscription.getMontantForfait()) > 0) {
            throw new BadRequestException("La modification entraîne un dépassement du forfait");
        }

        inscription.setTotalVerse(nouveauTotal);
        inscription.recalculerSoldeEtStatut();
        inscriptionRepository.save(inscription);

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
        Candidat candidat = inscription.getCandidat();

        // Déduire le montant de l'inscription
        inscription.setTotalVerse(inscription.getTotalVerse().subtract(paiement.getMontant()));
        inscription.recalculerSoldeEtStatut();
        inscriptionRepository.save(inscription);

        paiement.setStatut(StatutPaiement.ANNULE);
        paiement.setMotifModification(request.getMotif());
        paiement.setDateModification(LocalDateTime.now());
        paiement.setUtilisateurModif(currentUser);

        Paiement updated = paiementRepository.save(paiement);

        // Transaction de caisse d'annulation (SORTIE compensatoire)
        TransactionCaisse tx = TransactionCaisse.builder()
                .typeMouvement(TypeMouvementCaisse.SORTIE)
                .montant(paiement.getMontant())
                .libelle("Annulation versement candidat " + candidat.getNumeroDossier() + " - Motif: " + request.getMotif())
                .categorie("ANNULATION_RECETTE")
                .referencePiece(paiement.getRecu() != null ? paiement.getRecu().getNumeroRecu() : null)
                .utilisateur(currentUser)
                .build();
        transactionCaisseRepository.save(tx);

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
