package com.autoecole.service;

import com.autoecole.dto.CodeDTOs.CodeSerieDTO;
import com.autoecole.dto.CodeDTOs.CreateCodeSerieRequest;
import com.autoecole.dto.CodeDTOs.UpdateCodeSerieRequest;
import com.autoecole.entity.CodeQuestion;
import com.autoecole.entity.CodeTentative;
import com.autoecole.entity.SerieCode;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CodeQuestionRepository;
import com.autoecole.repository.CodeReponseTentativeRepository;
import com.autoecole.repository.CodeTentativeRepository;
import com.autoecole.repository.SerieCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/** Gestion des séries de questions du Code de la route (ADMIN/MONITEUR). */
@Service
@RequiredArgsConstructor
public class CodeSerieService {

    private final SerieCodeRepository serieRepository;
    private final CodeQuestionRepository questionRepository;
    private final CodeTentativeRepository tentativeRepository;
    private final CodeReponseTentativeRepository reponseTentativeRepository;

    public List<CodeSerieDTO> getAllSeries() {
        return serieRepository.findAllByOrderByOrdreAsc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CodeSerieDTO createSerie(CreateCodeSerieRequest request) {
        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : serieRepository.findTopByOrderByOrdreDesc().map(s -> s.getOrdre() + 1).orElse(1);

        if (serieRepository.existsByOrdre(ordre)) {
            throw new BadRequestException("Une série existe déjà à l'ordre " + ordre);
        }

        SerieCode serie = SerieCode.builder()
                .nom(request.getNom().trim())
                .description(request.getDescription())
                .ordre(ordre)
                .actif(request.getActif() == null || request.getActif())
                .build();

        return mapToDTO(serieRepository.save(serie));
    }

    @Transactional
    public CodeSerieDTO updateSerie(Long id, UpdateCodeSerieRequest request) {
        SerieCode serie = serieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Série introuvable avec l'id: " + id));

        if (serieRepository.existsByOrdreAndIdNot(request.getOrdre(), id)) {
            throw new BadRequestException("Une autre série existe déjà à l'ordre " + request.getOrdre());
        }

        serie.setNom(request.getNom().trim());
        serie.setDescription(request.getDescription());
        serie.setOrdre(request.getOrdre());
        serie.setActif(request.isActif());

        return mapToDTO(serieRepository.save(serie));
    }

    @Transactional
    public void deleteSerie(Long id) {
        if (!serieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Série introuvable avec l'id: " + id);
        }

        // 1. Supprimer les réponses liées aux tentatives de cette série
        List<CodeTentative> tentatives = tentativeRepository.findBySerieId(id);
        for (CodeTentative t : tentatives) {
            reponseTentativeRepository.deleteByTentativeId(t.getId());
        }

        // 2. Supprimer les réponses liées aux questions de cette série
        List<CodeQuestion> questions = questionRepository.findBySerieIdOrderByOrdreAsc(id);
        for (CodeQuestion q : questions) {
            reponseTentativeRepository.deleteByQuestionId(q.getId());
        }

        // 3. Supprimer les tentatives de la série
        tentativeRepository.deleteBySerieId(id);

        // 4. Supprimer les questions de la série
        questionRepository.deleteBySerieId(id);

        // 5. Supprimer la série elle-même
        serieRepository.deleteById(id);
    }

    private CodeSerieDTO mapToDTO(SerieCode s) {
        return CodeSerieDTO.builder()
                .id(s.getId())
                .nom(s.getNom())
                .description(s.getDescription())
                .ordre(s.getOrdre())
                .actif(s.isActif())
                .nombreQuestions(questionRepository.countBySerieId(s.getId()))
                .build();
    }
}
