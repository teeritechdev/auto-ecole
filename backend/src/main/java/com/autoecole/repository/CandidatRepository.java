package com.autoecole.repository;

import com.autoecole.entity.Candidat;
import com.autoecole.entity.enums.StatutDossier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatRepository extends JpaRepository<Candidat, Long> {

    Optional<Candidat> findByNumeroDossier(String numeroDossier);

    Optional<Candidat> findTopByOrderByIdDesc();

    boolean existsByNumeroDossier(String numeroDossier);

    @Query("SELECT c FROM Candidat c WHERE " +
           "(:recherche IS NULL OR LOWER(c.nom) LIKE LOWER(CONCAT('%', :recherche, '%')) " +
           "OR LOWER(c.prenom) LIKE LOWER(CONCAT('%', :recherche, '%')) " +
           "OR LOWER(c.numeroDossier) LIKE LOWER(CONCAT('%', :recherche, '%')) " +
           "OR LOWER(c.telephone) LIKE LOWER(CONCAT('%', :recherche, '%'))) " +
           "AND (:statut IS NULL OR c.statutDossier = :statut) " +
           "AND (:categorieId IS NULL OR c.categoriePermis.id = :categorieId)")
    Page<Candidat> rechercherCandidats(
            @Param("recherche") String recherche,
            @Param("statut") StatutDossier statut,
            @Param("categorieId") Long categorieId,
            Pageable pageable
    );

    @Query("SELECT c FROM Candidat c WHERE " +
           "(:statut IS NULL OR c.statutDossier = :statut) " +
           "AND (:categorieId IS NULL OR c.categoriePermis.id = :categorieId)")
    List<Candidat> filtrerPourRapport(
            @Param("statut") StatutDossier statut,
            @Param("categorieId") Long categorieId
    );

    long countByStatutDossier(StatutDossier statutDossier);

    @Query("SELECT COALESCE(SUM(c.totalVerse), 0) FROM Candidat c")
    BigDecimal sumTotalVerse();

    @Query("SELECT COALESCE(SUM(c.soldeRestant), 0) FROM Candidat c")
    BigDecimal sumSoldeRestant();

    @Query("SELECT c FROM Candidat c WHERE c.dateEcheance BETWEEN :dateDebut AND :dateFin AND c.statutDossier != 'SOLDE'")
    List<Candidat> findCandidatsProchesExpiration(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    @Query("SELECT c FROM Candidat c WHERE c.dateEcheance < :dateRef AND c.statutDossier = 'EN_COURS'")
    List<Candidat> findCandidatsAExpirer(@Param("dateRef") LocalDate dateRef);
}
