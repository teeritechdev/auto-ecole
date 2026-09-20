package com.autoecole.repository;

import com.autoecole.entity.TransactionCaisse;
import com.autoecole.entity.enums.TypeMouvementCaisse;
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
public interface TransactionCaisseRepository extends JpaRepository<TransactionCaisse, Long> {

    @Query("SELECT tc FROM TransactionCaisse tc WHERE " +
           "(:type IS NULL OR tc.typeMouvement = :type) " +
           "AND (:natureOperationId IS NULL OR tc.natureOperation.id = :natureOperationId) " +
           "AND (CAST(:debut AS timestamp) IS NULL OR tc.dateTransaction >= :debut) " +
           "AND (CAST(:fin AS timestamp) IS NULL OR tc.dateTransaction <= :fin) " +
           "AND (:siteIds IS NULL OR tc.site.id IN :siteIds)")
    Page<TransactionCaisse> filtrerTransactions(
            @Param("type") TypeMouvementCaisse type,
            @Param("natureOperationId") Long natureOperationId,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            @Param("siteIds") Collection<Long> siteIds,
            Pageable pageable
    );

    @Query("SELECT tc FROM TransactionCaisse tc WHERE " +
           "(CAST(:debut AS timestamp) IS NULL OR tc.dateTransaction >= :debut) " +
           "AND (CAST(:fin AS timestamp) IS NULL OR tc.dateTransaction <= :fin) " +
           "AND (:siteIds IS NULL OR tc.site.id IN :siteIds) " +
           "ORDER BY tc.dateTransaction ASC")
    List<TransactionCaisse> findPourRapport(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            @Param("siteIds") Collection<Long> siteIds
    );

    @Query("SELECT COALESCE(SUM(tc.montant), 0) FROM TransactionCaisse tc WHERE tc.typeMouvement = :type " +
           "AND (:siteIds IS NULL OR tc.site.id IN :siteIds)")
    BigDecimal sumByTypeMouvement(@Param("type") TypeMouvementCaisse type, @Param("siteIds") Collection<Long> siteIds);

    @Query("SELECT COALESCE(SUM(tc.montant), 0) FROM TransactionCaisse tc WHERE tc.typeMouvement = :type " +
           "AND tc.dateTransaction BETWEEN :debut AND :fin " +
           "AND (:siteIds IS NULL OR tc.site.id IN :siteIds)")
    BigDecimal sumByTypeMouvementBetween(
            @Param("type") TypeMouvementCaisse type,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            @Param("siteIds") Collection<Long> siteIds
    );

    @Query("SELECT tc FROM TransactionCaisse tc WHERE (:siteIds IS NULL OR tc.site.id IN :siteIds) " +
           "ORDER BY tc.dateTransaction DESC")
    List<TransactionCaisse> findDernieresTransactions(@Param("siteIds") Collection<Long> siteIds, Pageable pageable);

    /** Solde de caisse (entrées − sorties) par site, pour les statistiques par site : les
     *  opérations sans site (données historiques) ne sont pas comptabilisées ici. */
    @Query("SELECT tc.site.id, " +
           "COALESCE(SUM(CASE WHEN tc.typeMouvement = 'ENTREE' THEN tc.montant ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN tc.typeMouvement = 'SORTIE' THEN tc.montant ELSE 0 END), 0) " +
           "FROM TransactionCaisse tc WHERE tc.site IS NOT NULL GROUP BY tc.site.id")
    List<Object[]> statistiquesCaisseParSite();

    boolean existsByNatureOperationId(Long natureOperationId);
}
