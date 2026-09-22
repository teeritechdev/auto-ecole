package com.autoecole.service;

import com.autoecole.dto.CodeDTOs.CodeConfigurationDTO;
import com.autoecole.dto.CodeDTOs.UpdateCodeConfigurationRequest;
import com.autoecole.entity.CodeConfiguration;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.repository.CodeConfigurationRepository;
import com.autoecole.repository.SerieCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CodeConfigurationService {

    private final CodeConfigurationRepository configurationRepository;
    private final SerieCodeRepository serieRepository;
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
        configuration.setSeuilReussite(request.getSeuilReussite());
        configuration.setTempsParQuestionSecondes(request.getTempsParQuestionSecondes());
        configuration.setDureeMaxSerieSecondes(request.getDureeMaxSerieSecondes());
        configuration.setRepriseAutoriseeApresEchec(request.isRepriseAutoriseeApresEchec());
        configuration.setRetourQuestionPrecedenteAutorise(request.isRetourQuestionPrecedenteAutorise());
        configuration.setCorrectionImmediate(request.isCorrectionImmediate());
        configuration.setDeblocageAutomatiqueSerieSuivante(request.isDeblocageAutomatiqueSerieSuivante());
        configuration.setDureeExpirationAccesJours(request.getDureeExpirationAccesJours());
        configurationRepository.save(configuration);
        return mapToDTO(configuration);
    }

    private CodeConfigurationDTO mapToDTO(CodeConfiguration c) {
        long nombreDeSeries = serieRepository.findByActifTrueOrderByOrdreAsc().size();

        return CodeConfigurationDTO.builder()
                .seuilReussite(c.getSeuilReussite())
                .tempsParQuestionSecondes(c.getTempsParQuestionSecondes())
                .dureeMaxSerieSecondes(c.getDureeMaxSerieSecondes())
                .repriseAutoriseeApresEchec(c.isRepriseAutoriseeApresEchec())
                .retourQuestionPrecedenteAutorise(c.isRetourQuestionPrecedenteAutorise())
                .correctionImmediate(c.isCorrectionImmediate())
                .deblocageAutomatiqueSerieSuivante(c.isDeblocageAutomatiqueSerieSuivante())
                .dureeExpirationAccesJours(c.getDureeExpirationAccesJours())
                .nombreDeSeries(nombreDeSeries)
                .build();
    }
}
