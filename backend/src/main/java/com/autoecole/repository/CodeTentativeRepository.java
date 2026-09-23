package com.autoecole.repository;

import com.autoecole.entity.CodeTentative;
import com.autoecole.entity.enums.StatutTentativeCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodeTentativeRepository extends JpaRepository<CodeTentative, Long> {
    List<CodeTentative> findByCandidatIdAndSerieIdOrderByNumeroTentativeAsc(Long candidatId, Long serieId);
    List<CodeTentative> findByCandidatIdOrderByDateDebutDesc(Long candidatId);
    Optional<CodeTentative> findByCandidatIdAndSerieIdAndStatut(Long candidatId, Long serieId, StatutTentativeCode statut);
    boolean existsByCandidatIdAndSerieIdAndStatut(Long candidatId, Long serieId, StatutTentativeCode statut);
    List<CodeTentative> findBySerieId(Long serieId);
    void deleteBySerieId(Long serieId);
    void deleteByCandidatId(Long candidatId);
}
