package com.autoecole.repository;

import com.autoecole.entity.CategoriePermis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriePermisRepository extends JpaRepository<CategoriePermis, Long> {
    Optional<CategoriePermis> findByCode(String code);
    List<CategoriePermis> findByActifTrue();
    boolean existsByCode(String code);
}
