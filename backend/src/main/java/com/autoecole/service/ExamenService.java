package com.autoecole.service;

import com.autoecole.dto.ExamenDTOs.*;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.PassageExamen;
import com.autoecole.entity.SessionExamen;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.EtapeParcours;
import com.autoecole.entity.enums.ResultatExamen;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.entity.enums.StatutValidation;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CandidatRepository;
import com.autoecole.repository.InscriptionRepository;
import com.autoecole.repository.PassageExamenRepository;
import com.autoecole.repository.SessionExamenRepository;
import com.autoecole.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamenService {

    private final PassageExamenRepository passageRepository;
    private final SessionExamenRepository sessionRepository;
    private final CandidatRepository candidatRepository;
    private final InscriptionRepository inscriptionRepository;
    private final InscriptionService inscriptionService;
    private final UtilisateurRepository utilisateurRepository;
    private final AuditService auditService;
    private final SiteAccessService siteAccessService;

    public Page<PassageExamenDTO> filtrerPassages(Long candidatId, TypeEpreuve typeEpreuve, ResultatExamen resultat, LocalDate dateRef, Pageable pageable) {
        if (candidatId != null) {
            inscriptionService.verifierAccesCandidat(candidatId);
        }
        Long siteId = siteAccessService.resoudreFiltreSitePourListe();
        Set<TypeEpreuve> typesAutorises = siteAccessService.resoudreFiltreEpreuvesPourListe();
        if (typesAutorises != null && typesAutorises.isEmpty()) {
            return Page.empty(pageable);
        }
        // Un candidat déjà reçu à son épreuve n'a plus rien à faire chez ce moniteur : il est
        // masqué de sa liste de travail (mais reste visible pour ADMIN/SECRETAIRE, ainsi que
        // sur la fiche du candidat via son bilan).
        boolean masquerReussi = siteAccessService.estMoniteurRestreint();
        return passageRepository.filtrerPassages(candidatId, typeEpreuve, resultat, dateRef, siteId, typesAutorises, masquerReussi, pageable)
                .map(this::mapToDTO);
    }

    public List<PassageExamenDTO> getPassagesByCandidat(Long candidatId) {
        inscriptionService.verifierAccesCandidat(candidatId);
        return passageRepository.findByCandidatIdOrderByTypeEpreuveAscNumeroPassageAsc(candidatId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public BilanExamensCandidatDTO getBilanExamensCandidat(Long candidatId) {
        inscriptionService.verifierAccesCandidat(candidatId);
        Candidat c = candidatRepository.findById(candidatId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat introuvable"));

        List<PassageExamenDTO> passagesCode = passageRepository
                .findByCandidatIdAndTypeEpreuveOrderByNumeroPassageAsc(candidatId, TypeEpreuve.CODE)
                .stream().map(this::mapToDTO).collect(Collectors.toList());

        List<PassageExamenDTO> passagesCreneau = passageRepository
                .findByCandidatIdAndTypeEpreuveOrderByNumeroPassageAsc(candidatId, TypeEpreuve.CRENEAU)
                .stream().map(this::mapToDTO).collect(Collectors.toList());

        List<PassageExamenDTO> passagesCirculation = passageRepository
                .findByCandidatIdAndTypeEpreuveOrderByNumeroPassageAsc(candidatId, TypeEpreuve.CIRCULATION)
                .stream().map(this::mapToDTO).collect(Collectors.toList());

        boolean codeReussi = passagesCode.stream().anyMatch(p -> p.getResultat() == ResultatExamen.REUSSI);
        boolean creneauReussi = passagesCreneau.stream().anyMatch(p -> p.getResultat() == ResultatExamen.REUSSI);
        boolean circulationReussi = passagesCirculation.stream().anyMatch(p -> p.getResultat() == ResultatExamen.REUSSI);

        return BilanExamensCandidatDTO.builder()
                .candidatId(c.getId())
                .candidatNumeroDossier(c.getNumeroDossier())
                .candidatNomComplet(c.getNom() + " " + c.getPrenom())
                .passagesCode(passagesCode)
                .passagesCreneau(passagesCreneau)
                .passagesCirculation(passagesCirculation)
                .codeReussi(codeReussi)
                .creneauReussi(creneauReussi)
                .circulationReussi(circulationReussi)
                .build();
    }

    /**
     * Épreuve devant être réussie avant de pouvoir programmer le type d'épreuve donné
     * (RG : parcours Code -> Créneau -> Circulation). Null pour Code (aucun prérequis).
     */
    private TypeEpreuve prerequisEpreuve(TypeEpreuve typeEpreuve) {
        return switch (typeEpreuve) {
            case CODE -> null;
            case CRENEAU -> TypeEpreuve.CODE;
            case CIRCULATION -> TypeEpreuve.CRENEAU;
        };
    }

    /** Étape du parcours pendant qu'une épreuve est en attente de résultat. */
    private EtapeParcours etapeExamen(TypeEpreuve typeEpreuve) {
        return switch (typeEpreuve) {
            case CODE -> EtapeParcours.EXAMEN_CODE;
            case CRENEAU -> EtapeParcours.EXAMEN_CRENEAU;
            case CIRCULATION -> EtapeParcours.EXAMEN_CIRCULATION;
        };
    }

    /** Étape à laquelle revenir en cas d'échec (ou de retrait) de cette épreuve. */
    private EtapeParcours etapeAvantExamen(TypeEpreuve typeEpreuve) {
        return switch (typeEpreuve) {
            case CODE -> EtapeParcours.CODE;
            case CRENEAU -> EtapeParcours.CRENEAU;
            case CIRCULATION -> EtapeParcours.CIRCULATION;
        };
    }

    /** Étape suivante une fois cette épreuve réussie. */
    private EtapeParcours etapeApresReussite(TypeEpreuve typeEpreuve) {
        return switch (typeEpreuve) {
            case CODE -> EtapeParcours.CRENEAU;
            case CRENEAU -> EtapeParcours.CIRCULATION;
            case CIRCULATION -> EtapeParcours.PERMIS_OBTENU;
        };
    }

    /**
     * Vérifie, avant toute programmation, que : l'épreuve précédente du parcours est déjà
     * réussie (le cas échéant), que cette épreuve n'est pas déjà réussie ou déjà programmée
     * (en attente) pour ce candidat, et que le nombre maximal de 5 échecs n'est pas atteint.
     */
    private void verifierPrerequisEtEligibilite(Inscription inscription, TypeEpreuve typeEpreuve) {
        TypeEpreuve prerequis = prerequisEpreuve(typeEpreuve);
        if (prerequis != null && !passageRepository.existsByInscriptionIdAndTypeEpreuveAndResultat(inscription.getId(), prerequis, ResultatExamen.REUSSI)) {
            throw new BadRequestException("Le candidat doit d'abord réussir l'épreuve " + prerequis.name() + " avant de programmer " + typeEpreuve.name());
        }

        if (passageRepository.existsByInscriptionIdAndTypeEpreuveAndResultat(inscription.getId(), typeEpreuve, ResultatExamen.REUSSI)) {
            throw new BadRequestException("Le candidat a déjà réussi l'épreuve " + typeEpreuve.name());
        }

        // Un passage PROGRAMME retiré (RETIRE) ne bloque plus une nouvelle programmation :
        // c'est précisément le but du retrait, permettre de reprogrammer autrement.
        if (passageRepository.existsByInscriptionIdAndTypeEpreuveAndResultatAndStatutValidationNot(
                inscription.getId(), typeEpreuve, ResultatExamen.PROGRAMME, StatutValidation.RETIRE)) {
            throw new BadRequestException("Une session est déjà programmée pour ce candidat sur l'épreuve " + typeEpreuve.name());
        }

        long ajournements = passageRepository.countByInscriptionIdAndTypeEpreuveAndResultat(inscription.getId(), typeEpreuve, ResultatExamen.AJOURNE);
        if (ajournements >= 5) {
            throw new BadRequestException("Nombre maximal de 5 tentatives atteint pour l'épreuve " + typeEpreuve.name());
        }
    }

    /**
     * Crée l'entité session (le moniteur courant en est propriétaire) sans encore y
     * attacher de candidat.
     */
    private SessionExamen creerSessionEntite(TypeEpreuve typeEpreuve, LocalDate datePassage, String observations) {
        Utilisateur currentUser = auditService.getCurrentUser();
        SessionExamen session = SessionExamen.builder()
                .typeEpreuve(typeEpreuve)
                .datePassage(datePassage)
                .site(currentUser != null ? currentUser.getSite() : null)
                .moniteur(currentUser)
                .observations(observations)
                .build();
        return sessionRepository.save(session);
    }

    /**
     * Vérifie l'éligibilité du candidat puis crée son passage, rattaché à la session
     * donnée (numérotation de tentative inchangée : indépendante du regroupement en session).
     */
    private PassageExamen creerPassagePourCandidat(SessionExamen session, Long candidatId) {
        inscriptionService.verifierAccesCandidat(candidatId);
        Inscription inscription = inscriptionService.getInscriptionActive(candidatId);
        verifierPrerequisEtEligibilite(inscription, session.getTypeEpreuve());

        long count = passageRepository.countByInscriptionIdAndTypeEpreuve(inscription.getId(), session.getTypeEpreuve());
        int numeroPassage = (int) (count + 1);

        PassageExamen passage = PassageExamen.builder()
                .inscription(inscription)
                .session(session)
                .typeEpreuve(session.getTypeEpreuve())
                .numeroPassage(numeroPassage)
                .datePassage(session.getDatePassage())
                .resultat(ResultatExamen.PROGRAMME)
                .observations(session.getObservations())
                .moniteur(session.getMoniteur())
                .statutValidation(StatutValidation.EN_ATTENTE)
                .dateEnregistrement(LocalDateTime.now())
                .build();

        PassageExamen saved = passageRepository.save(passage);

        inscription.setEtapeParcours(etapeExamen(session.getTypeEpreuve()));
        inscriptionRepository.save(inscription);

        auditService.logAction("ENREGISTREMENT_EXAMEN", "PassageExamen", inscription.getCandidat().getNumeroDossier(),
                "Session #" + session.getId() + " - " + session.getTypeEpreuve() + " du " + session.getDatePassage(), null);
        return saved;
    }

    /**
     * Empêche un moniteur d'agir (ajouter/retirer un candidat) sur une session dont la
     * date est déjà passée ; l'administrateur n'a pas cette restriction.
     */
    private void verifierSessionModifiable(SessionExamen session, String action) {
        Utilisateur currentUser = auditService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() != null && currentUser.getRole().getCode() == RoleEnum.MONITEUR) {
            if (session.getDatePassage().isBefore(LocalDate.now())) {
                throw new BadRequestException("Un moniteur ne peut plus " + action + " une fois la date de la session passée");
            }
        }
    }

    @Transactional
    public PassageExamenDTO programmerOuEnregistrerPassage(CreatePassageRequest request) {
        SessionExamen session = creerSessionEntite(request.getTypeEpreuve(), request.getDatePassage(), request.getObservations());
        PassageExamen saved = creerPassagePourCandidat(session, request.getCandidatId());
        return mapToDTO(saved);
    }

    @Transactional
    public SessionExamenDTO creerSession(CreatePassageBulkRequest request) {
        if (request.getCandidatIds() == null || request.getCandidatIds().isEmpty()) {
            throw new BadRequestException("Aucun candidat sélectionné");
        }
        SessionExamen session = creerSessionEntite(request.getTypeEpreuve(), request.getDatePassage(), request.getObservations());
        request.getCandidatIds().forEach(candidatId -> creerPassagePourCandidat(session, candidatId));
        return mapSessionToDTO(session);
    }

    @Transactional
    public SessionExamenDTO ajouterCandidatsASession(Long sessionId, AjouterCandidatsSessionRequest request) {
        SessionExamen session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'examen introuvable"));
        siteAccessService.verifierAccesEpreuve(session.getTypeEpreuve());
        siteAccessService.verifierAccesSite(session.getSite() != null ? session.getSite().getId() : null);
        verifierSessionModifiable(session, "ajouter un candidat");

        if (request.getCandidatIds() == null || request.getCandidatIds().isEmpty()) {
            throw new BadRequestException("Aucun candidat sélectionné");
        }
        request.getCandidatIds().forEach(candidatId -> creerPassagePourCandidat(session, candidatId));
        return mapSessionToDTO(session);
    }

    /**
     * Retire un candidat de sa session : le passage n'est PAS supprimé mais marqué
     * RETIRE, afin de rester visible (et reprogrammable) côté moniteur, même s'il
     * disparaît de la session pour tout le monde (cf. carte dédiée "à reprogrammer").
     */
    @Transactional
    public void retirerCandidatDeSession(Long sessionId, Long passageId) {
        SessionExamen session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'examen introuvable"));
        PassageExamen passage = passageRepository.findBySessionIdAndId(sessionId, passageId)
                .orElseThrow(() -> new ResourceNotFoundException("Ce candidat n'appartient pas à cette session"));
        siteAccessService.verifierAccesEpreuve(session.getTypeEpreuve());
        siteAccessService.verifierAccesSite(session.getSite() != null ? session.getSite().getId() : null);
        verifierSessionModifiable(session, "retirer un candidat");

        Inscription inscription = passage.getInscription();
        String numDossier = inscription.getCandidat().getNumeroDossier();

        passage.setStatutValidation(StatutValidation.RETIRE);
        passageRepository.save(passage);

        inscription.setEtapeParcours(etapeAvantExamen(session.getTypeEpreuve()));
        inscriptionRepository.save(inscription);

        auditService.logAction("RETRAIT_CANDIDAT_SESSION", "PassageExamen", numDossier,
                "Retrait de la session #" + sessionId + " (" + session.getTypeEpreuve() + ")", null);
    }

    /**
     * Modifie la date d'une session : répercutée sur tous ses candidats encore actifs
     * (en attente), pas sur ceux déjà notés ou retirés.
     */
    @Transactional
    public SessionExamenDTO modifierDateSession(Long sessionId, UpdateSessionRequest request) {
        SessionExamen session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'examen introuvable"));
        siteAccessService.verifierAccesEpreuve(session.getTypeEpreuve());
        siteAccessService.verifierAccesSite(session.getSite() != null ? session.getSite().getId() : null);
        verifierSessionModifiable(session, "modifier la date de");

        session.setDatePassage(request.getDatePassage());
        sessionRepository.save(session);

        List<PassageExamen> candidatsActifs = passageRepository.findBySessionIdAndStatutValidationNotOrderByDateEnregistrementAsc(sessionId, StatutValidation.RETIRE);
        for (PassageExamen passage : candidatsActifs) {
            if (passage.getResultat() == ResultatExamen.PROGRAMME) {
                passage.setDatePassage(request.getDatePassage());
                passageRepository.save(passage);
            }
        }

        auditService.logAction("MODIFICATION_SESSION", "SessionExamen", sessionId.toString(),
                "Date de la session déplacée au " + request.getDatePassage(), null);

        return mapSessionToDTO(session);
    }

    public List<SessionExamenDTO> listerSessions() {
        Long siteId = siteAccessService.resoudreFiltreSitePourListe();
        Set<TypeEpreuve> typesAutorises = siteAccessService.resoudreFiltreEpreuvesPourListe();
        if (typesAutorises != null && typesAutorises.isEmpty()) {
            return List.of();
        }
        return sessionRepository.listerSessions(siteId, typesAutorises).stream()
                .map(this::mapSessionToDTO)
                .collect(Collectors.toList());
    }

    public SessionExamenDTO getSessionDetail(Long sessionId) {
        SessionExamen session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'examen introuvable"));
        siteAccessService.verifierAccesEpreuve(session.getTypeEpreuve());
        siteAccessService.verifierAccesSite(session.getSite() != null ? session.getSite().getId() : null);
        return mapSessionToDTO(session);
    }

    private SessionExamenDTO mapSessionToDTO(SessionExamen session) {
        List<PassageExamenDTO> candidats = passageRepository.findBySessionIdAndStatutValidationNotOrderByDateEnregistrementAsc(session.getId(), StatutValidation.RETIRE)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
        // Terminée dès que tous les candidats actifs de la session ont reçu un résultat
        // définitif (plus aucun en attente) ; en cours tant qu'il en reste au moins un,
        // que la date soit passée ou non.
        boolean terminee = candidats.stream().noneMatch(c -> c.getResultat() == ResultatExamen.PROGRAMME);
        return SessionExamenDTO.builder()
                .id(session.getId())
                .typeEpreuve(session.getTypeEpreuve())
                .datePassage(session.getDatePassage())
                .siteId(session.getSite() != null ? session.getSite().getId() : null)
                .siteNom(session.getSite() != null ? session.getSite().getNom() : null)
                .moniteurId(session.getMoniteur() != null ? session.getMoniteur().getId() : null)
                .moniteurNomComplet(session.getMoniteur() != null ? session.getMoniteur().getNom() + " " + session.getMoniteur().getPrenom() : null)
                .moniteurSpecialites(session.getMoniteur() != null ? session.getMoniteur().getSpecialites() : null)
                .observations(session.getObservations())
                .datePassee(session.getDatePassage().isBefore(LocalDate.now()))
                .terminee(terminee)
                .candidats(candidats)
                .build();
    }

    /** Candidats retirés d'une session (par l'admin ou le moniteur), à reprogrammer —
     *  visible côté moniteur, filtré par son site et sa/ses spécialité(s) comme le reste. */
    public List<PassageExamenDTO> listerRetires() {
        Long siteId = siteAccessService.resoudreFiltreSitePourListe();
        Set<TypeEpreuve> typesAutorises = siteAccessService.resoudreFiltreEpreuvesPourListe();
        if (typesAutorises != null && typesAutorises.isEmpty()) {
            return List.of();
        }
        return passageRepository.findRetires(siteId, typesAutorises).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<PassageExamenDTO> validerPassages(List<Long> passageIds) {
        if (passageIds == null || passageIds.isEmpty()) {
            throw new BadRequestException("Sélectionnez au moins un candidat");
        }

        List<PassageExamenDTO> result = passageIds.stream()
                .map(id -> passageRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Passage d'examen introuvable")))
                .filter(passage -> passage.getResultat() == ResultatExamen.PROGRAMME && passage.getStatutValidation() == StatutValidation.EN_ATTENTE)
                .peek(passage -> passage.setStatutValidation(StatutValidation.VALIDE))
                .map(passageRepository::save)
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        auditService.logAction("VALIDATION_EXAMENS", "PassageExamen", passageIds.toString(),
                result.size() + " candidat(s) validé(s) par l'administrateur", null);
        return result;
    }

    @Transactional
    public PassageExamenDTO updateResultatPassage(Long passageId, UpdatePassageRequest request) {
        PassageExamen passage = passageRepository.findById(passageId)
                .orElseThrow(() -> new ResourceNotFoundException("Passage d'examen introuvable"));
        inscriptionService.verifierAccesCandidat(passage.getInscription().getCandidat().getId());
        siteAccessService.verifierAccesEpreuve(passage.getTypeEpreuve());

        // Noter (enregistrer un résultat définitif) n'a de sens qu'une fois la date de
        // l'examen arrivée — règle valable pour tous les rôles, pas seulement le moniteur.
        if (request.getResultat() != ResultatExamen.PROGRAMME && request.getDatePassage().isAfter(LocalDate.now())) {
            throw new BadRequestException("Impossible de noter un examen dont la date n'est pas encore arrivée");
        }

        passage.setDatePassage(request.getDatePassage());
        passage.setResultat(request.getResultat());
        passage.setObservations(request.getObservations());

        PassageExamen updated = passageRepository.save(passage);

        // La proclamation fait avancer (réussi) ou reculer (échec/ajourné) l'étape du
        // parcours du candidat ; tant que le résultat reste "en attente", rien ne change.
        Inscription inscription = passage.getInscription();
        if (request.getResultat() == ResultatExamen.REUSSI) {
            inscription.setEtapeParcours(etapeApresReussite(passage.getTypeEpreuve()));
            inscriptionRepository.save(inscription);
        } else if (request.getResultat() != ResultatExamen.PROGRAMME) {
            inscription.setEtapeParcours(etapeAvantExamen(passage.getTypeEpreuve()));
            inscriptionRepository.save(inscription);
        }

        auditService.logAction("MAJ_RESULTAT_EXAMEN", "PassageExamen", passage.getInscription().getCandidat().getNumeroDossier(),
                "Mise à jour passage " + passage.getNumeroPassage() + " (" + passage.getTypeEpreuve() + ") -> " + request.getResultat(), null);

        return mapToDTO(updated);
    }

    @Transactional
    public void deletePassage(Long passageId) {
        PassageExamen passage = passageRepository.findById(passageId)
                .orElseThrow(() -> new ResourceNotFoundException("Passage d'examen introuvable"));
        siteAccessService.verifierAccesEpreuve(passage.getTypeEpreuve());

        Utilisateur currentUser = auditService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() != null && currentUser.getRole().getCode() == RoleEnum.MONITEUR) {
            // Un moniteur ne peut supprimer définitivement qu'une entrée déjà retirée
            // (celles de sa carte "à reprogrammer") ; pour le reste, seul l'admin peut.
            if (passage.getStatutValidation() != StatutValidation.RETIRE) {
                throw new BadRequestException("Un moniteur ne peut supprimer qu'un candidat déjà retiré, en attente de reprogrammation");
            }
        }

        Inscription inscription = passage.getInscription();
        String numDossier = inscription.getCandidat().getNumeroDossier();
        boolean etaitEnAttente = passage.getResultat() == ResultatExamen.PROGRAMME;
        passageRepository.delete(passage);

        if (etaitEnAttente) {
            inscription.setEtapeParcours(etapeAvantExamen(passage.getTypeEpreuve()));
            inscriptionRepository.save(inscription);
        }

        auditService.logAction("SUPPRESSION_PASSAGE_EXAMEN", "PassageExamen", numDossier,
                "Suppression passage " + passage.getNumeroPassage() + " (" + passage.getTypeEpreuve() + ")", null);
    }

    public List<PassageExamenDTO> getProchainsExamens() {
        Long siteId = siteAccessService.resoudreFiltreSitePourListe();
        Set<TypeEpreuve> typesAutorises = siteAccessService.resoudreFiltreEpreuvesPourListe();
        if (typesAutorises != null && typesAutorises.isEmpty()) {
            return List.of();
        }
        boolean masquerReussi = siteAccessService.estMoniteurRestreint();
        return passageRepository.findTop10ByDatePassageGreaterThanEqualOrderByDatePassageAsc(LocalDate.now()).stream()
                .filter(pe -> siteId == null || (pe.getInscription().getSite() != null && siteId.equals(pe.getInscription().getSite().getId())))
                .filter(pe -> typesAutorises == null || typesAutorises.contains(pe.getTypeEpreuve()))
                .filter(pe -> !masquerReussi || pe.getResultat() != ResultatExamen.REUSSI)
                .filter(pe -> pe.getStatutValidation() != StatutValidation.RETIRE)
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PassageExamenDTO mapToDTO(PassageExamen pe) {
        Candidat candidat = pe.getInscription() != null ? pe.getInscription().getCandidat() : null;
        long nombreEchecs = pe.getInscription() != null
                ? passageRepository.countByInscriptionIdAndTypeEpreuveAndResultat(pe.getInscription().getId(), pe.getTypeEpreuve(), ResultatExamen.AJOURNE)
                : 0;
        return PassageExamenDTO.builder()
                .id(pe.getId())
                .candidatId(candidat != null ? candidat.getId() : null)
                .candidatNumeroDossier(candidat != null ? candidat.getNumeroDossier() : "")
                .candidatNomComplet(candidat != null ? candidat.getNom() + " " + candidat.getPrenom() : "")
                .typeEpreuve(pe.getTypeEpreuve())
                .numeroPassage(pe.getNumeroPassage())
                .nombreEchecs(nombreEchecs)
                .datePassage(pe.getDatePassage())
                .resultat(pe.getResultat())
                .observations(pe.getObservations())
                .moniteurId(pe.getMoniteur() != null ? pe.getMoniteur().getId() : null)
                .moniteurNomComplet(pe.getMoniteur() != null ? pe.getMoniteur().getNom() + " " + pe.getMoniteur().getPrenom() : "")
                .dateEnregistrement(pe.getDateEnregistrement())
                .statutValidation(pe.getStatutValidation())
                .build();
    }
}
