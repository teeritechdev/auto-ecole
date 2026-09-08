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

    long countByActiveTrueAndStatutDossier(StatutDossier statutDossier);

    @Query("SELECT COALESCE(SUM(i.totalVerse), 0) FROM Inscription i WHERE i.active = true")
    BigDecimal sumTotalVerseActif();

    @Query("SELECT COALESCE(SUM(i.soldeRestant), 0) FROM Inscription i WHERE i.active = true")
    BigDecimal sumSoldeRestantActif();

    @Query("SELECT i FROM Inscription i WHERE i.active = true " +
           "AND i.dateEcheance BETWEEN :dateDebut AND :dateFin AND i.statutDossier != 'SOLDE'")
    List<Inscription> findInscriptionsActivesProchesExpiration(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    @Query("SELECT i FROM Inscription i WHERE i.active = true " +
           "AND i.dateEcheance < :dateRef AND i.statutDossier = 'EN_COURS'")
    List<Inscription> findInscriptionsActivesAExpirer(@Param("dateRef") LocalDate dateRef);
}
