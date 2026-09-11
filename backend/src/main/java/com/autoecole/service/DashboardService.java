package com.autoecole.service;

import com.autoecole.dto.CandidatDTOs.CandidatDTO;
import com.autoecole.dto.DashboardDTOs.DashboardStatsDTO;
import com.autoecole.dto.ExamenDTOs.PassageExamenDTO;
import com.autoecole.dto.PaiementDTOs.PaiementDTO;
import com.autoecole.dto.CaisseDTOs.TransactionCaisseDTO;
import com.autoecole.dto.CaisseDTOs.RecapCaisseDTO;
import com.autoecole.entity.Inscription;
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

    private final InscriptionRepository inscriptionRepository;
    private final PaiementRepository paiementRepository;
    private final PassageExamenRepository passageRepository;
    private final CaisseService caisseService;
    private final CandidatService candidatService;
    private final PaiementService paiementService;
    private final ExamenService examenService;
    private final SiteAccessService siteAccessService;

    public DashboardStatsDTO getDashboardStats() {
        // Un moniteur ne voit que les indicateurs de son propre site (§19 : "accès limité"
        // pour le tableau de bord) ; ADMIN/SECRETAIRE/CAISSIERE gardent la vision globale.
        Long siteId = siteAccessService.resoudreFiltreSitePourListe();
        // Paiements et Caisse : "Aucun accès" pour le Moniteur (§19.2) — on n'expose donc
        // même pas ces données dans la réponse, plutôt que de compter sur le frontend
        // pour les masquer.
        boolean accesFinancierRestreint = siteAccessService.estMoniteurRestreint();

        // Candidats KPIs (calculés sur le cycle d'inscription actif de chaque candidat)
        long totalCandidats = inscriptionRepository.countByActiveTrueAndSite(siteId);
        long candidatsEnCours = inscriptionRepository.countByActiveTrueAndStatutDossierAndSite(StatutDossier.EN_COURS, siteId);
        long candidatsSoldes = inscriptionRepository.countByActiveTrueAndStatutDossierAndSite(StatutDossier.SOLDE, siteId);
        long candidatsExpiresNonSoldes = inscriptionRepository.countByActiveTrueAndStatutDossierAndSite(StatutDossier.EXPIRE_NON_SOLDE, siteId);

        // Financier KPIs
        BigDecimal totalVerse = null;
        BigDecimal totalRestant = null;
        RecapCaisseDTO recapCaisse = null;
        List<PaiementDTO> derniersPaiements = List.of();
        List<TransactionCaisseDTO> dernieresTransactionsCaisse = List.of();
        if (!accesFinancierRestreint) {
            totalVerse = inscriptionRepository.sumTotalVerseActif(siteId);
            totalRestant = inscriptionRepository.sumSoldeRestantActif(siteId);
            recapCaisse = caisseService.getRecapCaisse();
            derniersPaiements = paiementRepository.findTop10ByOrderByDatePaiementDesc()
                    .stream().map(paiementService::mapToDTO).collect(Collectors.toList());
            dernieresTransactionsCaisse = caisseService.getDernieresTransactions();
        }

        // Examens KPIs
        long examensReussis = passageRepository.countByResultatAndSite(ResultatExamen.REUSSI, siteId);
        long examensEchecs = passageRepository.countByResultatAndSite(ResultatExamen.AJOURNE, siteId);
        long examensProgrammes = passageRepository.countByResultatAndSite(ResultatExamen.PROGRAMME, siteId);

        // Alertes expiration (dans les 30 prochains jours)
        LocalDate today = LocalDate.now();
        List<CandidatDTO> alertesExpiration = inscriptionRepository.findInscriptionsActivesProchesExpiration(today, today.plusDays(30), siteId)
                .stream().map(Inscription::getCandidat).map(candidatService::mapToDTO).collect(Collectors.toList());

        // Prochains examens (déjà filtrés par site ET spécialité du moniteur courant)
        List<PassageExamenDTO> prochainsExamens = examenService.getProchainsExamens();

        return DashboardStatsDTO.builder()
                .totalCandidats(totalCandidats)
                .candidatsEnCours(candidatsEnCours)
                .candidatsSoldes(candidatsSoldes)
                .candidatsExpiresNonSoldes(candidatsExpiresNonSoldes)
                .montantTotalEncaisse(totalVerse)
                .montantGlobalRestantDu(totalRestant)
                .soldeCaisseActuel(recapCaisse != null ? recapCaisse.getSoldeCaisse() : null)
                .totalEntreesCaisse(recapCaisse != null ? recapCaisse.getTotalEntrees() : null)
                .totalSortiesCaisse(recapCaisse != null ? recapCaisse.getTotalSorties() : null)
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
