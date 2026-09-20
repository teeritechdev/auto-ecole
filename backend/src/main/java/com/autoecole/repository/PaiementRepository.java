package com.autoecole.repository;

import com.autoecole.entity.Paiement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    List<Paiement> findByInscriptionIdOrderByDatePaiementDesc(Long inscriptionId);

    long countByInscriptionId(Long inscriptionId);

    @Query("SELECT p FROM Paiement p WHERE " +
           "(:candidatId IS NULL OR p.inscription.candidat.id = :candidatId) " +
           "AND (CAST(:debut AS timestamp) IS NULL OR p.datePaiement >= :debut) " +
           "AND (CAST(:fin AS timestamp) IS NULL OR p.datePaiement <= :fin) " +
           "AND (:siteIds IS NULL OR p.inscription.site.id IN :siteIds) " +
           "AND (:siteFiltreId IS NULL OR p.inscription.site.id = :siteFiltreId)")
    Page<Paiement> filtrerPaiements(
            @Param("candidatId") Long candidatId,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            @Param("siteIds") Collection<Long> siteIds,
            @Param("siteFiltreId") Long siteFiltreId,
            Pageable pageable
    );

    /** Nombre et montant total des paiements par site (statistiques d'activité par
     *  site) : les paiements sans site (données historiques) ne sont pas comptabilisés ici. */
    @Query("SELECT p.inscription.site.id, COUNT(p.id), COALESCE(SUM(p.montant), 0) " +
           "FROM Paiement p WHERE p.inscription.site IS NOT NULL " +
           "GROUP BY p.inscription.site.id")
    List<Object[]> statistiquesPaiementsParSite();

    @Query("SELECT p FROM Paiement p WHERE p.inscription.candidat.id = :candidatId ORDER BY p.datePaiement DESC")
    List<Paiement> findByCandidatIdOrderByDatePaiementDesc(@Param("candidatId") Long candidatId);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.inscription.id = :inscriptionId")
    BigDecimal sumTotalValideByInscription(@Param("inscriptionId") Long inscriptionId);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.datePaiement BETWEEN :debut AND :fin")
    BigDecimal sumTotalValideBetween(@Param("debut") LocalDateTime debut, @Param("fin") LocalDateTime fin);

    @Query("SELECT p FROM Paiement p WHERE (:siteIds IS NULL OR p.inscription.site.id IN :siteIds) " +
           "ORDER BY p.datePaiement DESC")
    List<Paiement> findDerniersPaiements(@Param("siteIds") Collection<Long> siteIds, Pageable pageable);
}
