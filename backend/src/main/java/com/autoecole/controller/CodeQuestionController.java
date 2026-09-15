package com.autoecole.controller;

import com.autoecole.dto.CodeDTOs.CodeQuestionDTO;
import com.autoecole.dto.CodeDTOs.CreateCodeQuestionRequest;
import com.autoecole.dto.CodeDTOs.UpdateCodeQuestionRequest;
import com.autoecole.service.CodeQuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/code/questions")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('PERM_CODE_QUESTIONS_GERER')")
@Tag(name = "Code de la route - Questions", description = "Gestion de la banque de questions (ordre stable, jamais mélangée)")
public class CodeQuestionController {

    private final CodeQuestionService questionService;

    @GetMapping
    @Operation(summary = "Lister toutes les questions de la banque, dans l'ordre")
    public ResponseEntity<List<CodeQuestionDTO>> getAllQuestions() {
        return ResponseEntity.ok(questionService.getAllQuestions());
    }

    @PostMapping
    @Operation(summary = "Ajouter une question à la banque")
    public ResponseEntity<CodeQuestionDTO> createQuestion(@Valid @RequestBody CreateCodeQuestionRequest request) {
        return new ResponseEntity<>(questionService.createQuestion(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une question de la banque")
    public ResponseEntity<CodeQuestionDTO> updateQuestion(@PathVariable Long id, @Valid @RequestBody UpdateCodeQuestionRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une question de la banque")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
