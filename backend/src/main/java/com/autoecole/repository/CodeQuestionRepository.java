package com.autoecole.repository;

import com.autoecole.entity.CodeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CodeQuestionRepository extends JpaRepository<CodeQuestion, Long> {
    List<CodeQuestion> findByActifTrueOrderByOrdreAsc();
    List<CodeQuestion> findAllByOrderByOrdreAsc();
    long countByActifTrue();
    boolean existsByOrdre(int ordre);
    boolean existsByOrdreAndIdNot(int ordre, Long id);
    Optional<CodeQuestion> findByOrdre(int ordre);
    Optional<CodeQuestion> findTopByOrderByOrdreDesc();
}
