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
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PassageExamenRepository extends JpaRepository<PassageExamen, Long> {

    @Query("SELECT pe FROM PassageExamen pe WHERE pe.inscription.candidat.id = :candidatId " +
           "ORDER BY pe.typeEpreuve ASC, pe.numeroPassage ASC")
    List<PassageExamen> findByCandidatIdOrderByTypeEpreuveAscNumeroPassageAsc(@Param("candidatId") Long candidatId);

    @Query("SELECT pe FROM PassageExamen pe WHERE pe.inscription.candidat.id = :candidatId AND pe.typeEpreuve = :typeEpreuve " +
           "ORDER BY pe.numeroPassage ASC")
    List<PassageExamen> findByCandidatIdAndTypeEpreuveOrderByNumeroPassageAsc(@Param("candidatId") Long candidatId, @Param("typeEpreuve") TypeEpreuve typeEpreuve);

    Optional<PassageExamen> findByInscriptionIdAndTypeEpreuveAndNumeroPassage(Long inscriptionId, TypeEpreuve typeEpreuve, Integer numeroPassage);

    List<PassageExamen> findBySessionIdOrderByDateEnregistrementAsc(Long sessionId);

    Optional<PassageExamen> findBySessionIdAndId(Long sessionId, Long id);

    long countByInscriptionIdAndTypeEpreuve(Long inscriptionId, TypeEpreuve typeEpreuve);

    long countByInscriptionIdAndTypeEpreuveAndResultat(Long inscriptionId, TypeEpreuve typeEpreuve, ResultatExamen resultat);

    boolean existsByInscriptionIdAndTypeEpreuveAndResultat(Long inscriptionId, TypeEpreuve typeEpreuve, ResultatExamen resultat);

    @Query("SELECT pe FROM PassageExamen pe WHERE " +
           "(:candidatId IS NULL OR pe.inscription.candidat.id = :candidatId) " +
           "AND (:typeEpreuve IS NULL OR pe.typeEpreuve = :typeEpreuve) " +
           "AND (:resultat IS NULL OR pe.resultat = :resultat) " +
           "AND (:dateRef IS NULL OR pe.datePassage = :dateRef) " +
           "AND (:siteId IS NULL OR pe.inscription.site.id = :siteId) " +
           "AND (:typesAutorises IS NULL OR pe.typeEpreuve IN :typesAutorises) " +
           "AND (:masquerReussi = false OR pe.resultat <> com.autoecole.entity.enums.ResultatExamen.REUSSI)")
    Page<PassageExamen> filtrerPassages(
            @Param("candidatId") Long candidatId,
            @Param("typeEpreuve") TypeEpreuve typeEpreuve,
            @Param("resultat") ResultatExamen resultat,
            @Param("dateRef") LocalDate dateRef,
            @Param("siteId") Long siteId,
            @Param("typesAutorises") Collection<TypeEpreuve> typesAutorises,
            @Param("masquerReussi") boolean masquerReussi,
            Pageable pageable
    );

    List<PassageExamen> findTop10ByDatePassageGreaterThanEqualOrderByDatePassageAsc(LocalDate today);

    @Query("SELECT COUNT(pe) FROM PassageExamen pe WHERE pe.resultat = :resultat " +
           "AND (:siteId IS NULL OR pe.inscription.site.id = :siteId)")
    long countByResultatAndSite(@Param("resultat") ResultatExamen resultat, @Param("siteId") Long siteId);
}
