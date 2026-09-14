package com.autoecole.service;

import com.autoecole.dto.CodeDTOs.CodeQuestionDTO;
import com.autoecole.dto.CodeDTOs.CreateCodeQuestionRequest;
import com.autoecole.dto.CodeDTOs.UpdateCodeQuestionRequest;
import com.autoecole.entity.CodeQuestion;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CodeQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Gestion de la banque de questions du Code de la route (ADMIN uniquement). L'ordre des
 * questions est stable et jamais mélangé (cf. §4 du cahier des charges du module) : il
 * détermine aussi le découpage en Cycles, calculé à la volée par CodeService.
 */
@Service
@RequiredArgsConstructor
public class CodeQuestionService {

    private final CodeQuestionRepository questionRepository;

    public List<CodeQuestionDTO> getAllQuestions() {
        return questionRepository.findAllByOrderByOrdreAsc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CodeQuestionDTO createQuestion(CreateCodeQuestionRequest request) {
        validerReponse(request.getBonneReponse().name(), request.getReponseA(), request.getReponseB(), request.getReponseC(), request.getReponseD());
        validateImage(request.getImageData());

        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : questionRepository.findTopByOrderByOrdreDesc().map(q -> q.getOrdre() + 1).orElse(1);

        if (questionRepository.existsByOrdre(ordre)) {
            throw new BadRequestException("Une question existe déjà à l'ordre " + ordre);
        }

        CodeQuestion question = CodeQuestion.builder()
                .ordre(ordre)
                .enonce(request.getEnonce().trim())
                .imageData(request.getImageData())
                .reponseA(request.getReponseA().trim())
                .reponseB(request.getReponseB().trim())
                .reponseC(request.getReponseC() != null ? request.getReponseC().trim() : null)
                .reponseD(request.getReponseD() != null ? request.getReponseD().trim() : null)
                .bonneReponse(request.getBonneReponse())
                .explication(request.getExplication())
                .actif(request.getActif() == null || request.getActif())
                .build();

        return mapToDTO(questionRepository.save(question));
    }

    @Transactional
    public CodeQuestionDTO updateQuestion(Long id, UpdateCodeQuestionRequest request) {
        CodeQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question introuvable avec l'id: " + id));

        validerReponse(request.getBonneReponse().name(), request.getReponseA(), request.getReponseB(), request.getReponseC(), request.getReponseD());
        validateImage(request.getImageData());

        if (questionRepository.existsByOrdreAndIdNot(request.getOrdre(), id)) {
            throw new BadRequestException("Une autre question existe déjà à l'ordre " + request.getOrdre());
        }

        question.setOrdre(request.getOrdre());
        question.setEnonce(request.getEnonce().trim());
        question.setImageData(request.getImageData());
        question.setReponseA(request.getReponseA().trim());
        question.setReponseB(request.getReponseB().trim());
        question.setReponseC(request.getReponseC() != null ? request.getReponseC().trim() : null);
        question.setReponseD(request.getReponseD() != null ? request.getReponseD().trim() : null);
        question.setBonneReponse(request.getBonneReponse());
        question.setExplication(request.getExplication());
        question.setActif(request.isActif());

        return mapToDTO(questionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Question introuvable avec l'id: " + id);
        }
        questionRepository.deleteById(id);
    }

    private void validerReponse(String bonneReponse, String a, String b, String c, String d) {
        boolean valide = switch (bonneReponse) {
            case "A" -> a != null && !a.isBlank();
            case "B" -> b != null && !b.isBlank();
            case "C" -> c != null && !c.isBlank();
            case "D" -> d != null && !d.isBlank();
            default -> false;
        };
        if (!valide) {
            throw new BadRequestException("La bonne réponse désignée (" + bonneReponse + ") doit correspondre à une réponse renseignée");
        }
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
                .ordre(q.getOrdre())
                .enonce(q.getEnonce())
                .imageData(q.getImageData())
                .reponseA(q.getReponseA())
                .reponseB(q.getReponseB())
                .reponseC(q.getReponseC())
                .reponseD(q.getReponseD())
                .bonneReponse(q.getBonneReponse())
                .explication(q.getExplication())
                .actif(q.isActif())
                .build();
    }
}
