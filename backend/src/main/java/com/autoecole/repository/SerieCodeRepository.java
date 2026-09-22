package com.autoecole.repository;

import com.autoecole.entity.SerieCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SerieCodeRepository extends JpaRepository<SerieCode, Long> {
    List<SerieCode> findAllByOrderByOrdreAsc();
    List<SerieCode> findByActifTrueOrderByOrdreAsc();
    boolean existsByOrdre(int ordre);
    boolean existsByOrdreAndIdNot(int ordre, Long id);
    Optional<SerieCode> findTopByOrderByOrdreDesc();
}
