package com.autoecole.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class DashboardDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardStatsDTO {
        // Candidats KPIs
        private long totalCandidats;
        private long candidatsEnCours;
        private long candidatsSoldes;
        private long candidatsExpires;
        private long candidatsExpiresNonSoldes;

        // Financier KPIs
        private BigDecimal montantTotalEncaisse;
        private BigDecimal montantGlobalRestantDu;
        private BigDecimal soldeCaisseActuel;
        private BigDecimal totalEntreesCaisse;
        private BigDecimal totalSortiesCaisse;

        // Examens KPIs
        private long totalExamensReussis;
        private long totalExamensEchecs;
        private long totalExamensProgrammes;

        // Listes pour widgets du dashboard
        private List<CandidatDTOs.CandidatDTO> alertesExpiration;
        private List<ExamenDTOs.PassageExamenDTO> prochainsExamens;
        private List<PaiementDTOs.PaiementDTO> derniersPaiements;
        private List<CaisseDTOs.TransactionCaisseDTO> dernieresTransactionsCaisse;
    }
}
