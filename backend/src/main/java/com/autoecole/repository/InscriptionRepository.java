package com.autoecole.repository;

import com.autoecole.entity.Inscription;
import com.autoecole.entity.enums.StatutDossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    Optional<Inscription> findByCandidatIdAndActiveTrue(Long candidatId);

    List<Inscription> findByCandidatIdOrderByNumeroCycleDesc(Long candidatId);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.active = true AND i.statutDossier = :statutDossier " +
           "AND (:siteId IS NULL OR i.site.id = :siteId)")
    long countByActiveTrueAndStatutDossierAndSite(@Param("statutDossier") StatutDossier statutDossier, @Param("siteId") Long siteId);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.active = true AND (:siteId IS NULL OR i.site.id = :siteId)")
    long countByActiveTrueAndSite(@Param("siteId") Long siteId);

    @Query("SELECT COALESCE(SUM(i.totalVerse), 0) FROM Inscription i WHERE i.active = true " +
           "AND (:siteId IS NULL OR i.site.id = :siteId)")
    BigDecimal sumTotalVerseActif(@Param("siteId") Long siteId);

    @Query("SELECT COALESCE(SUM(i.soldeRestant), 0) FROM Inscription i WHERE i.active = true " +
           "AND (:siteId IS NULL OR i.site.id = :siteId)")
    BigDecimal sumSoldeRestantActif(@Param("siteId") Long siteId);

    @Query("SELECT i FROM Inscription i WHERE i.active = true " +
           "AND i.dateEcheance BETWEEN :dateDebut AND :dateFin AND i.statutDossier != 'SOLDE' " +
           "AND (:siteId IS NULL OR i.site.id = :siteId)")
    List<Inscription> findInscriptionsActivesProchesExpiration(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin,
            @Param("siteId") Long siteId
    );

    @Query("SELECT i FROM Inscription i WHERE i.active = true " +
           "AND i.dateEcheance < :dateRef AND i.statutDossier = 'EN_COURS'")
    List<Inscription> findInscriptionsActivesAExpirer(@Param("dateRef") LocalDate dateRef);
}
