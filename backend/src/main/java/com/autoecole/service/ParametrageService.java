package com.autoecole.service;

import com.autoecole.dto.ParametrageDTOs.CategoriePermisDTO;
import com.autoecole.dto.ParametrageDTOs.SiteDTO;
import com.autoecole.dto.ParametrageDTOs.SiteStatDTO;
import com.autoecole.entity.CategoriePermis;
import com.autoecole.entity.Site;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CategoriePermisRepository;
import com.autoecole.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParametrageService {

    private final CategoriePermisRepository categorieRepository;
    private final SiteRepository siteRepository;
    private final AuditService auditService;

    // --- Catégories de permis ---
    public List<CategoriePermisDTO> getAllCategories(boolean onlyActive) {
        List<CategoriePermis> list = onlyActive ? categorieRepository.findByActifTrue() : categorieRepository.findAll();
        return list.stream().map(this::mapToCategorieDTO).collect(Collectors.toList());
    }

    public CategoriePermisDTO getCategorieById(Long id) {
        CategoriePermis c = categorieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie de permis non trouvée avec l'id: " + id));
        return mapToCategorieDTO(c);
    }

    @Transactional
    public CategoriePermisDTO createCategorie(CategoriePermisDTO dto) {
        if (categorieRepository.existsByCode(dto.getCode())) {
            throw new BadRequestException("Une catégorie avec le code " + dto.getCode() + " existe déjà");
        }

        CategoriePermis c = CategoriePermis.builder()
                .code(dto.getCode().trim().toUpperCase())
                .libelle(dto.getLibelle().trim())
                .montant(dto.getMontant())
                .description(dto.getDescription())
                .actif(true)
                .build();

        CategoriePermis saved = categorieRepository.save(c);
        auditService.logAction("CREATION_CATEGORIE", "CategoriePermis", saved.getCode(), "Création catégorie " + saved.getLibelle(), null);
        return mapToCategorieDTO(saved);
    }

    @Transactional
    public CategoriePermisDTO updateCategorie(Long id, CategoriePermisDTO dto) {
        CategoriePermis c = categorieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie de permis non trouvée avec l'id: " + id));

        c.setLibelle(dto.getLibelle().trim());
        c.setMontant(dto.getMontant());
        c.setDescription(dto.getDescription());
        c.setActif(dto.isActif());

        CategoriePermis updated = categorieRepository.save(c);
        auditService.logAction("MODIFICATION_CATEGORIE", "CategoriePermis", updated.getCode(), "Mise à jour catégorie " + updated.getLibelle(), null);
        return mapToCategorieDTO(updated);
    }

    private CategoriePermisDTO mapToCategorieDTO(CategoriePermis c) {
        return CategoriePermisDTO.builder()
                .id(c.getId())
                .code(c.getCode())
                .libelle(c.getLibelle())
                .montant(c.getMontant())
                .description(c.getDescription())
                .actif(c.isActif())
                .build();
    }

    // --- Sites de formation ---
    public List<SiteDTO> getAllSites(boolean onlyActive) {
        List<Site> list = onlyActive ? siteRepository.findByActifTrueOrderByNomAsc() : siteRepository.findAllByOrderByNomAsc();
        return list.stream().map(this::mapToSiteDTO).collect(Collectors.toList());
    }

    public SiteDTO getSiteById(Long id) {
        Site s = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site de formation non trouvé avec l'id: " + id));
        return mapToSiteDTO(s);
    }

    @Transactional
    public SiteDTO createSite(SiteDTO dto) {
        if (siteRepository.existsByNom(dto.getNom())) {
            throw new BadRequestException("Un site avec le nom " + dto.getNom() + " existe déjà");
        }

        Site s = Site.builder()
                .nom(dto.getNom().trim())
                .adresse(dto.getAdresse())
                .actif(true)
                .build();

        Site saved = siteRepository.save(s);
        auditService.logAction("CREATION_SITE", "Site", saved.getNom(), "Création site de formation " + saved.getNom(), null);
        return mapToSiteDTO(saved);
    }

    @Transactional
    public SiteDTO updateSite(Long id, SiteDTO dto) {
        Site s = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site de formation non trouvé avec l'id: " + id));

        s.setNom(dto.getNom().trim());
        s.setAdresse(dto.getAdresse());
        s.setActif(dto.isActif());

        Site updated = siteRepository.save(s);
        auditService.logAction("MODIFICATION_SITE", "Site", updated.getNom(), "Mise à jour site de formation " + updated.getNom(), null);
        return mapToSiteDTO(updated);
    }

    public List<SiteStatDTO> getStatistiquesSites() {
        return siteRepository.statistiquesParSite().stream()
                .map(row -> SiteStatDTO.builder()
                        .siteId((Long) row[0])
                        .siteNom((String) row[1])
                        .nombreCandidatsActifs((Long) row[2])
                        .montantEncaisse((BigDecimal) row[3])
                        .montantRestantDu((BigDecimal) row[4])
                        .build())
                .collect(Collectors.toList());
    }

    private SiteDTO mapToSiteDTO(Site s) {
        return SiteDTO.builder()
                .id(s.getId())
                .nom(s.getNom())
                .adresse(s.getAdresse())
                .actif(s.isActif())
                .build();
    }
}
