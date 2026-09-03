package com.autoecole.repository;

import com.autoecole.entity.Paiement;
import com.autoecole.entity.enums.StatutPaiement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    List<Paiement> findByCandidatIdOrderByDatePaiementDesc(Long candidatId);

    List<Paiement> findByCandidatIdAndStatutOrderByDatePaiementAsc(Long candidatId, StatutPaiement statut);

    long countByCandidatIdAndStatut(Long candidatId, StatutPaiement statut);

    @Query("SELECT p FROM Paiement p WHERE " +
           "(:candidatId IS NULL OR p.candidat.id = :candidatId) " +
           "AND (:statut IS NULL OR p.statut = :statut) " +
           "AND (:debut IS NULL OR p.datePaiement >= :debut) " +
           "AND (:fin IS NULL OR p.datePaiement <= :fin)")
    Page<Paiement> filtrerPaiements(
            @Param("candidatId") Long candidatId,
            @Param("statut") StatutPaiement statut,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.candidat.id = :candidatId AND p.statut = 'VALIDE'")
    BigDecimal sumTotalValideByCandidat(@Param("candidatId") Long candidatId);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.statut = 'VALIDE' AND p.datePaiement BETWEEN :debut AND :fin")
    BigDecimal sumTotalValideBetween(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);

    List<Paiement> findTop10ByOrderByDatePaiementDesc();
}
