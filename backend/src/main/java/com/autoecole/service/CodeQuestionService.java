package com.autoecole.service;

import com.autoecole.dto.CodeDTOs.CodeQuestionDTO;
import com.autoecole.dto.CodeDTOs.CreateCodeQuestionRequest;
import com.autoecole.dto.CodeDTOs.UpdateCodeQuestionRequest;
import com.autoecole.entity.CodeQuestion;
import com.autoecole.entity.SerieCode;
import com.autoecole.entity.enums.LettreReponse;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CodeQuestionRepository;
import com.autoecole.repository.SerieCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Gestion de la banque de questions du Code de la route (ADMIN/MONITEUR), organisée par
 * série. L'ordre des questions est stable et jamais mélangé au sein de sa série (cf. §4 du
 * cahier des charges du module).
 */
@Service
@RequiredArgsConstructor
public class CodeQuestionService {

    private final CodeQuestionRepository questionRepository;
    private final SerieCodeRepository serieRepository;

    public List<CodeQuestionDTO> getQuestionsDeSerie(Long serieId) {
        return questionRepository.findBySerieIdOrderByOrdreAsc(serieId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CodeQuestionDTO createQuestion(CreateCodeQuestionRequest request) {
        SerieCode serie = serieRepository.findById(request.getSerieId())
                .orElseThrow(() -> new ResourceNotFoundException("Série introuvable"));
        validerReponse(request.getBonnesReponses(), request.getNombreOptions());
        validateImage(request.getImageData());

        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : questionRepository.findTopBySerieIdOrderByOrdreDesc(serie.getId()).map(q -> q.getOrdre() + 1).orElse(1);

        if (questionRepository.existsBySerieIdAndOrdre(serie.getId(), ordre)) {
            throw new BadRequestException("Une question existe déjà à l'ordre " + ordre + " dans cette série");
        }

        CodeQuestion question = CodeQuestion.builder()
                .serie(serie)
                .ordre(ordre)
                .enonce(request.getEnonce().trim())
                .imageData(request.getImageData())
                .reponseA(texteOuNull(request.getReponseA()))
                .reponseB(texteOuNull(request.getReponseB()))
                .reponseC(texteOuNull(request.getReponseC()))
                .reponseD(texteOuNull(request.getReponseD()))
                .sousTitreGroupeAB(texteOuNull(request.getSousTitreGroupeAB()))
                .sousTitreGroupeCD(texteOuNull(request.getSousTitreGroupeCD()))
                .nombreOptions(request.getNombreOptions())
                .bonneReponses(LettreReponse.toCsv(request.getBonnesReponses()))
                .explication(request.getExplication())
                .actif(request.getActif() == null || request.getActif())
                .build();

        return mapToDTO(questionRepository.save(question));
    }

    @Transactional
    public CodeQuestionDTO updateQuestion(Long id, UpdateCodeQuestionRequest request) {
        CodeQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question introuvable avec l'id: " + id));

        validerReponse(request.getBonnesReponses(), request.getNombreOptions());
        validateImage(request.getImageData());

        if (questionRepository.existsBySerieIdAndOrdreAndIdNot(question.getSerie().getId(), request.getOrdre(), id)) {
            throw new BadRequestException("Une autre question existe déjà à l'ordre " + request.getOrdre() + " dans cette série");
        }

        question.setOrdre(request.getOrdre());
        question.setEnonce(request.getEnonce().trim());
        question.setImageData(request.getImageData());
        question.setReponseA(texteOuNull(request.getReponseA()));
        question.setReponseB(texteOuNull(request.getReponseB()));
        question.setReponseC(texteOuNull(request.getReponseC()));
        question.setReponseD(texteOuNull(request.getReponseD()));
        question.setSousTitreGroupeAB(texteOuNull(request.getSousTitreGroupeAB()));
        question.setSousTitreGroupeCD(texteOuNull(request.getSousTitreGroupeCD()));
        question.setNombreOptions(request.getNombreOptions());
        question.setBonneReponses(LettreReponse.toCsv(request.getBonnesReponses()));
        question.setExplication(request.getExplication());
        question.setActif(request.isActif());

        return mapToDTO(questionRepository.save(question));
    }

    private String texteOuNull(String texte) {
        return texte != null && !texte.isBlank() ? texte.trim() : null;
    }

    @Transactional
    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Question introuvable avec l'id: " + id);
        }
        questionRepository.deleteById(id);
    }

    private void validerReponse(Set<LettreReponse> bonnesReponses, int nombreOptions) {
        Set<LettreReponse> optionsDisponibles = optionsDisponibles(nombreOptions);
        for (LettreReponse lettre : bonnesReponses) {
            if (!optionsDisponibles.contains(lettre)) {
                throw new BadRequestException("La bonne réponse " + lettre + " ne correspond à aucun choix disponible (" + nombreOptions + " choix)");
            }
        }
    }

    private Set<LettreReponse> optionsDisponibles(int nombreOptions) {
        return switch (nombreOptions) {
            case 2 -> EnumSet.of(LettreReponse.A, LettreReponse.B);
            case 3 -> EnumSet.of(LettreReponse.A, LettreReponse.B, LettreReponse.C);
            case 4 -> EnumSet.of(LettreReponse.A, LettreReponse.B, LettreReponse.C, LettreReponse.D);
            default -> throw new BadRequestException("Le nombre de choix doit être entre 2 et 4");
        };
    }

    private void validateImage(String imageData) {
        if (imageData == null || imageData.isBlank()) return;
        if (!imageData.matches("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$")) {
            throw new BadRequestException("Format d'image non pris en charge");
        }
        if (imageData.length() > 2_800_000) {
            throw new BadRequestException("L'image ne doit pas dépasser 2 Mo");
        }
    }

    private CodeQuestionDTO mapToDTO(CodeQuestion q) {
        return CodeQuestionDTO.builder()
                .id(q.getId())
                .serieId(q.getSerie().getId())
                .ordre(q.getOrdre())
                .enonce(q.getEnonce())
                .imageData(q.getImageData())
                .reponseA(q.getReponseA())
                .reponseB(q.getReponseB())
                .reponseC(q.getReponseC())
                .reponseD(q.getReponseD())
                .sousTitreGroupeAB(q.getSousTitreGroupeAB())
                .sousTitreGroupeCD(q.getSousTitreGroupeCD())
                .nombreOptions(q.getNombreOptionsEffectif())
                .bonnesReponses(LettreReponse.fromCsv(q.getBonneReponses()))
                .explication(q.getExplication())
                .actif(q.isActif())
                .build();
    }
}
