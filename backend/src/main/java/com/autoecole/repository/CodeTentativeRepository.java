package com.autoecole.repository;

import com.autoecole.entity.CodeTentative;
import com.autoecole.entity.enums.StatutTentativeCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodeTentativeRepository extends JpaRepository<CodeTentative, Long> {
    List<CodeTentative> findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(Long candidatId, int numeroCycle);
    List<CodeTentative> findByCandidatIdOrderByDateDebutDesc(Long candidatId);
    Optional<CodeTentative> findByCandidatIdAndNumeroCycleAndStatut(Long candidatId, int numeroCycle, StatutTentativeCode statut);
    long countByCandidatIdAndNumeroCycle(Long candidatId, int numeroCycle);
    boolean existsByCandidatIdAndNumeroCycleAndStatut(Long candidatId, int numeroCycle, StatutTentativeCode statut);
}
