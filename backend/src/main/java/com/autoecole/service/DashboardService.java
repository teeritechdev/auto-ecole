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
import org.springframework.transaction.annotation.Transactional;

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

    // @Transactional : cette méthode assemble des DTO à partir de plusieurs entités liées
    // par des relations LAZY (ex. candidatsConcernes d'une TransactionCaisse) ; sans session
    // Hibernate ouverte pour toute la durée de l'agrégation, ces accès lèvent une
    // LazyInitializationException (500), ce qui rendait le tableau de bord et les
    // statistiques de paiement désespérément à zéro pour tous les rôles (ADMIN compris).
    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        // Un moniteur ne voit que les indicateurs de ses propres sites (§19 : "accès limité"
        // pour le tableau de bord) ; ADMIN/SECRETAIRE/CAISSIERE gardent la vision globale.
        java.util.Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        // Un moniteur affecté à aucun site ne doit rien voir : on court-circuite avant de
        // transmettre un ensemble vide à des requêtes IN (comportement non garanti côté JPQL).
        boolean aucunSiteAssigne = siteIds != null && siteIds.isEmpty();
        // Paiements et Caisse : "Aucun accès" pour le Moniteur (§19.2) — on n'expose donc
        // même pas ces données dans la réponse, plutôt que de compter sur le frontend
        // pour les masquer.
        boolean accesFinancierRestreint = siteAccessService.estMoniteurRestreint();

        // Candidats KPIs (calculés sur le cycle d'inscription actif de chaque candidat)
        long totalCandidats = aucunSiteAssigne ? 0 : inscriptionRepository.countByActiveTrueAndSite(siteIds);
        long candidatsEnCours = aucunSiteAssigne ? 0 : inscriptionRepository.countByActiveTrueAndStatutDossierAndSite(StatutDossier.EN_COURS, siteIds);
        long candidatsSoldes = aucunSiteAssigne ? 0 : inscriptionRepository.countByActiveTrueAndStatutDossierAndSite(StatutDossier.SOLDE, siteIds);
        long candidatsExpiresNonSoldes = aucunSiteAssigne ? 0 : inscriptionRepository.countByActiveTrueAndStatutDossierAndSite(StatutDossier.EXPIRE_NON_SOLDE, siteIds);
        long totalHommes = aucunSiteAssigne ? 0 : inscriptionRepository.countByActiveTrueAndSexeAndSite(com.autoecole.entity.enums.Sexe.HOMME, siteIds);
        long totalFemmes = aucunSiteAssigne ? 0 : inscriptionRepository.countByActiveTrueAndSexeAndSite(com.autoecole.entity.enums.Sexe.FEMME, siteIds);

        // Financier KPIs
        BigDecimal totalVerse = null;
        BigDecimal totalRestant = null;
        RecapCaisseDTO recapCaisse = null;
        List<PaiementDTO> derniersPaiements = List.of();
        List<TransactionCaisseDTO> dernieresTransactionsCaisse = List.of();
        if (!accesFinancierRestreint) {
            totalVerse = inscriptionRepository.sumTotalVerseActif(siteIds);
            totalRestant = inscriptionRepository.sumSoldeRestantActif(siteIds);
            recapCaisse = caisseService.getRecapCaisse(null);
            derniersPaiements = paiementRepository.findDerniersPaiements(siteIds, org.springframework.data.domain.PageRequest.of(0, 10))
                    .stream().map(paiementService::mapToDTO).collect(Collectors.toList());
            dernieresTransactionsCaisse = caisseService.getDernieresTransactions();
        }

        // Examens KPIs
        long examensReussis = aucunSiteAssigne ? 0 : passageRepository.countByResultatAndSite(ResultatExamen.REUSSI, siteIds);
        long examensEchecs = aucunSiteAssigne ? 0 : passageRepository.countByResultatAndSite(ResultatExamen.AJOURNE, siteIds);
        long examensProgrammes = aucunSiteAssigne ? 0 : passageRepository.countByResultatAndSite(ResultatExamen.PROGRAMME, siteIds);

        // Alertes expiration (dans les 30 prochains jours)
        LocalDate today = LocalDate.now();
        List<CandidatDTO> alertesExpiration = aucunSiteAssigne ? List.of() : inscriptionRepository.findInscriptionsActivesProchesExpiration(today, today.plusDays(30), siteIds)
                .stream().map(Inscription::getCandidat).map(candidatService::mapToDTO).collect(Collectors.toList());

        // Prochains examens (déjà filtrés par site ET spécialité du moniteur courant)
        List<PassageExamenDTO> prochainsExamens = examenService.getProchainsExamens();

        return DashboardStatsDTO.builder()
                .totalCandidats(totalCandidats)
                .candidatsEnCours(candidatsEnCours)
                .candidatsSoldes(candidatsSoldes)
                .candidatsExpiresNonSoldes(candidatsExpiresNonSoldes)
                .totalHommes(totalHommes)
                .totalFemmes(totalFemmes)
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
