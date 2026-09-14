package com.autoecole.service;

import com.autoecole.dto.CaisseDTOs.*;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.ConfigurationApplication;
import com.autoecole.entity.TransactionCaisse;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.entity.enums.TypeOperationCaisse;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.ConfigurationApplicationRepository;
import com.autoecole.repository.InscriptionRepository;
import com.autoecole.repository.PassageExamenRepository;
import com.autoecole.repository.TransactionCaisseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CaisseService {

    private final TransactionCaisseRepository transactionRepository;
    private final PassageExamenRepository passageExamenRepository;
    private final InscriptionRepository inscriptionRepository;
    private final ConfigurationApplicationRepository configurationRepository;
    private final AuditService auditService;

    // @Transactional est nécessaire ici : mapToDTO() lit candidatsConcernes, une collection
    // LAZY (ManyToMany) — sans session Hibernate encore ouverte au moment de ce mapping (le
    // repository ferme la sienne dès que sa propre méthode retourne), l'accès lève une
    // LazyInitializationException qui remonte en 500 (constaté sur ce même besoin : tableaux
    // de bord/statistiques de paiement qui restent désespérément à zéro).
    @Transactional(readOnly = true)
    public Page<TransactionCaisseDTO> filtrerTransactions(TypeMouvementCaisse type, String categorie, LocalDateTime debut, LocalDateTime fin, Pageable pageable) {
        return transactionRepository.filtrerTransactions(type, categorie, debut, fin, pageable)
                .map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public List<TransactionCaisseDTO> getTransactionsPourRapport(LocalDateTime debut, LocalDateTime fin) {
        return transactionRepository.findPourRapport(debut, fin).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public RecapCaisseDTO getRecapCaisse() {
        BigDecimal totalEntrees = transactionRepository.sumByTypeMouvement(TypeMouvementCaisse.ENTREE);
        BigDecimal totalSorties = transactionRepository.sumByTypeMouvement(TypeMouvementCaisse.SORTIE);
        BigDecimal soldeCaisse = totalEntrees.subtract(totalSorties);

        LocalDateTime debutJour = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime finJour = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        BigDecimal entreesJour = transactionRepository.sumByTypeMouvementBetween(TypeMouvementCaisse.ENTREE, debutJour, finJour);
        BigDecimal sortiesJour = transactionRepository.sumByTypeMouvementBetween(TypeMouvementCaisse.SORTIE, debutJour, finJour);
        BigDecimal soldeJour = entreesJour.subtract(sortiesJour);

        BigDecimal totalFormationEncaisse = inscriptionRepository.sumTotalVerseActif(null);
        BigDecimal totalPreleveFormation = transactionRepository.sumByTypeMouvementAndTypeOperation(
                TypeMouvementCaisse.ENTREE, TypeOperationCaisse.PRELEVEMENT_FORMATION);
        BigDecimal disponiblePourPrelevement = totalFormationEncaisse.subtract(totalPreleveFormation);
        if (disponiblePourPrelevement.compareTo(BigDecimal.ZERO) < 0) {
            disponiblePourPrelevement = BigDecimal.ZERO;
        }

        return RecapCaisseDTO.builder()
                .totalEntrees(totalEntrees)
                .totalSorties(totalSorties)
                .soldeCaisse(soldeCaisse)
                .totalEntreesJour(entreesJour)
                .totalSortiesJour(sortiesJour)
                .soldeJour(soldeJour)
                .totalFormationEncaisse(totalFormationEncaisse)
                .totalPreleveFormation(totalPreleveFormation)
                .disponiblePourPrelevement(disponiblePourPrelevement)
                .build();
    }

    /** Candidats éligibles à une prise en charge de leurs frais d'examen à cette date/épreuve
     *  (utilisé par le frontend pour pré-remplir la liste d'un décaissement FRAIS_EXAMEN). */
    public List<CandidatConcerneDTO> getCandidatsEligiblesFraisExamen(TypeEpreuve typeEpreuve, LocalDate dateExamen) {
        return passageExamenRepository.findCandidatsPriseEnChargeParEpreuveEtDate(typeEpreuve, dateExamen).stream()
                .map(c -> CandidatConcerneDTO.builder()
                        .id(c.getId())
                        .numeroDossier(c.getNumeroDossier())
                        .nomComplet(c.getNom() + " " + c.getPrenom())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public TransactionCaisseDTO enregistrerTransaction(CreateTransactionCaisseRequest request) {
        Utilisateur currentUser = auditService.getCurrentUser();
        TypeOperationCaisse typeOperation = request.getTypeOperation() != null ? request.getTypeOperation() : TypeOperationCaisse.AUTRE;

        if (typeOperation == TypeOperationCaisse.FRAIS_EXAMEN && request.getTypeMouvement() != TypeMouvementCaisse.SORTIE) {
            throw new BadRequestException("Le type d'opération \"Frais d'examen\" doit être un décaissement (SORTIE)");
        }
        if (typeOperation == TypeOperationCaisse.PRELEVEMENT_FORMATION && request.getTypeMouvement() != TypeMouvementCaisse.ENTREE) {
            throw new BadRequestException("Le type d'opération \"Prélèvement sur frais de formation\" doit être un encaissement (ENTREE)");
        }

        TransactionCaisse.TransactionCaisseBuilder builder = TransactionCaisse.builder()
                .typeMouvement(request.getTypeMouvement())
                .libelle(request.getLibelle().trim())
                .categorie(request.getCategorie())
                .referencePiece(request.getReferencePiece())
                .dateTransaction(LocalDateTime.now())
                .utilisateur(currentUser)
                .typeOperation(typeOperation);

        BigDecimal montant;
        String detailAudit;

        if (typeOperation == TypeOperationCaisse.FRAIS_EXAMEN) {
            if (request.getDateExamen() == null) {
                throw new BadRequestException("La date de l'examen est obligatoire");
            }
            if (request.getTypeEpreuve() == null) {
                throw new BadRequestException("L'épreuve concernée est obligatoire");
            }
            if (request.getCandidatIds() == null || request.getCandidatIds().isEmpty()) {
                throw new BadRequestException("Sélectionnez au moins un candidat");
            }

            List<Candidat> eligibles = passageExamenRepository.findCandidatsPriseEnChargeParEpreuveEtDate(request.getTypeEpreuve(), request.getDateExamen());
            java.util.Map<Long, Candidat> eligiblesParId = eligibles.stream().collect(Collectors.toMap(Candidat::getId, c -> c));

            Set<Candidat> candidatsSelectionnes = new HashSet<>();
            for (Long candidatId : request.getCandidatIds()) {
                Candidat candidat = eligiblesParId.get(candidatId);
                if (candidat == null) {
                    throw new BadRequestException("Un candidat sélectionné n'est pas (ou plus) éligible à la prise en charge pour cette épreuve et cette date");
                }
                candidatsSelectionnes.add(candidat);
            }

            BigDecimal prixUnitaire = getPrixUnitaireExamen(request.getTypeEpreuve());
            montant = prixUnitaire.multiply(BigDecimal.valueOf(candidatsSelectionnes.size()));

            builder.montant(montant)
                    .dateExamen(request.getDateExamen())
                    .typeEpreuveExamen(request.getTypeEpreuve())
                    .candidatsConcernes(candidatsSelectionnes);

            detailAudit = "Prise en charge frais d'examen " + request.getTypeEpreuve() + " du " + request.getDateExamen()
                    + " pour " + candidatsSelectionnes.size() + " candidat(s), " + montant + " FCFA";
        } else if (typeOperation == TypeOperationCaisse.PRELEVEMENT_FORMATION) {
            montant = request.getMontant();
            if (montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Le montant est obligatoire");
            }

            BigDecimal totalFormationEncaisse = inscriptionRepository.sumTotalVerseActif(null);
            BigDecimal totalPreleveFormation = transactionRepository.sumByTypeMouvementAndTypeOperation(
                    TypeMouvementCaisse.ENTREE, TypeOperationCaisse.PRELEVEMENT_FORMATION);
            BigDecimal disponible = totalFormationEncaisse.subtract(totalPreleveFormation);

            if (montant.compareTo(disponible) > 0) {
                throw new BadRequestException("Le montant prélevé (" + montant + " FCFA) dépasse le solde disponible des frais de formation ("
                        + disponible + " FCFA)");
            }

            builder.montant(montant);
            detailAudit = "Prélèvement de " + montant + " FCFA sur les frais de formation";
        } else {
            montant = request.getMontant();
            if (montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Le montant est obligatoire");
            }
            builder.montant(montant);
            detailAudit = request.getTypeMouvement() + " de " + montant + " FCFA - " + request.getLibelle();
        }

        TransactionCaisse saved = transactionRepository.save(builder.build());
        auditService.logAction("MOUVEMENT_CAISSE", "TransactionCaisse", saved.getId().toString(), detailAudit, null);

        return mapToDTO(saved);
    }

    private BigDecimal getPrixUnitaireExamen(TypeEpreuve typeEpreuve) {
        ConfigurationApplication configuration = configurationRepository.findById(1L).orElseGet(ConfigurationApplication::new);
        BigDecimal prix = switch (typeEpreuve) {
            case CODE -> configuration.getPrixExamenCode();
            case CRENEAU -> configuration.getPrixExamenCreneau();
            case CIRCULATION -> configuration.getPrixExamenCirculation();
        };
        return prix != null ? prix : BigDecimal.ZERO;
    }

    @Transactional
    public void deleteTransaction(Long id, String motif) {
        TransactionCaisse tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction introuvable"));

        transactionRepository.delete(tx);
        auditService.logAction("SUPPRESSION_MOUVEMENT_CAISSE", "TransactionCaisse", id.toString(),
                "Suppression du mouvement " + tx.getTypeMouvement() + " de " + tx.getMontant() + " FCFA", motif);
    }

    @Transactional(readOnly = true)
    public List<TransactionCaisseDTO> getDernieresTransactions() {
        return transactionRepository.findTop10ByOrderByDateTransactionDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TransactionCaisseDTO mapToDTO(TransactionCaisse tx) {
        return TransactionCaisseDTO.builder()
                .id(tx.getId())
                .typeMouvement(tx.getTypeMouvement())
                .montant(tx.getMontant())
                .libelle(tx.getLibelle())
                .categorie(tx.getCategorie())
                .referencePiece(tx.getReferencePiece())
                .dateTransaction(tx.getDateTransaction())
                .utilisateurId(tx.getUtilisateur() != null ? tx.getUtilisateur().getId() : null)
                .utilisateurNomComplet(tx.getUtilisateur() != null ? tx.getUtilisateur().getNom() + " " + tx.getUtilisateur().getPrenom() : "")
                .paiementId(tx.getPaiement() != null ? tx.getPaiement().getId() : null)
                .typeOperation(tx.getTypeOperation())
                .dateExamen(tx.getDateExamen())
                .typeEpreuveExamen(tx.getTypeEpreuveExamen())
                .candidatsConcernes(tx.getCandidatsConcernes() == null ? List.of() : tx.getCandidatsConcernes().stream()
                        .map(c -> CandidatConcerneDTO.builder()
                                .id(c.getId())
                                .numeroDossier(c.getNumeroDossier())
                                .nomComplet(c.getNom() + " " + c.getPrenom())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
