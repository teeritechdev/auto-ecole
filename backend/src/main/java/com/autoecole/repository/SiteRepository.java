package com.autoecole.repository;

import com.autoecole.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {
    Optional<Site> findByNom(String nom);
    List<Site> findByActifTrueOrderByNomAsc();
    List<Site> findAllByOrderByNomAsc();
    boolean existsByNom(String nom);

    /**
     * Statistiques agrégées par site : chaque ligne = [siteId, siteNom, nombreCandidatsActifs,
     * montantEncaisse, montantRestantDu]. Les inscriptions actives sans site (données historiques)
     * ne sont pas comptabilisées ici.
     */
    @Query("SELECT s.id, s.nom, COUNT(i.id), COALESCE(SUM(i.totalVerse), 0), COALESCE(SUM(i.soldeRestant), 0) " +
           "FROM Site s LEFT JOIN Inscription i ON i.site = s AND i.active = true " +
           "GROUP BY s.id, s.nom ORDER BY s.nom")
    List<Object[]> statistiquesParSite();
}
