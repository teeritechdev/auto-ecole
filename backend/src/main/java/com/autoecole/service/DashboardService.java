package com.autoecole.service;

import com.autoecole.dto.CandidatDTOs.CandidatDTO;
import com.autoecole.dto.DashboardDTOs.DashboardStatsDTO;
import com.autoecole.dto.ExamenDTOs.PassageExamenDTO;
import com.autoecole.dto.PaiementDTOs.PaiementDTO;
import com.autoecole.dto.CaisseDTOs.TransactionCaisseDTO;
import com.autoecole.dto.CaisseDTOs.RecapCaisseDTO;
import com.autoecole.entity.enums.ResultatExamen;
import com.autoecole.entity.enums.StatutDossier;
import com.autoecole.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CandidatRepository candidatRepository;
    private final PaiementRepository paiementRepository;
    private final PassageExamenRepository passageRepository;
    private final CaisseService caisseService;
    private final CandidatService candidatService;
    private final PaiementService paiementService;
    private final ExamenService examenService;

    public DashboardStatsDTO getDashboardStats() {
        // Candidats KPIs
        long totalCandidats = candidatRepository.count();
        long candidatsEnCours = candidatRepository.countByStatutDossier(StatutDossier.EN_COURS);
        long candidatsSoldes = candidatRepository.countByStatutDossier(StatutDossier.SOLDE);
        long candidatsExpires = candidatRepository.countByStatutDossier(StatutDossier.EXPIRE);
        long candidatsExpiresNonSoldes = candidatRepository.countByStatutDossier(StatutDossier.EXPIRE_NON_SOLDE);

        // Financier KPIs
        BigDecimal totalVerse = candidatRepository.sumTotalVerse();
        BigDecimal totalRestant = candidatRepository.sumSoldeRestant();
        RecapCaisseDTO recapCaisse = caisseService.getRecapCaisse();

        // Examens KPIs
        long examensReussis = passageRepository.countByResultat(ResultatExamen.REUSSI);
        long examensEchecs = passageRepository.countByResultat(ResultatExamen.ECHEC);
        long examensProgrammes = passageRepository.countByResultat(ResultatExamen.PROGRAMME);

        // Alertes expiration (dans les 30 prochains jours)
        LocalDate today = LocalDate.now();
        List<CandidatDTO> alertesExpiration = candidatRepository.findCandidatsProchesExpiration(today, today.plusDays(30))
                .stream().map(candidatService::mapToDTO).collect(Collectors.toList());

        // Prochains examens
        List<PassageExamenDTO> prochainsExamens = examenService.getProchainsExamens();

        // Derniers paiements
        List<PaiementDTO> derniersPaiements = paiementRepository.findTop10ByOrderByDatePaiementDesc()
                .stream().map(paiementService::mapToDTO).collect(Collectors.toList());

        // Dernières transactions caisse
        List<TransactionCaisseDTO> dernieresTransactionsCaisse = caisseService.getDernieresTransactions();

        return DashboardStatsDTO.builder()
                .totalCandidats(totalCandidats)
                .candidatsEnCours(candidatsEnCours)
                .candidatsSoldes(candidatsSoldes)
                .candidatsExpires(candidatsExpires)
                .candidatsExpiresNonSoldes(candidatsExpiresNonSoldes)
                .montantTotalEncaisse(totalVerse)
                .montantGlobalRestantDu(totalRestant)
                .soldeCaisseActuel(recapCaisse.getSoldeCaisse())
                .totalEntreesCaisse(recapCaisse.getTotalEntrees())
                .totalSortiesCaisse(recapCaisse.getTotalSorties())
                .totalExamensReussis(examensReussis)
                .totalExamensEchecs(examensEchecs)
                .totalExamensProgrammes(examensProgrammes)
                .alertesExpiration(alertesExpiration)
                .prochainsExamens(prochainsExamens)
                .derniersPaiements(derniersPaiements)
                .dernieresTransactionsCaisse(dernieresTransactionsCaisse)
                .build();
    }
}
