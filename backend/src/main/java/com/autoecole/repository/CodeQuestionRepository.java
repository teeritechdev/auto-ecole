package com.autoecole.repository;

import com.autoecole.entity.CodeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CodeQuestionRepository extends JpaRepository<CodeQuestion, Long> {
    List<CodeQuestion> findBySerieIdAndActifTrueOrderByOrdreAsc(Long serieId);
    List<CodeQuestion> findBySerieIdOrderByOrdreAsc(Long serieId);
    long countBySerieId(Long serieId);
    boolean existsBySerieId(Long serieId);
    boolean existsBySerieIdAndOrdre(Long serieId, int ordre);
    boolean existsBySerieIdAndOrdreAndIdNot(Long serieId, int ordre, Long id);
    Optional<CodeQuestion> findTopBySerieIdOrderByOrdreDesc(Long serieId);
    void deleteBySerieId(Long serieId);
}
