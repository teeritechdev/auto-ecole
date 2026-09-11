package com.autoecole.service;

import com.autoecole.dto.CandidatDTOs.CandidatDTO;
import com.autoecole.dto.CandidatDTOs.CreateCandidatRequest;
import com.autoecole.dto.CandidatDTOs.ReinscrireCandidatRequest;
import com.autoecole.dto.CandidatDTOs.UpdateCandidatRequest;
import com.autoecole.entity.*;
import com.autoecole.entity.enums.*;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CandidatService {

    private final CandidatRepository candidatRepository;
    private final InscriptionRepository inscriptionRepository;
    private final InscriptionService inscriptionService;
    private final CategoriePermisRepository categorieRepository;
    private final SiteRepository siteRepository;
    private final PaiementRepository paiementRepository;
    private final RecuRepository recuRepository;
    private final TransactionCaisseRepository transactionCaisseRepository;
    private final PassageExamenRepository passageRepository;
    private final AuditService auditService;
    private final SiteAccessService siteAccessService;

    public Page<CandidatDTO> rechercherCandidats(String recherche, StatutDossier statut, Long categorieId, StatutInscription statutInscription, Pageable pageable) {
        java.util.Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        java.util.Set<com.autoecole.entity.enums.EtapeParcours> etapesAutorisees = siteAccessService.resoudreFiltreEtapesPourListe();
        if ((siteIds != null && siteIds.isEmpty()) || (etapesAutorisees != null && etapesAutorisees.isEmpty())) {
            return Page.empty(pageable);
        }
        return candidatRepository.rechercherCandidats(recherche, statut, categorieId, siteIds, statutInscription, etapesAutorisees, pageable)
                .map(this::mapToDTO);
    }

    public List<CandidatDTO> getTousLesCandidatsPourRapport(StatutDossier statut, Long categorieId) {
        return candidatRepository.filtrerPourRapport(statut, categorieId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CandidatDTO getCandidatById(Long id) {
        Candidat c = candidatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouvé avec l'id: " + id));
        inscriptionService.verifierAccesCandidat(c.getId());
        return mapToDTO(c);
    }

    public CandidatDTO getCandidatByNumeroDossier(String numeroDossier) {
        Candidat c = candidatRepository.findByNumeroDossier(numeroDossier)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouvé avec le numéro de dossier: " + numeroDossier));
        inscriptionService.verifierAccesCandidat(c.getId());
        return mapToDTO(c);
    }

    @Transactional
    public CandidatDTO createCandidat(CreateCandidatRequest request) {
        CategoriePermis categorie = categorieRepository.findById(request.getCategoriePermisId())
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie de permis introuvable"));

        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site de formation introuvable"));

        // Validation 1er versement si fourni à l'inscription (RG02)
        BigDecimal premierVersement = request.getMontantPremierVersement();
        validerPremierVersement(premierVersement);

        LocalDate dateInsc = request.getDateInscription() != null ? request.getDateInscription() : LocalDate.now();
        String numeroDossier = genererNumeroDossierUnique(dateInsc.getYear());

        Candidat candidat = Candidat.builder()
                .numeroDossier(numeroDossier)
                .nom(request.getNom().trim().toUpperCase())
                .prenom(request.getPrenom().trim())
                .dateNaissance(request.getDateNaissance())
                .lieuNaissance(request.getLieuNaissance())
                .telephone(request.getTelephone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null)
                .contactsUrgence(request.getContactsUrgence())
                .dateReceptionDossier(request.getDateReceptionDossier())
                .dateDepotDossier(request.getDateDepotDossier())
                .build();

        Candidat savedCandidat = candidatRepository.save(candidat);

        BigDecimal totalVerse = (premierVersement != null) ? premierVersement : BigDecimal.ZERO;
        Inscription inscription = inscriptionService.creerInscriptionInitiale(savedCandidat, categorie, site, dateInsc, request.getMontant(), totalVerse, request.getStatutInscription());

        enregistrerPremierVersementSiFourni(savedCandidat, inscription, premierVersement, request.getModeReglementPremierVersement());

        auditService.logAction("CREATION_CANDIDAT", "Candidat", savedCandidat.getNumeroDossier(),
                "Inscription du candidat " + savedCandidat.getNom() + " " + savedCandidat.getPrenom() + " pour la catégorie " + categorie.getLibelle(), null);

        return mapToDTO(savedCandidat, inscription);
    }

    /**
     * Rattache une nouvelle inscription à un candidat déjà connu de l'auto-école (détecté en
     * amont par la secrétaire via une recherche par téléphone/email) plutôt que de créer un
     * dossier candidat en doublon. Le cycle précédent est archivé et la nouvelle inscription
     * est automatiquement marquée REDOUBLANT.
     */
    @Transactional
    public CandidatDTO reinscrireCandidat(Long candidatId, ReinscrireCandidatRequest request) {
        Candidat candidat = candidatRepository.findById(candidatId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat introuvable"));

        CategoriePermis categorie = categorieRepository.findById(request.getCategoriePermisId())
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie de permis introuvable"));

        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site de formation introuvable"));

        BigDecimal premierVersement = request.getMontantPremierVersement();
        validerPremierVersement(premierVersement);

        BigDecimal totalVerse = (premierVersement != null) ? premierVersement : BigDecimal.ZERO;
        Inscription inscription = inscriptionService.creerNouveauCycle(candidat, categorie, site, request.getDateInscription(), request.getMontant(), totalVerse);

        enregistrerPremierVersementSiFourni(candidat, inscription, premierVersement, request.getModeReglementPremierVersement());

        auditService.logAction("REINSCRIPTION_CANDIDAT", "Candidat", candidat.getNumeroDossier(),
                "Nouvelle inscription (cycle " + inscription.getNumeroCycle() + ", redoublant) pour la catégorie " + categorie.getLibelle(), null);

        return mapToDTO(candidat, inscription);
    }

    private void validerPremierVersement(BigDecimal premierVersement) {
        if (premierVersement != null && premierVersement.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal min1er = new BigDecimal("35000");
            BigDecimal max1er = new BigDecimal("50000");
            if (premierVersement.compareTo(min1er) < 0 || premierVersement.compareTo(max1er) > 0) {
                throw new BadRequestException("Le premier versement doit obligatoirement être compris entre 35 000 et 50 000 FCFA (RG02). Valeur fournie: " + premierVersement + " FCFA");
            }
        }
    }

    private void enregistrerPremierVersementSiFourni(Candidat candidat, Inscription inscription, BigDecimal premierVersement, ModeReglement modeReglement) {
        if (premierVersement == null || premierVersement.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Utilisateur currentUser = auditService.getCurrentUser();

        Paiement paiement = Paiement.builder()
                .inscription(inscription)
                .utilisateur(currentUser)
                .typeVersement(TypeVersement.PREMIER_VERSEMENT)
                .montant(premierVersement)
                .datePaiement(LocalDateTime.now())
                .modeReglement(modeReglement != null ? modeReglement : ModeReglement.ESPECES)
                .statut(StatutPaiement.VALIDE)
                .build();

        Paiement savedPaiement = paiementRepository.save(paiement);

        String numRecu = genererNumeroRecuUnique(LocalDate.now().getYear());
        Recu recu = Recu.builder()
                .paiement(savedPaiement)
                .numeroRecu(numRecu)
                .nomClient(candidat.getNom() + " " + candidat.getPrenom())
                .montant(premierVersement)
                .soldeRestant(inscription.getSoldeRestant())
                .imprimePar(currentUser != null ? currentUser.getNom() + " " + currentUser.getPrenom() : "Secrétariat")
                .build();
        recuRepository.save(recu);

        TransactionCaisse tx = TransactionCaisse.builder()
                .typeMouvement(TypeMouvementCaisse.ENTREE)
                .montant(premierVersement)
                .libelle("1er Versement Inscription " + candidat.getNumeroDossier() + " (" + candidat.getNom() + " " + candidat.getPrenom() + ")")
                .categorie("RECETTE_FORMATION")
                .referencePiece(numRecu)
                .utilisateur(currentUser)
                .paiement(savedPaiement)
                .build();
        transactionCaisseRepository.save(tx);
    }

    @Transactional
    public CandidatDTO updateCandidat(Long id, UpdateCandidatRequest request) {
        Candidat candidat = candidatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat introuvable"));

        CategoriePermis categorie = categorieRepository.findById(request.getCategoriePermisId())
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable"));
        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site de formation introuvable"));

        candidat.setNom(request.getNom().trim().toUpperCase());
        candidat.setPrenom(request.getPrenom().trim());
        candidat.setDateNaissance(request.getDateNaissance());
        candidat.setLieuNaissance(request.getLieuNaissance());
        candidat.setTelephone(request.getTelephone().trim());
        candidat.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
        candidat.setContactsUrgence(request.getContactsUrgence());
        candidat.setDateReceptionDossier(request.getDateReceptionDossier());
        candidat.setDateDepotDossier(request.getDateDepotDossier());

        Candidat updated = candidatRepository.save(candidat);
        Inscription active = inscriptionService.mettreAJourCategorieEtMontant(id, categorie, request.getMontant(), site);

        auditService.logAction("MODIFICATION_CANDIDAT", "Candidat", updated.getNumeroDossier(), "Mise à jour fiche candidat", null);

        return mapToDTO(updated, active);
    }

    @Transactional
    public void deleteCandidat(Long id, String motif) {
        Candidat candidat = candidatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat introuvable"));

        String num = candidat.getNumeroDossier();
        String nom = candidat.getNom() + " " + candidat.getPrenom();

        candidatRepository.delete(candidat);
        auditService.logAction("SUPPRESSION_CANDIDAT", "Candidat", num, "Suppression du dossier candidat " + nom, motif);
    }

    // Cron journalier pour actualiser les statuts expirés
    @Scheduled(cron = "0 0 1 * * ?") // Tous les jours à 01h00
    @Transactional
    public void verifierExpirationsDossiers() {
        log.info("Vérification automatique des dossiers expirés...");
        List<Inscription> aExpirer = inscriptionRepository.findInscriptionsActivesAExpirer(LocalDate.now());
        for (Inscription i : aExpirer) {
            i.recalculerSoldeEtStatut();
            inscriptionRepository.save(i);
        }
    }

    public synchronized String genererNumeroDossierUnique(int annee) {
        long count = candidatRepository.count() + 1;
        String prefix = "DOS-" + annee + "-";
        String candidateNumber = String.format("%s%04d", prefix, count);

        while (candidatRepository.existsByNumeroDossier(candidateNumber)) {
            count++;
            candidateNumber = String.format("%s%04d", prefix, count);
        }
        return candidateNumber;
    }

    public synchronized String genererNumeroRecuUnique(int annee) {
        long count = recuRepository.count() + 1;
        String prefix = "REC-" + annee + "-";
        String candidateNumber = String.format("%s%04d", prefix, count);

        while (recuRepository.existsByNumeroRecu(candidateNumber)) {
            count++;
            candidateNumber = String.format("%s%04d", prefix, count);
        }
        return candidateNumber;
    }

    public CandidatDTO mapToDTO(Candidat c) {
        Inscription active = inscriptionService.getInscriptionActive(c.getId());
        active.recalculerSoldeEtStatut();
        return mapToDTO(c, active);
    }

    public CandidatDTO mapToDTO(Candidat c, Inscription i) {
        LocalDate now = LocalDate.now();
        long joursRestants = 0;
        boolean procheExpiration = false;

        if (i.getDateEcheance() != null) {
            joursRestants = ChronoUnit.DAYS.between(now, i.getDateEcheance());
            procheExpiration = (joursRestants >= 0 && joursRestants <= 30 && i.getStatutDossier() != StatutDossier.SOLDE);
        }

        return CandidatDTO.builder()
                .id(c.getId())
                .numeroDossier(c.getNumeroDossier())
                .nom(c.getNom())
                .prenom(c.getPrenom())
                .dateNaissance(c.getDateNaissance())
                .lieuNaissance(c.getLieuNaissance())
                .telephone(c.getTelephone())
                .email(c.getEmail())
                .contactsUrgence(c.getContactsUrgence())
                .dateInscription(i.getDateInscription())
                .dateReceptionDossier(c.getDateReceptionDossier())
                .dateDepotDossier(c.getDateDepotDossier())
                .dateEcheance(i.getDateEcheance())
                .statutDossier(i.getStatutDossier())
                .statutInscription(i.getStatutInscription())
                .inscriptionActiveId(i.getId())
                .numeroCycle(i.getNumeroCycle())
                .categoriePermisId(i.getCategoriePermis() != null ? i.getCategoriePermis().getId() : null)
                .categoriePermisCode(i.getCategoriePermis() != null ? i.getCategoriePermis().getCode() : null)
                .categoriePermisLibelle(i.getCategoriePermis() != null ? i.getCategoriePermis().getLibelle() : null)
                .siteId(i.getSite() != null ? i.getSite().getId() : null)
                .siteNom(i.getSite() != null ? i.getSite().getNom() : null)
                .montantForfait(i.getMontantForfait())
                .totalVerse(i.getTotalVerse())
                .soldeRestant(i.getSoldeRestant())
                .dateCreation(c.getDateCreation())
                .procheExpiration(procheExpiration)
                .joursRestants(joursRestants)
                .etapeParcours(i.getEtapeParcours())
                .codeReussi(passageRepository.existsByInscriptionIdAndTypeEpreuveAndResultat(i.getId(), TypeEpreuve.CODE, ResultatExamen.REUSSI))
                .creneauReussi(passageRepository.existsByInscriptionIdAndTypeEpreuveAndResultat(i.getId(), TypeEpreuve.CRENEAU, ResultatExamen.REUSSI))
                .circulationReussi(passageRepository.existsByInscriptionIdAndTypeEpreuveAndResultat(i.getId(), TypeEpreuve.CIRCULATION, ResultatExamen.REUSSI))
                .build();
    }
}
