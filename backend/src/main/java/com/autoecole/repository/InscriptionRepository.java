package com.autoecole.repository;

import com.autoecole.entity.Inscription;
import com.autoecole.entity.enums.StatutDossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    Optional<Inscription> findByCandidatIdAndActiveTrue(Long candidatId);

    List<Inscription> findByCandidatIdOrderByNumeroCycleDesc(Long candidatId);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.active = true AND i.statutDossier = :statutDossier " +
           "AND (:siteIds IS NULL OR i.site.id IN :siteIds)")
    long countByActiveTrueAndStatutDossierAndSite(@Param("statutDossier") StatutDossier statutDossier, @Param("siteIds") Collection<Long> siteIds);

    @Query("SELECT COUNT(i) FROM Inscription i WHERE i.active = true AND (:siteIds IS NULL OR i.site.id IN :siteIds)")
    long countByActiveTrueAndSite(@Param("siteIds") Collection<Long> siteIds);

    @Query("SELECT COALESCE(SUM(i.totalVerse), 0) FROM Inscription i WHERE i.active = true " +
           "AND (:siteIds IS NULL OR i.site.id IN :siteIds)")
    BigDecimal sumTotalVerseActif(@Param("siteIds") Collection<Long> siteIds);

    @Query("SELECT COALESCE(SUM(i.soldeRestant), 0) FROM Inscription i WHERE i.active = true " +
           "AND (:siteIds IS NULL OR i.site.id IN :siteIds)")
    BigDecimal sumSoldeRestantActif(@Param("siteIds") Collection<Long> siteIds);

    @Query("SELECT i FROM Inscription i WHERE i.active = true " +
           "AND i.dateEcheance BETWEEN :dateDebut AND :dateFin AND i.statutDossier != 'SOLDE' " +
           "AND (:siteIds IS NULL OR i.site.id IN :siteIds)")
    List<Inscription> findInscriptionsActivesProchesExpiration(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin,
            @Param("siteIds") Collection<Long> siteIds
    );

    @Query("SELECT i FROM Inscription i WHERE i.active = true " +
           "AND i.dateEcheance < :dateRef AND i.statutDossier = 'EN_COURS'")
    List<Inscription> findInscriptionsActivesAExpirer(@Param("dateRef") LocalDate dateRef);
}
