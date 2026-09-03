package com.autoecole.service;

import com.autoecole.dto.CaisseDTOs.*;
import com.autoecole.entity.TransactionCaisse;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.exception.ResourceNotFoundException;
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

@Service
@RequiredArgsConstructor
public class CaisseService {

    private final TransactionCaisseRepository transactionRepository;
    private final AuditService auditService;

    public Page<TransactionCaisseDTO> filtrerTransactions(TypeMouvementCaisse type, String categorie, LocalDateTime debut, LocalDateTime fin, Pageable pageable) {
        return transactionRepository.filtrerTransactions(type, categorie, debut, fin, pageable)
                .map(this::mapToDTO);
    }

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

        TransactionCaisse tx = TransactionCaisse.builder()
                .typeMouvement(request.getTypeMouvement())
                .montant(request.getMontant())
                .libelle(request.getLibelle().trim())
                .categorie(request.getCategorie())
                .referencePiece(request.getReferencePiece())
                .dateTransaction(LocalDateTime.now())
                .utilisateur(currentUser)
                .build();

        TransactionCaisse saved = transactionRepository.save(tx);
        auditService.logAction("MOUVEMENT_CAISSE", "TransactionCaisse", saved.getId().toString(),
                request.getTypeMouvement() + " de " + request.getMontant() + " FCFA - " + request.getLibelle(), null);

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
                .build();
    }
}
