package com.autoecole.service;

import com.autoecole.dto.ParametrageDTOs.CategoriePermisDTO;
import com.autoecole.dto.ParametrageDTOs.ForfaitDTO;
import com.autoecole.entity.CategoriePermis;
import com.autoecole.entity.Forfait;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CategoriePermisRepository;
import com.autoecole.repository.ForfaitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParametrageService {

    private final CategoriePermisRepository categorieRepository;
    private final ForfaitRepository forfaitRepository;
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
        c.setDescription(dto.getDescription());
        c.setActif(dto.isActif());

        CategoriePermis updated = categorieRepository.save(c);
        auditService.logAction("MODIFICATION_CATEGORIE", "CategoriePermis", updated.getCode(), "Mise à jour catégorie " + updated.getLibelle(), null);
        return mapToCategorieDTO(updated);
    }

    // --- Forfaits ---
    public List<ForfaitDTO> getAllForfaits(boolean onlyActive) {
        List<Forfait> list = onlyActive ? forfaitRepository.findByActifTrue() : forfaitRepository.findAll();
        return list.stream().map(this::mapToForfaitDTO).collect(Collectors.toList());
    }

    public ForfaitDTO getForfaitById(Long id) {
        Forfait f = forfaitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Forfait non trouvé avec l'id: " + id));
        return mapToForfaitDTO(f);
    }

    @Transactional
    public ForfaitDTO createForfait(ForfaitDTO dto) {
        if (forfaitRepository.existsByNom(dto.getNom())) {
            throw new BadRequestException("Un forfait avec le nom " + dto.getNom() + " existe déjà");
        }

        Forfait f = Forfait.builder()
                .nom(dto.getNom().trim())
                .montant(dto.getMontant())
                .description(dto.getDescription())
                .actif(true)
                .build();

        Forfait saved = forfaitRepository.save(f);
        auditService.logAction("CREATION_FORFAIT", "Forfait", saved.getNom(), "Création forfait " + saved.getNom() + " - Montant: " + saved.getMontant(), null);
        return mapToForfaitDTO(saved);
    }

    @Transactional
    public ForfaitDTO updateForfait(Long id, ForfaitDTO dto) {
        Forfait f = forfaitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Forfait non trouvé avec l'id: " + id));

        f.setNom(dto.getNom().trim());
        f.setMontant(dto.getMontant());
        f.setDescription(dto.getDescription());
        f.setActif(dto.isActif());

        Forfait updated = forfaitRepository.save(f);
        auditService.logAction("MODIFICATION_FORFAIT", "Forfait", updated.getNom(), "Mise à jour forfait " + updated.getNom() + " - Montant: " + updated.getMontant(), null);
        return mapToForfaitDTO(updated);
    }

    private CategoriePermisDTO mapToCategorieDTO(CategoriePermis c) {
        return CategoriePermisDTO.builder()
                .id(c.getId())
                .code(c.getCode())
                .libelle(c.getLibelle())
                .description(c.getDescription())
                .actif(c.isActif())
                .build();
    }

    private ForfaitDTO mapToForfaitDTO(Forfait f) {
        return ForfaitDTO.builder()
                .id(f.getId())
                .nom(f.getNom())
                .montant(f.getMontant())
                .description(f.getDescription())
                .actif(f.isActif())
                .build();
    }
}
