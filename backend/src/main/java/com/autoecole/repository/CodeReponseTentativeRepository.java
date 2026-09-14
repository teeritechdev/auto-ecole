package com.autoecole.repository;

import com.autoecole.entity.CodeReponseTentative;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodeReponseTentativeRepository extends JpaRepository<CodeReponseTentative, Long> {
    List<CodeReponseTentative> findByTentativeIdOrderByOrdreDansCycleAsc(Long tentativeId);
    Optional<CodeReponseTentative> findByTentativeIdAndOrdreDansCycle(Long tentativeId, int ordreDansCycle);
    void deleteByTentativeIdAndOrdreDansCycle(Long tentativeId, int ordreDansCycle);
}
