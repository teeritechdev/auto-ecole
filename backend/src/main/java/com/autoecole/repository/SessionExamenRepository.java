package com.autoecole.repository;

import com.autoecole.entity.SessionExamen;
import com.autoecole.entity.enums.TypeEpreuve;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface SessionExamenRepository extends JpaRepository<SessionExamen, Long> {

    @Query("SELECT s FROM SessionExamen s WHERE " +
           "(:siteId IS NULL OR s.site.id = :siteId) " +
           "AND (:typesAutorises IS NULL OR s.typeEpreuve IN :typesAutorises) " +
           "ORDER BY s.datePassage DESC, s.id DESC")
    List<SessionExamen> listerSessions(@Param("siteId") Long siteId, @Param("typesAutorises") Collection<TypeEpreuve> typesAutorises);
}
