package com.autoecole.repository;

import com.autoecole.entity.Forfait;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForfaitRepository extends JpaRepository<Forfait, Long> {
    Optional<Forfait> findByNom(String nom);
    List<Forfait> findByActifTrue();
    boolean existsByNom(String nom);
}
