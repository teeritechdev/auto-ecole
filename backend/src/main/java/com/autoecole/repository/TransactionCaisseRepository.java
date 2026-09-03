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
import java.util.List;

@Repository
public interface TransactionCaisseRepository extends JpaRepository<TransactionCaisse, Long> {

    @Query("SELECT tc FROM TransactionCaisse tc WHERE " +
           "(:type IS NULL OR tc.typeMouvement = :type) " +
           "AND (:categorie IS NULL OR tc.categorie = :categorie) " +
           "AND (:debut IS NULL OR tc.dateTransaction >= :debut) " +
           "AND (:fin IS NULL OR tc.dateTransaction <= :fin)")
    Page<TransactionCaisse> filtrerTransactions(
            @Param("type") TypeMouvementCaisse type,
            @Param("categorie") String categorie,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            Pageable pageable
    );

    @Query("SELECT tc FROM TransactionCaisse tc WHERE " +
           "(:debut IS NULL OR tc.dateTransaction >= :debut) " +
           "AND (:fin IS NULL OR tc.dateTransaction <= :fin) " +
           "ORDER BY tc.dateTransaction ASC")
    List<TransactionCaisse> findPourRapport(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT COALESCE(SUM(tc.montant), 0) FROM TransactionCaisse tc WHERE tc.typeMouvement = :type")
    BigDecimal sumByTypeMouvement(@Param("type") TypeMouvementCaisse type);

    @Query("SELECT COALESCE(SUM(tc.montant), 0) FROM TransactionCaisse tc WHERE tc.typeMouvement = :type " +
           "AND tc.dateTransaction BETWEEN :debut AND :fin")
    BigDecimal sumByTypeMouvementBetween(
            @Param("type") TypeMouvementCaisse type,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    List<TransactionCaisse> findTop10ByOrderByDateTransactionDesc();
}
