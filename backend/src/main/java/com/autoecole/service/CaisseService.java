package com.autoecole.service;

import com.autoecole.dto.CaisseDTOs.*;
import com.autoecole.entity.NatureOperation;
import com.autoecole.entity.TransactionCaisse;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.NatureOperationRepository;
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
import java.util.List;
import java.util.stream.Collectors;

/**
 * Caisse & Trésorerie interne : caisse de dépenses/recettes diverses totalement autonome,
 * indépendante des candidats, des inscriptions et des paiements de formation (suivis
 * exclusivement dans le module Paiements). Chaque opération est rattachée à une
 * {@link NatureOperation} qui détermine son sens — jamais ressaisi au niveau de l'opération.
 */
@Service
@RequiredArgsConstructor
public class CaisseService {

    private final TransactionCaisseRepository transactionRepository;
    private final NatureOperationRepository natureOperationRepository;
    private final AuditService auditService;

    // @Transactional est nécessaire ici : mapToDTO() lit natureOperation, une relation LAZY —
    // sans session Hibernate encore ouverte au moment de ce mapping (le repository ferme la
    // sienne dès que sa propre méthode retourne), l'accès lèverait une LazyInitializationException.
    @Transactional(readOnly = true)
    public Page<TransactionCaisseDTO> filtrerTransactions(TypeMouvementCaisse type, Long natureOperationId, LocalDateTime debut, LocalDateTime fin, Pageable pageable) {
        return transactionRepository.filtrerTransactions(type, natureOperationId, debut, fin, pageable)
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

        return RecapCaisseDTO.builder()
                .totalEntrees(totalEntrees)
                .totalSorties(totalSorties)
                .soldeCaisse(soldeCaisse)
                .totalEntreesJour(entreesJour)
                .totalSortiesJour(sortiesJour)
                .soldeJour(soldeJour)
                .build();
    }

    @Transactional
    public TransactionCaisseDTO enregistrerTransaction(CreateTransactionCaisseRequest request) {
        Utilisateur currentUser = auditService.getCurrentUser();

        NatureOperation nature = natureOperationRepository.findById(request.getNatureOperationId())
                .orElseThrow(() -> new ResourceNotFoundException("Nature d'opération introuvable"));
        if (!nature.isActif()) {
            throw new BadRequestException("Cette nature d'opération est inactive et ne peut plus être utilisée");
        }

        TransactionCaisse tx = TransactionCaisse.builder()
                .natureOperation(nature)
                .typeMouvement(nature.getSens())
                .montant(request.getMontant())
                .libelle(request.getLibelle().trim())
                .numeroFacture(request.getNumeroFacture())
                .dateTransaction(LocalDateTime.now())
                .utilisateur(currentUser)
                .build();

        TransactionCaisse saved = transactionRepository.save(tx);
        auditService.logAction("MOUVEMENT_CAISSE", "TransactionCaisse", saved.getId().toString(),
                nature.getSens() + " de " + request.getMontant() + " FCFA - " + nature.getLibelle() + " - " + request.getLibelle(), null);

        return mapToDTO(saved);
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
        NatureOperation n = tx.getNatureOperation();
        return TransactionCaisseDTO.builder()
                .id(tx.getId())
                .natureOperation(NatureOperationDTO.builder()
                        .id(n.getId())
                        .code(n.getCode())
                        .libelle(n.getLibelle())
                        .sens(n.getSens())
                        .planComptable(n.getPlanComptable())
                        .description(n.getDescription())
                        .actif(n.isActif())
                        .build())
                .typeMouvement(tx.getTypeMouvement())
                .montant(tx.getMontant())
                .libelle(tx.getLibelle())
                .numeroFacture(tx.getNumeroFacture())
                .dateTransaction(tx.getDateTransaction())
                .utilisateurId(tx.getUtilisateur() != null ? tx.getUtilisateur().getId() : null)
                .utilisateurNomComplet(tx.getUtilisateur() != null ? tx.getUtilisateur().getNom() + " " + tx.getUtilisateur().getPrenom() : "")
                .build();
    }
}
