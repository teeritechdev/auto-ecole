package com.autoecole.service;

import com.autoecole.dto.CaisseDTOs.CreateNatureOperationRequest;
import com.autoecole.dto.CaisseDTOs.NatureOperationDTO;
import com.autoecole.dto.CaisseDTOs.UpdateNatureOperationRequest;
import com.autoecole.entity.NatureOperation;
import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.NatureOperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Catalogue des Natures d'opération de la Caisse & Trésorerie (cf. javadoc de
 * {@link NatureOperation}) : géré exclusivement par l'ADMIN (contrôle d'accès porté par
 * NatureOperationController), consulté par ADMIN et CAISSIERE pour enregistrer une opération.
 */
@Service
@RequiredArgsConstructor
public class NatureOperationService {

    private final NatureOperationRepository natureOperationRepository;
    private final com.autoecole.repository.TransactionCaisseRepository transactionCaisseRepository;

    public List<NatureOperationDTO> getActives() {
        return natureOperationRepository.findByActifTrueOrderByLibelleAsc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<NatureOperationDTO> getToutes() {
        return natureOperationRepository.findAllByOrderByLibelleAsc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<NatureOperationDTO> getFiltrees(TypeMouvementCaisse sens, Boolean actif, String recherche) {
        return getToutes().stream()
                .filter(n -> sens == null || n.getSens() == sens)
                .filter(n -> actif == null || n.isActif() == actif)
                .filter(n -> {
                    if (recherche == null || recherche.isBlank()) return true;
                    String q = recherche.toLowerCase().trim();
                    return (n.getCode() != null && n.getCode().toLowerCase().contains(q))
                            || (n.getLibelle() != null && n.getLibelle().toLowerCase().contains(q))
                            || (n.getPlanComptable() != null && n.getPlanComptable().toLowerCase().contains(q));
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public NatureOperationDTO creer(CreateNatureOperationRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (natureOperationRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("Une nature d'opération avec le code \"" + code + "\" existe déjà");
        }
        NatureOperation nature = NatureOperation.builder()
                .code(code)
                .libelle(request.getLibelle().trim())
                .sens(request.getSens())
                .planComptable(request.getPlanComptable())
                .description(request.getDescription())
                .actif(true)
                .build();
        return mapToDTO(natureOperationRepository.save(nature));
    }

    @Transactional
    public NatureOperationDTO modifier(Long id, UpdateNatureOperationRequest request) {
        NatureOperation nature = natureOperationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nature d'opération introuvable"));
        nature.setLibelle(request.getLibelle().trim());
        nature.setPlanComptable(request.getPlanComptable());
        nature.setDescription(request.getDescription());
        nature.setActif(request.isActif());
        return mapToDTO(natureOperationRepository.save(nature));
    }

    @Transactional
    public void supprimer(Long id) {
        NatureOperation nature = natureOperationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nature d'opération introuvable"));
        if (transactionCaisseRepository.existsByNatureOperationId(id)) {
            throw new BadRequestException("Impossible de supprimer cette nature d'opération car des opérations de caisse y sont rattachées. Vous pouvez la désactiver à la place.");
        }
        natureOperationRepository.delete(nature);
    }

    private NatureOperationDTO mapToDTO(NatureOperation n) {
        return NatureOperationDTO.builder()
                .id(n.getId())
                .code(n.getCode())
                .libelle(n.getLibelle())
                .sens(n.getSens())
                .planComptable(n.getPlanComptable())
                .description(n.getDescription())
                .actif(n.isActif())
                .build();
    }
}
