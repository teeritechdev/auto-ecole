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

    List<Paiement> findByInscriptionIdOrderByDatePaiementDesc(Long inscriptionId);

    long countByInscriptionIdAndStatut(Long inscriptionId, StatutPaiement statut);

    @Query("SELECT p FROM Paiement p WHERE " +
           "(:candidatId IS NULL OR p.inscription.candidat.id = :candidatId) " +
           "AND (:statut IS NULL OR p.statut = :statut) " +
           "AND (CAST(:debut AS timestamp) IS NULL OR p.datePaiement >= :debut) " +
           "AND (CAST(:fin AS timestamp) IS NULL OR p.datePaiement <= :fin)")
    Page<Paiement> filtrerPaiements(
            @Param("candidatId") Long candidatId,
            @Param("statut") StatutPaiement statut,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            Pageable pageable
    );

    @Query("SELECT p FROM Paiement p WHERE p.inscription.candidat.id = :candidatId ORDER BY p.datePaiement DESC")
    List<Paiement> findByCandidatIdOrderByDatePaiementDesc(@Param("candidatId") Long candidatId);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.inscription.id = :inscriptionId AND p.statut = 'VALIDE'")
    BigDecimal sumTotalValideByInscription(@Param("inscriptionId") Long inscriptionId);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.statut = 'VALIDE' AND p.datePaiement BETWEEN :debut AND :fin")
    BigDecimal sumTotalValideBetween(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);

    List<Paiement> findTop10ByOrderByDatePaiementDesc();
}
