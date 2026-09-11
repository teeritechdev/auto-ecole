package com.autoecole.repository;

import com.autoecole.entity.Candidat;
import com.autoecole.entity.enums.EtapeParcours;
import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.entity.enums.StatutInscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatRepository extends JpaRepository<Candidat, Long> {

    Optional<Candidat> findByNumeroDossier(String numeroDossier);

    Optional<Candidat> findTopByOrderByIdDesc();

    boolean existsByNumeroDossier(String numeroDossier);

    @Query("SELECT c FROM Candidat c JOIN c.inscriptions i WHERE i.active = true AND " +
           "(:recherche IS NULL OR LOWER(c.nom) LIKE LOWER(CONCAT('%', CAST(:recherche AS string), '%')) " +
           "OR LOWER(c.prenom) LIKE LOWER(CONCAT('%', CAST(:recherche AS string), '%')) " +
           "OR LOWER(c.numeroDossier) LIKE LOWER(CONCAT('%', CAST(:recherche AS string), '%')) " +
           "OR LOWER(c.telephone) LIKE LOWER(CONCAT('%', CAST(:recherche AS string), '%'))) " +
           "AND (:statut IS NULL OR i.statutDossier = :statut) " +
           "AND (:categorieId IS NULL OR i.categoriePermis.id = :categorieId) " +
           "AND (:siteIds IS NULL OR i.site.id IN :siteIds) " +
           "AND (:statutInscription IS NULL OR i.statutInscription = :statutInscription) " +
           "AND (:etapesAutorisees IS NULL OR i.etapeParcours IN :etapesAutorisees)")
    Page<Candidat> rechercherCandidats(
            @Param("recherche") String recherche,
            @Param("statut") StatutDossier statut,
            @Param("categorieId") Long categorieId,
            @Param("siteIds") Collection<Long> siteIds,
            @Param("statutInscription") StatutInscription statutInscription,
            @Param("etapesAutorisees") Collection<EtapeParcours> etapesAutorisees,
            Pageable pageable
    );

    @Query("SELECT c FROM Candidat c JOIN c.inscriptions i WHERE i.active = true AND " +
           "(:statut IS NULL OR i.statutDossier = :statut) " +
           "AND (:categorieId IS NULL OR i.categoriePermis.id = :categorieId)")
    List<Candidat> filtrerPourRapport(
            @Param("statut") StatutDossier statut,
            @Param("categorieId") Long categorieId
    );
}
