package com.autoecole.repository;

import com.autoecole.entity.NatureOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NatureOperationRepository extends JpaRepository<NatureOperation, Long> {

    List<NatureOperation> findByActifTrueOrderByLibelleAsc();

    List<NatureOperation> findAllByOrderByLibelleAsc();

    boolean existsByCodeIgnoreCase(String code);
}
