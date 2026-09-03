package com.autoecole;

import com.autoecole.entity.*;
import com.autoecole.entity.enums.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class BusinessRulesTest {

    @Test
    @DisplayName("RG09 & RG07 : Recalcul automatique du solde et passage à SOLDÉ lorsque total versé = montant forfait")
    void testRecalculSoldeEtStatutSolde() {
        Forfait forfait = Forfait.builder()
                .nom("Forfait 1")
                .montant(new BigDecimal("100000"))
                .build();

        Candidat candidat = Candidat.builder()
                .forfait(forfait)
                .montantForfait(forfait.getMontant())
                .totalVerse(new BigDecimal("100000"))
                .dateInscription(LocalDate.now())
                .dateEcheance(LocalDate.now().plusMonths(8))
                .build();

        candidat.recalculerSoldeEtStatut();

        assertEquals(BigDecimal.ZERO, candidat.getSoldeRestant());
        assertEquals(StatutDossier.SOLDE, candidat.getStatutDossier());
    }

    @Test
    @DisplayName("RG06 : Dossier expiré après 8 mois avec reste à payer -> EXPIRE_NON_SOLDE")
    void testDossierExpireNonSolde() {
        Forfait forfait = Forfait.builder()
                .nom("Forfait 1")
                .montant(new BigDecimal("100000"))
                .build();

        // Inscrit il y a 9 mois
        LocalDate dateInsc = LocalDate.now().minusMonths(9);
        LocalDate dateEcheance = dateInsc.plusMonths(8);

        Candidat candidat = Candidat.builder()
                .forfait(forfait)
                .montantForfait(forfait.getMontant())
                .totalVerse(new BigDecimal("40000"))
                .dateInscription(dateInsc)
                .dateEcheance(dateEcheance)
                .build();

        candidat.recalculerSoldeEtStatut();

        assertEquals(new BigDecimal("60000"), candidat.getSoldeRestant());
        assertEquals(StatutDossier.EXPIRE_NON_SOLDE, candidat.getStatutDossier());
    }

    @Test
    @DisplayName("RG01 & RG02 : Dossier en cours avec premier versement partiel (40 000 FCFA sur 100 000 FCFA)")
    void testDossierEnCoursAvecAcompte() {
        Forfait forfait = Forfait.builder()
                .nom("Forfait 1")
                .montant(new BigDecimal("100000"))
                .build();

        LocalDate dateInsc = LocalDate.now().minusMonths(1);
        LocalDate dateEcheance = dateInsc.plusMonths(8);

        Candidat candidat = Candidat.builder()
                .forfait(forfait)
                .montantForfait(forfait.getMontant())
                .totalVerse(new BigDecimal("40000"))
                .dateInscription(dateInsc)
                .dateEcheance(dateEcheance)
                .build();

        candidat.recalculerSoldeEtStatut();

        assertEquals(new BigDecimal("60000"), candidat.getSoldeRestant());
        assertEquals(StatutDossier.EN_COURS, candidat.getStatutDossier());
    }

    @Test
    @DisplayName("RG06 : Dossier après 8 mois mais totalement soldé -> reste SOLDÉ")
    void testDossierEchuMaisSolde() {
        Forfait forfait = Forfait.builder()
                .nom("Forfait 2")
                .montant(new BigDecimal("125000"))
                .build();

        LocalDate dateInsc = LocalDate.now().minusMonths(10);
        LocalDate dateEcheance = dateInsc.plusMonths(8);

        Candidat candidat = Candidat.builder()
                .forfait(forfait)
                .montantForfait(forfait.getMontant())
                .totalVerse(new BigDecimal("125000"))
                .dateInscription(dateInsc)
                .dateEcheance(dateEcheance)
                .build();

        candidat.recalculerSoldeEtStatut();

        assertEquals(BigDecimal.ZERO, candidat.getSoldeRestant());
        assertEquals(StatutDossier.SOLDE, candidat.getStatutDossier());
    }

    @Test
    @DisplayName("RG09 : Total versé nul au départ -> solde restant = montant forfait")
    void testSoldeRestantInitial() {
        Forfait forfait = Forfait.builder()
                .nom("Forfait 2")
                .montant(new BigDecimal("125000"))
                .build();

        Candidat candidat = Candidat.builder()
                .forfait(forfait)
                .montantForfait(forfait.getMontant())
                .totalVerse(BigDecimal.ZERO)
                .dateInscription(LocalDate.now())
                .dateEcheance(LocalDate.now().plusMonths(8))
                .build();

        candidat.recalculerSoldeEtStatut();

        assertEquals(new BigDecimal("125000"), candidat.getSoldeRestant());
        assertEquals(StatutDossier.EN_COURS, candidat.getStatutDossier());
    }
}
