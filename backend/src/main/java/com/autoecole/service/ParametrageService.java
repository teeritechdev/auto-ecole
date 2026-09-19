package com.autoecole.service;

import com.autoecole.dto.ParametrageDTOs.CategoriePermisDTO;
import com.autoecole.dto.ParametrageDTOs.SiteDTO;
import com.autoecole.dto.ParametrageDTOs.SiteStatDTO;
import com.autoecole.entity.CategoriePermis;
import com.autoecole.entity.Site;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CategoriePermisRepository;
import com.autoecole.repository.InscriptionRepository;
import com.autoecole.repository.PaiementRepository;
import com.autoecole.repository.SiteRepository;
import com.autoecole.repository.TransactionCaisseRepository;
import com.autoecole.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParametrageService {

    private final CategoriePermisRepository categorieRepository;
    private final SiteRepository siteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PaiementRepository paiementRepository;
    private final InscriptionRepository inscriptionRepository;
    private final TransactionCaisseRepository transactionCaisseRepository;
    private final AuditService auditService;

    private static final Set<RoleEnum> ROLES_PERSONNEL_TERRAIN = Set.of(RoleEnum.MONITEUR, RoleEnum.SECRETAIRE, RoleEnum.CAISSIERE);

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
                .fraisExamen(dto.getFraisExamen())
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
        c.setFraisExamen(dto.getFraisExamen());
        c.setDescription(dto.getDescription());
        c.setActif(dto.isActif());

        CategoriePermis updated = categorieRepository.save(c);
        auditService.logAction("MODIFICATION_CATEGORIE", "CategoriePermis", updated.getCode(), "Mise à jour catégorie " + updated.getLibelle(), null);
        return mapToCategorieDTO(updated);
    }

    @Transactional
    public void deleteCategorie(Long id) {
        CategoriePermis c = categorieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie de permis non trouvée avec l'id: " + id));

        if (inscriptionRepository.existsByCategoriePermisId(id)) {
            throw new BadRequestException("Impossible de supprimer cette catégorie car des candidats y sont déjà inscrits. Vous pouvez la désactiver à la place.");
        }

        categorieRepository.delete(c);
        auditService.logAction("SUPPRESSION_CATEGORIE", "CategoriePermis", c.getCode(), "Suppression de la catégorie " + c.getLibelle(), null);
    }

    private CategoriePermisDTO mapToCategorieDTO(CategoriePermis c) {
        return CategoriePermisDTO.builder()
                .id(c.getId())
                .code(c.getCode())
                .libelle(c.getLibelle())
                .montant(c.getMontant())
                .fraisExamen(c.getFraisExamen())
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

    @Transactional
    public void deleteSite(Long id) {
        Site s = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site de formation non trouvé avec l'id: " + id));

        if (inscriptionRepository.existsBySiteId(id)) {
            throw new BadRequestException("Impossible de supprimer ce site car des inscriptions y sont rattachées. Vous pouvez le désactiver à la place.");
        }

        siteRepository.delete(s);
        auditService.logAction("SUPPRESSION_SITE", "Site", s.getNom(), "Suppression du site de formation " + s.getNom(), null);
    }

    public List<SiteStatDTO> getStatistiquesSites() {
        Map<Long, Long> personnelParSite = new HashMap<>();
        for (Object[] row : utilisateurRepository.compterPersonnelActifParSite(ROLES_PERSONNEL_TERRAIN)) {
            personnelParSite.put((Long) row[0], (Long) row[1]);
        }
        Map<Long, Long> inscriptionsParSite = new HashMap<>();
        for (Object[] row : inscriptionRepository.compterInscriptionsParSite()) {
            inscriptionsParSite.put((Long) row[0], (Long) row[1]);
        }
        Map<Long, Long> nombrePaiementsParSite = new HashMap<>();
        Map<Long, BigDecimal> montantPaiementsParSite = new HashMap<>();
        for (Object[] row : paiementRepository.statistiquesPaiementsParSite()) {
            Long siteId = (Long) row[0];
            nombrePaiementsParSite.put(siteId, (Long) row[1]);
            montantPaiementsParSite.put(siteId, (BigDecimal) row[2]);
        }
        Map<Long, BigDecimal> soldeCaisseParSite = new HashMap<>();
        for (Object[] row : transactionCaisseRepository.statistiquesCaisseParSite()) {
            Long siteId = (Long) row[0];
            BigDecimal entrees = (BigDecimal) row[1];
            BigDecimal sorties = (BigDecimal) row[2];
            soldeCaisseParSite.put(siteId, entrees.subtract(sorties));
        }

        return siteRepository.statistiquesParSite().stream()
                .map(row -> {
                    Long siteId = (Long) row[0];
                    return SiteStatDTO.builder()
                            .siteId(siteId)
                            .siteNom((String) row[1])
                            .nombreCandidatsActifs((Long) row[2])
                            .montantEncaisse((BigDecimal) row[3])
                            .montantRestantDu((BigDecimal) row[4])
                            .nombrePersonnel(personnelParSite.getOrDefault(siteId, 0L))
                            .nombreInscriptions(inscriptionsParSite.getOrDefault(siteId, 0L))
                            .nombrePaiements(nombrePaiementsParSite.getOrDefault(siteId, 0L))
                            .montantPaiements(montantPaiementsParSite.getOrDefault(siteId, BigDecimal.ZERO))
                            .soldeCaisse(soldeCaisseParSite.getOrDefault(siteId, BigDecimal.ZERO))
                            .build();
                })
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
