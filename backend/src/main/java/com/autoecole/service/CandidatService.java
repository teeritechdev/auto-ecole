package com.autoecole.service;

import com.autoecole.dto.CandidatDTOs.CandidatDTO;
import com.autoecole.dto.CandidatDTOs.CreateCandidatRequest;
import com.autoecole.dto.CandidatDTOs.IdentifiantsCompteDTO;
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
    private final PassageExamenRepository passageRepository;
    private final AuditService auditService;
    private final SiteAccessService siteAccessService;
    private final CandidatAccessService candidatAccessService;
    private final CandidatAccountService candidatAccountService;
    private final UtilisateurRepository utilisateurRepository;
    private final CodeTentativeRepository tentativeRepository;
    private final CodeReponseTentativeRepository reponseTentativeRepository;
    private final HistoriqueActionRepository historiqueActionRepository;

    public Page<CandidatDTO> rechercherCandidats(String recherche, StatutDossier statut, Long categorieId, StatutInscription statutInscription, boolean ignoreEtapeFilter, Long siteFiltreId, com.autoecole.entity.enums.EtapeParcours etapeFiltre, Boolean priseEnChargeExamens, java.time.LocalDate dateExamenProgramme, Pageable pageable) {
        java.util.Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        java.util.Set<com.autoecole.entity.enums.EtapeParcours> etapesAutorisees = ignoreEtapeFilter ? null : siteAccessService.resoudreFiltreEtapesPourListe();

        // Si ignoreEtapeFilter est true, on vérifie quand même si l'utilisateur est un moniteur.
        // Un moniteur spécialisé Code peut voir les candidats au-delà de l'étape Code.
        // Mais un moniteur spécialisé UNIQUEMENT Créneau ne devrait pas voir le module Code...
        // Toutefois, le frontend n'appelle avec ignoreEtapeFilter=true que sur la page CodeResultats
        // qui est elle-même protégée par le routing. Et on garde la restriction par site !
        if (ignoreEtapeFilter) {
            // S'assurer que le moniteur a bien la spécialité requise pour ignorer le filtre
            // (ici la logique spécifique pour le module Code : il DOIT avoir la spécialité CODE)
            if (siteAccessService.estMoniteurRestreint()) {
                siteAccessService.verifierAccesEpreuve(com.autoecole.entity.enums.TypeEpreuve.CODE);
            }
        }

        if ((siteIds != null && siteIds.isEmpty()) || (etapesAutorisees != null && etapesAutorisees.isEmpty() && !ignoreEtapeFilter)) {
            return Page.empty(pageable);
        }
        return candidatRepository.rechercherCandidats(recherche, statut, categorieId, siteIds, statutInscription, etapesAutorisees, siteFiltreId, etapeFiltre, priseEnChargeExamens, dateExamenProgramme, pageable)
                .map(this::mapToDTO);
    }

    /** Statistiques homme/femme (globales + par site), calculées sur exactement le même
     *  sous-ensemble filtré (mêmes paramètres) et avec la même restriction d'accès par site
     *  que {@link #rechercherCandidats}, pour qu'elles suivent les filtres actifs de la page. */
    public com.autoecole.dto.CandidatDTOs.CandidatStatistiquesDTO getStatistiques(String recherche, StatutDossier statut, Long categorieId, StatutInscription statutInscription, boolean ignoreEtapeFilter, Long siteFiltreId, com.autoecole.entity.enums.EtapeParcours etapeFiltre, Boolean priseEnChargeExamens, java.time.LocalDate dateExamenProgramme) {
        java.util.Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        java.util.Set<com.autoecole.entity.enums.EtapeParcours> etapesAutorisees = ignoreEtapeFilter ? null : siteAccessService.resoudreFiltreEtapesPourListe();

        if (ignoreEtapeFilter) {
            if (siteAccessService.estMoniteurRestreint()) {
                siteAccessService.verifierAccesEpreuve(com.autoecole.entity.enums.TypeEpreuve.CODE);
            }
        }

        if ((siteIds != null && siteIds.isEmpty()) || (etapesAutorisees != null && etapesAutorisees.isEmpty() && !ignoreEtapeFilter)) {
            return com.autoecole.dto.CandidatDTOs.CandidatStatistiquesDTO.builder()
                    .totalHommes(0).totalFemmes(0).totalNonRenseigne(0)
                    .totalSoldes(0).totalNonSoldes(0).totalEnCours(0).totalExpiresNonSoldes(0)
                    .parSite(List.of()).build();
        }

        List<Object[]> rows = candidatRepository.statistiquesParSiteEtSexe(recherche, statut, categorieId, siteIds, statutInscription, etapesAutorisees, siteFiltreId, etapeFiltre, priseEnChargeExamens, dateExamenProgramme);

        java.util.Map<Long, String> nomsParSite = new java.util.LinkedHashMap<>();
        java.util.Map<Long, long[]> comptageParSite = new java.util.LinkedHashMap<>(); // [hommes, femmes, nonRenseigne, soldes, enCours, expiresNonSoldes, nonSoldes]
        long totalHommes = 0, totalFemmes = 0, totalNonRenseigne = 0;
        long totalSoldes = 0, totalEnCours = 0, totalExpiresNonSoldes = 0, totalNonSoldes = 0;

        for (Object[] row : rows) {
            Long siteId = (Long) row[0];
            String siteNom = (String) row[1];
            Sexe sexe = (Sexe) row[2];
            StatutDossier st = (StatutDossier) row[3];
            long count = (Long) row[4];

            Long cle = siteId != null ? siteId : -1L;
            nomsParSite.putIfAbsent(cle, siteNom != null ? siteNom : "Sans site");
            long[] compte = comptageParSite.computeIfAbsent(cle, k -> new long[7]);

            if (sexe == Sexe.HOMME) { compte[0] += count; totalHommes += count; }
            else if (sexe == Sexe.FEMME) { compte[1] += count; totalFemmes += count; }
            else { compte[2] += count; totalNonRenseigne += count; }

            if (st == StatutDossier.SOLDE) {
                compte[3] += count;
                totalSoldes += count;
            } else if (st == StatutDossier.EN_COURS) {
                compte[4] += count;
                compte[6] += count;
                totalEnCours += count;
                totalNonSoldes += count;
            } else if (st == StatutDossier.EXPIRE_NON_SOLDE) {
                compte[5] += count;
                compte[6] += count;
                totalExpiresNonSoldes += count;
                totalNonSoldes += count;
            }
        }

        List<com.autoecole.dto.CandidatDTOs.SiteStatSexeDTO> parSite = comptageParSite.entrySet().stream()
                .map(e -> {
                    long[] c = e.getValue();
                    return com.autoecole.dto.CandidatDTOs.SiteStatSexeDTO.builder()
                            .siteId(e.getKey() == -1L ? null : e.getKey())
                            .siteNom(nomsParSite.get(e.getKey()))
                            .hommes(c[0])
                            .femmes(c[1])
                            .nonRenseigne(c[2])
                            .soldes(c[3])
                            .enCours(c[4])
                            .expiresNonSoldes(c[5])
                            .nonSoldes(c[6])
                            .total(c[0] + c[1] + c[2])
                            .build();
                })
                .sorted(java.util.Comparator.comparing(com.autoecole.dto.CandidatDTOs.SiteStatSexeDTO::getSiteNom))
                .collect(Collectors.toList());

        return com.autoecole.dto.CandidatDTOs.CandidatStatistiquesDTO.builder()
                .totalHommes(totalHommes)
                .totalFemmes(totalFemmes)
                .totalNonRenseigne(totalNonRenseigne)
                .totalSoldes(totalSoldes)
                .totalNonSoldes(totalNonSoldes)
                .totalEnCours(totalEnCours)
                .totalExpiresNonSoldes(totalExpiresNonSoldes)
                .parSite(parSite)
                .build();
    }

    public List<CandidatDTO> getTousLesCandidatsPourRapport(StatutDossier statut, Long categorieId) {
        return candidatRepository.filtrerPourRapport(statut, categorieId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CandidatDTO getCandidatById(Long id) {
        candidatAccessService.verifierEstSoiMeme(id);
        Candidat c = candidatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouvé avec l'id: " + id));
        inscriptionService.verifierAccesCandidat(c.getId());
        return mapToDTO(c);
    }

    /** Cf. CandidatAccountService.reinitialiserMotDePasse : l'administrateur récupère un
     *  nouveau mot de passe temporaire à communiquer lui-même au candidat qui l'a oublié. */
    @Transactional
    public IdentifiantsCompteDTO resetPasswordCompte(Long id) {
        Candidat c = candidatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouvé avec l'id: " + id));
        return candidatAccountService.reinitialiserMotDePasse(c);
    }

    public CandidatDTO getCandidatByNumeroDossier(String numeroDossier) {
        Candidat c = candidatRepository.findByNumeroDossier(numeroDossier)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouvé avec le numéro de dossier: " + numeroDossier));
        candidatAccessService.verifierEstSoiMeme(c.getId());
        inscriptionService.verifierAccesCandidat(c.getId());
        return mapToDTO(c);
    }

    @Transactional
    public CandidatDTO createCandidat(CreateCandidatRequest request) {
        CategoriePermis categorie = categorieRepository.findById(request.getCategoriePermisId())
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie de permis introuvable"));

        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site de formation introuvable"));
        siteAccessService.verifierSiteAutorise(site.getId());

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
                .sexe(request.getSexe())
                .telephone(request.getTelephone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null)
                .contactsUrgence(request.getContactsUrgence())
                .dateReceptionDossier(request.getDateReceptionDossier())
                .dateDepotDossier(request.getDateDepotDossier())
                .build();

        Candidat savedCandidat = candidatRepository.save(candidat);

        BigDecimal totalVerse = (premierVersement != null) ? premierVersement : BigDecimal.ZERO;
        Inscription inscription = inscriptionService.creerInscriptionInitiale(savedCandidat, categorie, site, dateInsc, request.getMontant(), totalVerse, request.getStatutInscription(), request.isPriseEnChargeExamens(), request.getFraisExamen(), request.getEtapeParcours());

        enregistrerPremierVersementSiFourni(savedCandidat, inscription, premierVersement, request.getModeReglementPremierVersement());

        // RG-CAND-01 : la première inscription validée d'un candidat crée automatiquement
        // son compte de connexion (rôle CANDIDAT), réutilisé lors des reprises suivantes.
        IdentifiantsCompteDTO identifiants = candidatAccountService.creerCompteCandidatSiAbsent(savedCandidat);

        auditService.logAction("CREATION_CANDIDAT", "Candidat", savedCandidat.getNumeroDossier(),
                "Inscription du candidat " + savedCandidat.getNom() + " " + savedCandidat.getPrenom() + " pour la catégorie " + categorie.getLibelle(), null);

        CandidatDTO dto = mapToDTO(savedCandidat, inscription);
        dto.setIdentifiantsCompte(identifiants);
        return dto;
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
        siteAccessService.verifierSiteAutorise(site.getId());

        BigDecimal premierVersement = request.getMontantPremierVersement();
        validerPremierVersement(premierVersement);

        BigDecimal totalVerse = (premierVersement != null) ? premierVersement : BigDecimal.ZERO;
        Inscription inscription = inscriptionService.creerNouveauCycle(candidat, categorie, site, request.getDateInscription(), request.getMontant(), totalVerse, request.isPriseEnChargeExamens(), request.getFraisExamen());

        enregistrerPremierVersementSiFourni(candidat, inscription, premierVersement, request.getModeReglementPremierVersement());

        auditService.logAction("REINSCRIPTION_CANDIDAT", "Candidat", candidat.getNumeroDossier(),
                "Nouvelle inscription (cycle " + inscription.getNumeroCycle() + ", redoublant) pour la catégorie " + categorie.getLibelle(), null);

        return mapToDTO(candidat, inscription);
    }

    private void validerPremierVersement(BigDecimal premierVersement) {
        if (premierVersement != null && premierVersement.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Le montant du versement ne peut pas être négatif");
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
                .montant(premierVersement)
                .datePaiement(LocalDateTime.now())
                .modeReglement(modeReglement != null ? modeReglement : ModeReglement.ESPECES)
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

        // Note : les paiements de formation n'alimentent jamais la Caisse & Trésorerie —
        // c'est une caisse de dépenses/recettes diverses totalement autonome (cf. CaisseService),
        // sans aucun lien avec les candidats, les inscriptions ou les paiements.
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
        candidat.setSexe(request.getSexe());
        candidat.setTelephone(request.getTelephone().trim());
        candidat.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
        candidat.setContactsUrgence(request.getContactsUrgence());
        candidat.setDateReceptionDossier(request.getDateReceptionDossier());
        candidat.setDateDepotDossier(request.getDateDepotDossier());

        Candidat updated = candidatRepository.save(candidat);
        Inscription active = inscriptionService.mettreAJourCategorieEtMontant(id, categorie, request.getMontant(), site, request.isPriseEnChargeExamens(), request.getFraisExamen());

        auditService.logAction("MODIFICATION_CANDIDAT", "Candidat", updated.getNumeroDossier(), "Mise à jour fiche candidat", null);

        return mapToDTO(updated, active);
    }

    @Transactional
    public void deleteCandidat(Long id, String motif) {
        Candidat candidat = candidatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat introuvable"));

        String num = candidat.getNumeroDossier();
        String nom = candidat.getNom() + " " + candidat.getPrenom();

        // 1. Supprimer les réponses et les tentatives de code du candidat
        List<CodeTentative> tentatives = tentativeRepository.findByCandidatIdOrderByDateDebutDesc(id);
        for (CodeTentative t : tentatives) {
            reponseTentativeRepository.deleteByTentativeId(t.getId());
        }
        tentativeRepository.deleteAll(tentatives);

        // 2. Traiter les inscriptions du candidat
        List<Inscription> inscriptions = inscriptionRepository.findByCandidatIdOrderByNumeroCycleDesc(id);
        // Défaire les liaisons auto-référentielles (inscription_precedente_id)
        for (Inscription i : inscriptions) {
            if (i.getInscriptionPrecedente() != null) {
                i.setInscriptionPrecedente(null);
                inscriptionRepository.save(i);
            }
        }

        for (Inscription i : inscriptions) {
            // Supprimer les passages d'examen
            passageRepository.deleteByInscriptionId(i.getId());

            // Supprimer les reçus puis les paiements associés
            List<Paiement> paiements = paiementRepository.findByInscriptionIdOrderByDatePaiementDesc(i.getId());
            for (Paiement p : paiements) {
                recuRepository.deleteByPaiementId(p.getId());
            }
            paiementRepository.deleteAll(paiements);
        }
        inscriptionRepository.deleteAll(inscriptions);

        // 3. Supprimer le compte utilisateur lié au candidat s'il existe
        utilisateurRepository.findByCandidatId(id).ifPresent(u -> {
            historiqueActionRepository.deleteByUtilisateurId(u.getId());
            utilisateurRepository.delete(u);
        });

        // 4. Supprimer le dossier candidat lui-même
        candidatRepository.delete(candidat);

        // 5. Tracer l'action dans le journal d'audit
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
                .sexe(c.getSexe())
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
                .priseEnChargeExamens(i.isPriseEnChargeExamens())
                .fraisExamen(i.getFraisExamen())
                .build();
    }
}
