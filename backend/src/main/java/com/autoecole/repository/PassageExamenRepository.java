package com.autoecole.repository;

import com.autoecole.entity.Candidat;
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
           "AND (:siteIds IS NULL OR pe.inscription.site.id IN :siteIds) " +
           "AND (:typesAutorises IS NULL OR pe.typeEpreuve IN :typesAutorises) " +
           "AND (:masquerReussi = false OR pe.resultat <> com.autoecole.entity.enums.ResultatExamen.REUSSI)")
    Page<PassageExamen> filtrerPassages(
            @Param("candidatId") Long candidatId,
            @Param("typeEpreuve") TypeEpreuve typeEpreuve,
            @Param("resultat") ResultatExamen resultat,
            @Param("dateRef") LocalDate dateRef,
            @Param("siteIds") Collection<Long> siteIds,
            @Param("typesAutorises") Collection<TypeEpreuve> typesAutorises,
            @Param("masquerReussi") boolean masquerReussi,
            Pageable pageable
    );

    List<PassageExamen> findTop10ByDatePassageGreaterThanEqualOrderByDatePassageAsc(LocalDate today);

    @Query("SELECT COUNT(pe) FROM PassageExamen pe WHERE pe.resultat = :resultat " +
           "AND (:siteIds IS NULL OR pe.inscription.site.id IN :siteIds)")
    long countByResultatAndSite(@Param("resultat") ResultatExamen resultat, @Param("siteIds") Collection<Long> siteIds);

    /**
     * Candidats dont l'inscription active bénéficie de la prise en charge totale des frais
     * d'examen, et programmés (résultat encore en attente) à cette épreuve et cette date —
     * utilisé par la Caisse & Trésorerie interne pour pré-remplir un décaissement "Frais d'examen".
     */
    @Query("SELECT DISTINCT pe.inscription.candidat FROM PassageExamen pe WHERE " +
           "pe.inscription.active = true " +
           "AND pe.inscription.priseEnChargeExamens = true " +
           "AND pe.typeEpreuve = :typeEpreuve " +
           "AND pe.datePassage = :dateExamen " +
           "AND pe.resultat = com.autoecole.entity.enums.ResultatExamen.PROGRAMME")
    List<Candidat> findCandidatsPriseEnChargeParEpreuveEtDate(@Param("typeEpreuve") TypeEpreuve typeEpreuve, @Param("dateExamen") LocalDate dateExamen);
}
