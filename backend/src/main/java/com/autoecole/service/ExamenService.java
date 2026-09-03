package com.autoecole.service;

import com.autoecole.dto.ExamenDTOs.*;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.PassageExamen;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.ResultatExamen;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CandidatRepository;
import com.autoecole.repository.PassageExamenRepository;
import com.autoecole.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamenService {

    private final PassageExamenRepository passageRepository;
    private final CandidatRepository candidatRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AuditService auditService;

    public Page<PassageExamenDTO> filtrerPassages(Long candidatId, TypeEpreuve typeEpreuve, ResultatExamen resultat, LocalDate dateRef, Pageable pageable) {
        return passageRepository.filtrerPassages(candidatId, typeEpreuve, resultat, dateRef, pageable)
                .map(this::mapToDTO);
    }

    public List<PassageExamenDTO> getPassagesByCandidat(Long candidatId) {
        return passageRepository.findByCandidatIdOrderByTypeEpreuveAscNumeroPassageAsc(candidatId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public BilanExamensCandidatDTO getBilanExamensCandidat(Long candidatId) {
        Candidat c = candidatRepository.findById(candidatId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat introuvable"));

        List<PassageExamenDTO> passagesCode = passageRepository
                .findByCandidatIdAndTypeEpreuveOrderByNumeroPassageAsc(candidatId, TypeEpreuve.CODE)
                .stream().map(this::mapToDTO).collect(Collectors.toList());

        List<PassageExamenDTO> passagesCreneau = passageRepository
                .findByCandidatIdAndTypeEpreuveOrderByNumeroPassageAsc(candidatId, TypeEpreuve.CRENEAU)
                .stream().map(this::mapToDTO).collect(Collectors.toList());

        List<PassageExamenDTO> passagesCirculation = passageRepository
                .findByCandidatIdAndTypeEpreuveOrderByNumeroPassageAsc(candidatId, TypeEpreuve.CIRCULATION)
                .stream().map(this::mapToDTO).collect(Collectors.toList());

        boolean codeReussi = passagesCode.stream().anyMatch(p -> p.getResultat() == ResultatExamen.REUSSI);
        boolean creneauReussi = passagesCreneau.stream().anyMatch(p -> p.getResultat() == ResultatExamen.REUSSI);
        boolean circulationReussi = passagesCirculation.stream().anyMatch(p -> p.getResultat() == ResultatExamen.REUSSI);

        return BilanExamensCandidatDTO.builder()
                .candidatId(c.getId())
                .candidatNumeroDossier(c.getNumeroDossier())
                .candidatNomComplet(c.getNom() + " " + c.getPrenom())
                .passagesCode(passagesCode)
                .passagesCreneau(passagesCreneau)
                .passagesCirculation(passagesCirculation)
                .codeReussi(codeReussi)
                .creneauReussi(creneauReussi)
                .circulationReussi(circulationReussi)
                .build();
    }

    @Transactional
    public PassageExamenDTO programmerOuEnregistrerPassage(CreatePassageRequest request) {
        Candidat candidat = candidatRepository.findById(request.getCandidatId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidat introuvable"));

        long count = passageRepository.countByCandidatIdAndTypeEpreuve(candidat.getId(), request.getTypeEpreuve());
        int numeroPassage = request.getNumeroPassage() != null ? request.getNumeroPassage() : (int) (count + 1);

        if (numeroPassage > 5) {
            throw new BadRequestException("Nombre maximal de 5 passages atteint pour l'épreuve " + request.getTypeEpreuve().name());
        }

        if (passageRepository.findByCandidatIdAndTypeEpreuveAndNumeroPassage(candidat.getId(), request.getTypeEpreuve(), numeroPassage).isPresent()) {
            throw new BadRequestException("Le passage n°" + numeroPassage + " pour l'épreuve " + request.getTypeEpreuve().name() + " existe déjà pour ce candidat");
        }

        Utilisateur moniteur = null;
        if (request.getMoniteurId() != null) {
            moniteur = utilisateurRepository.findById(request.getMoniteurId()).orElse(null);
        } else {
            moniteur = auditService.getCurrentUser();
        }

        PassageExamen passage = PassageExamen.builder()
                .candidat(candidat)
                .typeEpreuve(request.getTypeEpreuve())
                .numeroPassage(numeroPassage)
                .datePassage(request.getDatePassage())
                .resultat(request.getResultat() != null ? request.getResultat() : ResultatExamen.PROGRAMME)
                .observations(request.getObservations())
                .moniteur(moniteur)
                .dateEnregistrement(LocalDateTime.now())
                .build();

        PassageExamen saved = passageRepository.save(passage);
        auditService.logAction("ENREGISTREMENT_EXAMEN", "PassageExamen", candidat.getNumeroDossier(),
                "Passage " + numeroPassage + " (" + request.getTypeEpreuve() + ") - Résultat: " + saved.getResultat(), null);

        return mapToDTO(saved);
    }

    @Transactional
    public PassageExamenDTO updateResultatPassage(Long passageId, UpdatePassageRequest request) {
        PassageExamen passage = passageRepository.findById(passageId)
                .orElseThrow(() -> new ResourceNotFoundException("Passage d'examen introuvable"));

        passage.setDatePassage(request.getDatePassage());
        passage.setResultat(request.getResultat());
        passage.setObservations(request.getObservations());

        PassageExamen updated = passageRepository.save(passage);
        auditService.logAction("MAJ_RESULTAT_EXAMEN", "PassageExamen", passage.getCandidat().getNumeroDossier(),
                "Mise à jour passage " + passage.getNumeroPassage() + " (" + passage.getTypeEpreuve() + ") -> " + request.getResultat(), null);

        return mapToDTO(updated);
    }

    @Transactional
    public void deletePassage(Long passageId) {
        PassageExamen passage = passageRepository.findById(passageId)
                .orElseThrow(() -> new ResourceNotFoundException("Passage d'examen introuvable"));

        String numDossier = passage.getCandidat().getNumeroDossier();
        passageRepository.delete(passage);
        auditService.logAction("SUPPRESSION_PASSAGE_EXAMEN", "PassageExamen", numDossier,
                "Suppression passage " + passage.getNumeroPassage() + " (" + passage.getTypeEpreuve() + ")", null);
    }

    public List<PassageExamenDTO> getProchainsExamens() {
        return passageRepository.findTop10ByDatePassageGreaterThanEqualOrderByDatePassageAsc(LocalDate.now()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PassageExamenDTO mapToDTO(PassageExamen pe) {
        return PassageExamenDTO.builder()
                .id(pe.getId())
                .candidatId(pe.getCandidat() != null ? pe.getCandidat().getId() : null)
                .candidatNumeroDossier(pe.getCandidat() != null ? pe.getCandidat().getNumeroDossier() : "")
                .candidatNomComplet(pe.getCandidat() != null ? pe.getCandidat().getNom() + " " + pe.getCandidat().getPrenom() : "")
                .typeEpreuve(pe.getTypeEpreuve())
                .numeroPassage(pe.getNumeroPassage())
                .datePassage(pe.getDatePassage())
                .resultat(pe.getResultat())
                .observations(pe.getObservations())
                .moniteurId(pe.getMoniteur() != null ? pe.getMoniteur().getId() : null)
                .moniteurNomComplet(pe.getMoniteur() != null ? pe.getMoniteur().getNom() + " " + pe.getMoniteur().getPrenom() : "")
                .dateEnregistrement(pe.getDateEnregistrement())
                .build();
    }
}
