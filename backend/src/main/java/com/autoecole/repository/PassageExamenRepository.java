package com.autoecole.repository;

import com.autoecole.entity.PassageExamen;
import com.autoecole.entity.enums.ResultatExamen;
import com.autoecole.entity.enums.TypeEpreuve;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PassageExamenRepository extends JpaRepository<PassageExamen, Long> {

    List<PassageExamen> findByCandidatIdOrderByTypeEpreuveAscNumeroPassageAsc(Long candidatId);

    List<PassageExamen> findByCandidatIdAndTypeEpreuveOrderByNumeroPassageAsc(Long candidatId, TypeEpreuve typeEpreuve);

    Optional<PassageExamen> findByCandidatIdAndTypeEpreuveAndNumeroPassage(Long candidatId, TypeEpreuve typeEpreuve, Integer numeroPassage);

    long countByCandidatIdAndTypeEpreuve(Long candidatId, TypeEpreuve typeEpreuve);

    @Query("SELECT pe FROM PassageExamen pe WHERE " +
           "(:candidatId IS NULL OR pe.candidat.id = :candidatId) " +
           "AND (:typeEpreuve IS NULL OR pe.typeEpreuve = :typeEpreuve) " +
           "AND (:resultat IS NULL OR pe.resultat = :resultat) " +
           "AND (:dateRef IS NULL OR pe.datePassage = :dateRef)")
    Page<PassageExamen> filtrerPassages(
            @Param("candidatId") Long candidatId,
            @Param("typeEpreuve") TypeEpreuve typeEpreuve,
            @Param("resultat") ResultatExamen resultat,
            @Param("dateRef") LocalDate dateRef,
            Pageable pageable
    );

    List<PassageExamen> findTop10ByDatePassageGreaterThanEqualOrderByDatePassageAsc(LocalDate today);

    List<PassageExamen> findByValideParAdminFalseAndResultatOrderByDatePassageAsc(ResultatExamen resultat);

    long countByResultat(ResultatExamen resultat);
}
