package com.autoecole.repository;

import com.autoecole.entity.TransactionCaisse;
import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.entity.enums.TypeOperationCaisse;
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
           "AND (CAST(:debut AS timestamp) IS NULL OR tc.dateTransaction >= :debut) " +
           "AND (CAST(:fin AS timestamp) IS NULL OR tc.dateTransaction <= :fin)")
    Page<TransactionCaisse> filtrerTransactions(
            @Param("type") TypeMouvementCaisse type,
            @Param("categorie") String categorie,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            Pageable pageable
    );

    @Query("SELECT tc FROM TransactionCaisse tc WHERE " +
           "(CAST(:debut AS timestamp) IS NULL OR tc.dateTransaction >= :debut) " +
           "AND (CAST(:fin AS timestamp) IS NULL OR tc.dateTransaction <= :fin) " +
           "ORDER BY tc.dateTransaction ASC")
    List<TransactionCaisse> findPourRapport(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    // PAIEMENT_FORMATION est exclu : ces lignes ne font que rendre visibles les versements de
    // formation dans le Journal Caisse (transparence pour l'ADMIN) ; l'argent correspondant
    // n'est physiquement dans la caisse que s'il est explicitement transféré via un
    // PRELEVEMENT_FORMATION, donc on ne les compte pas dans le Solde de Caisse pour éviter
    // de compter deux fois le même argent.
    @Query("SELECT COALESCE(SUM(tc.montant), 0) FROM TransactionCaisse tc WHERE tc.typeMouvement = :type " +
           "AND tc.typeOperation <> com.autoecole.entity.enums.TypeOperationCaisse.PAIEMENT_FORMATION")
    BigDecimal sumByTypeMouvement(@Param("type") TypeMouvementCaisse type);

    @Query("SELECT COALESCE(SUM(tc.montant), 0) FROM TransactionCaisse tc WHERE tc.typeMouvement = :type " +
           "AND tc.typeOperation <> com.autoecole.entity.enums.TypeOperationCaisse.PAIEMENT_FORMATION " +
           "AND tc.dateTransaction BETWEEN :debut AND :fin")
    BigDecimal sumByTypeMouvementBetween(
            @Param("type") TypeMouvementCaisse type,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    List<TransactionCaisse> findTop10ByOrderByDateTransactionDesc();

    @Query("SELECT COALESCE(SUM(tc.montant), 0) FROM TransactionCaisse tc WHERE " +
           "tc.typeMouvement = :typeMouvement AND tc.typeOperation = :typeOperation")
    BigDecimal sumByTypeMouvementAndTypeOperation(
            @Param("typeMouvement") TypeMouvementCaisse typeMouvement,
            @Param("typeOperation") TypeOperationCaisse typeOperation
    );
}
