package com.autoecole.repository;

import com.autoecole.entity.HistoriqueAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface HistoriqueActionRepository extends JpaRepository<HistoriqueAction, Long> {

    @Query("SELECT h FROM HistoriqueAction h WHERE " +
           "(:entite IS NULL OR h.entiteCible = :entite) " +
           "AND (:action IS NULL OR LOWER(h.action) LIKE LOWER(CONCAT('%', :action, '%'))) " +
           "AND (:debut IS NULL OR h.timestamp >= :debut) " +
           "AND (:fin IS NULL OR h.timestamp <= :fin) " +
           "ORDER BY h.timestamp DESC")
    Page<HistoriqueAction> filtrerHistorique(
            @Param("entite") String entite,
            @Param("action") String action,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin,
            Pageable pageable
    );
}
