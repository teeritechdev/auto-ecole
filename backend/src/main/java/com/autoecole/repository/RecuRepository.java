package com.autoecole.repository;

import com.autoecole.entity.Recu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecuRepository extends JpaRepository<Recu, Long> {
    Optional<Recu> findByNumeroRecu(String numeroRecu);
    Optional<Recu> findByPaiementId(Long paiementId);
    Optional<Recu> findTopByOrderByIdDesc();
    boolean existsByNumeroRecu(String numeroRecu);
}
