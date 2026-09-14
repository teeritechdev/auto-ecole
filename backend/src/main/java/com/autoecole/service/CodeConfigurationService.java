package com.autoecole.service;

import com.autoecole.dto.CodeDTOs.CodeConfigurationDTO;
import com.autoecole.dto.CodeDTOs.UpdateCodeConfigurationRequest;
import com.autoecole.entity.CodeConfiguration;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.repository.CodeConfigurationRepository;
import com.autoecole.repository.CodeQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CodeConfigurationService {

    private final CodeConfigurationRepository configurationRepository;
    private final CodeQuestionRepository questionRepository;
    private final SiteAccessService siteAccessService;

    public CodeConfiguration getConfigurationEntity() {
        return configurationRepository.findById(1L).orElseGet(CodeConfiguration::new);
    }

    public CodeConfigurationDTO getConfiguration() {
        siteAccessService.verifierAccesEpreuve(TypeEpreuve.CODE);
        return mapToDTO(getConfigurationEntity());
    }

    @Transactional
    public CodeConfigurationDTO updateConfiguration(UpdateCodeConfigurationRequest request) {
        siteAccessService.verifierAccesEpreuve(TypeEpreuve.CODE);
        CodeConfiguration configuration = getConfigurationEntity();
        configuration.setQuestionsParCycle(request.getQuestionsParCycle());
        configuration.setSeuilReussite(Math.min(request.getSeuilReussite(), request.getQuestionsParCycle()));
        configuration.setTempsParQuestionSecondes(request.getTempsParQuestionSecondes());
        configuration.setDureeMaxCycleSecondes(request.getDureeMaxCycleSecondes());
        configuration.setTentativesMax(request.getTentativesMax());
        configuration.setRepriseAutoriseeApresEchec(request.isRepriseAutoriseeApresEchec());
        configuration.setRetourQuestionPrecedenteAutorise(request.isRetourQuestionPrecedenteAutorise());
        configuration.setCorrectionImmediate(request.isCorrectionImmediate());
        configuration.setDeblocageAutomatiqueCycleSuivant(request.isDeblocageAutomatiqueCycleSuivant());
        configuration.setDureeExpirationAccesJours(request.getDureeExpirationAccesJours());
        configurationRepository.save(configuration);
        return mapToDTO(configuration);
    }

    private CodeConfigurationDTO mapToDTO(CodeConfiguration c) {
        long nombreQuestionsActives = questionRepository.countByActifTrue();
        int nombreDeCycles = nombreQuestionsActives == 0
                ? 0
                : (int) Math.ceil((double) nombreQuestionsActives / c.getQuestionsParCycle());

        return CodeConfigurationDTO.builder()
                .questionsParCycle(c.getQuestionsParCycle())
                .seuilReussite(c.getSeuilReussite())
                .tempsParQuestionSecondes(c.getTempsParQuestionSecondes())
                .dureeMaxCycleSecondes(c.getDureeMaxCycleSecondes())
                .tentativesMax(c.getTentativesMax())
                .repriseAutoriseeApresEchec(c.isRepriseAutoriseeApresEchec())
                .retourQuestionPrecedenteAutorise(c.isRetourQuestionPrecedenteAutorise())
                .correctionImmediate(c.isCorrectionImmediate())
                .deblocageAutomatiqueCycleSuivant(c.isDeblocageAutomatiqueCycleSuivant())
                .dureeExpirationAccesJours(c.getDureeExpirationAccesJours())
                .nombreQuestionsActives(nombreQuestionsActives)
                .nombreDeCycles(nombreDeCycles)
                .build();
    }
}
