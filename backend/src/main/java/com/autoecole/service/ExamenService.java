package com.autoecole.service;

import com.autoecole.dto.ExamenDTOs.*;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.PassageExamen;
import com.autoecole.entity.Site;
import com.autoecole.entity.SessionExamen;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.EtapeParcours;
import com.autoecole.entity.enums.ResultatExamen;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CandidatRepository;
import com.autoecole.repository.InscriptionRepository;
import com.autoecole.repository.PassageExamenRepository;
import com.autoecole.repository.SessionExamenRepository;
import com.autoecole.repository.SiteRepository;
import com.autoecole.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final SiteRepository siteRepository;
    private final AuditService auditService;
    private final SiteAccessService siteAccessService;

    public Page<PassageExamenDTO> filtrerPassages(Long candidatId, TypeEpreuve typeEpreuve, ResultatExamen resultat, LocalDate dateRef, Pageable pageable) {
        if (candidatId != null) {
            inscriptionService.verifierAccesCandidat(candidatId);
        }
        Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        Set<TypeEpreuve> typesAutorises = siteAccessService.resoudreFiltreEpreuvesPourListe();
        if ((siteIds != null && siteIds.isEmpty()) || (typesAutorises != null && typesAutorises.isEmpty())) {
            return Page.empty(pageable);
        }
        // Un candidat déjà reçu à son épreuve n'a plus rien à faire chez ce moniteur : il est
        // masqué de sa liste de travail (mais reste visible pour ADMIN/SECRETAIRE, ainsi que
        // sur la fiche du candidat via son bilan).
        boolean masquerReussi = siteAccessService.estMoniteurRestreint();
        return passageRepository.filtrerPassages(candidatId, typeEpreuve, resultat, dateRef, siteIds, typesAutorises, masquerReussi, pageable)
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

        if (passageRepository.existsByInscriptionIdAndTypeEpreuveAndResultat(inscription.getId(), typeEpreuve, ResultatExamen.PROGRAMME)) {
            throw new BadRequestException("Une session est déjà programmée pour ce candidat sur l'épreuve " + typeEpreuve.name());
        }

        long ajournements = passageRepository.countByInscriptionIdAndTypeEpreuveAndResultat(inscription.getId(), typeEpreuve, ResultatExamen.AJOURNE);
        if (ajournements >= 5) {
            throw new BadRequestException("Nombre maximal de 5 tentatives atteint pour l'épreuve " + typeEpreuve.name());
        }
    }

    /**
     * Résout le site de la session à créer : si l'utilisateur est un ADMIN (ou non restreint
     * par site), il peut choisir n'importe quel site existant. S'il s'agit d'un utilisateur
     * restreint (ex: moniteur), il doit être affecté à ce site.
     */
    private Site resoudreSiteSession(Long siteIdFourni) {
        if (!siteAccessService.estRestreintParSite()) {
            if (siteIdFourni == null) {
                throw new BadRequestException("Veuillez sélectionner un site de formation pour la session");
            }
            return siteRepository.findById(siteIdFourni)
                    .orElseThrow(() -> new ResourceNotFoundException("Site de formation introuvable"));
        }

        Set<Long> sitesAutorises = siteAccessService.getSiteIdsMoniteurCourant();
        Long siteId = siteIdFourni;
        if (siteId == null) {
            if (sitesAutorises.size() == 1) {
                siteId = sitesAutorises.iterator().next();
            } else if (sitesAutorises.isEmpty()) {
                throw new BadRequestException("Aucun site de formation n'est assigné à votre profil moniteur");
            } else {
                throw new BadRequestException("Le site est obligatoire (vous êtes affecté à plusieurs sites)");
            }
        } else if (!sitesAutorises.contains(siteId)) {
            throw new BadRequestException("Vous n'êtes pas affecté à ce site");
        }
        return siteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("Site de formation introuvable"));
    }

    /**
     * Crée l'entité session (le moniteur courant en est propriétaire) sans encore y
     * attacher de candidat. Le champ lieu est autonome (texte libre).
     */
    private SessionExamen creerSessionEntite(TypeEpreuve typeEpreuve, LocalDate datePassage, String lieu, String observations, Long siteId) {
        Utilisateur currentUser = auditService.getCurrentUser();
        Site site = (siteId != null) ? siteRepository.findById(siteId).orElse(null) : null;
        SessionExamen session = SessionExamen.builder()
                .typeEpreuve(typeEpreuve)
                .datePassage(datePassage)
                .lieu(lieu)
                .site(site)
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
     * Empêche toute modification (ajout/retrait de candidat, changement de date/lieu)
     * si la session est TERMINEE (tous les candidats notés).
     * De plus, un moniteur ne peut pas agir sur une session dont la date est passée.
     */
    private void verifierSessionModifiable(SessionExamen session, String action) {
        List<PassageExamen> passages = passageRepository.findBySessionIdOrderByDateEnregistrementAsc(session.getId());
        boolean estTerminee = !passages.isEmpty() && passages.stream().noneMatch(p -> p.getResultat() == ResultatExamen.PROGRAMME);
        if (estTerminee) {
            throw new BadRequestException("Cette session est terminée : elle ne peut plus être modifiée (seules la consultation et la suppression sont autorisées)");
        }

        Utilisateur currentUser = auditService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() != null && currentUser.getRole().getCode() == RoleEnum.MONITEUR) {
            if (session.getDatePassage().isBefore(LocalDate.now())) {
                throw new BadRequestException("Un moniteur ne peut plus " + action + " une fois la date de la session passée");
            }
        }
    }

    private boolean currentUserPeutSupprimerSessionNotee() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("PERM_EXAMENS_SUPPRIMER"));
    }

    @Transactional
    public PassageExamenDTO programmerOuEnregistrerPassage(CreatePassageRequest request) {
        SessionExamen session = creerSessionEntite(request.getTypeEpreuve(), request.getDatePassage(), null, request.getObservations(), request.getSiteId());
        PassageExamen saved = creerPassagePourCandidat(session, request.getCandidatId());
        return mapToDTO(saved);
    }

    @Transactional
    public SessionExamenDTO creerSession(CreatePassageBulkRequest request) {
        SessionExamen session = creerSessionEntite(request.getTypeEpreuve(), request.getDatePassage(), request.getLieu(), request.getObservations(), request.getSiteId());
        if (request.getCandidatIds() != null && !request.getCandidatIds().isEmpty()) {
            request.getCandidatIds().forEach(candidatId -> creerPassagePourCandidat(session, candidatId));
        }
        return mapSessionToDTO(session);
    }

    @Transactional
    public SessionExamenDTO ajouterCandidatsASession(Long sessionId, AjouterCandidatsSessionRequest request) {
        SessionExamen session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'examen introuvable"));
        siteAccessService.verifierAccesEpreuve(session.getTypeEpreuve());
        verifierSessionModifiable(session, "ajouter un candidat");

        if (request.getCandidatIds() == null || request.getCandidatIds().isEmpty()) {
            throw new BadRequestException("Aucun candidat sélectionné");
        }
        request.getCandidatIds().forEach(candidatId -> creerPassagePourCandidat(session, candidatId));
        return mapSessionToDTO(session);
    }

    /**
     * Retire un candidat de sa session : le passage est supprimé et l'étape du candidat
     * revient immédiatement à l'état précédant l'examen, ce qui le rend à nouveau
     * disponible pour une programmation (visible dans l'onglet Candidats).
     */
    @Transactional
    public void retirerCandidatDeSession(Long sessionId, Long passageId) {
        SessionExamen session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'examen introuvable"));
        PassageExamen passage = passageRepository.findBySessionIdAndId(sessionId, passageId)
                .orElseThrow(() -> new ResourceNotFoundException("Ce candidat n'appartient pas à cette session"));
        siteAccessService.verifierAccesEpreuve(session.getTypeEpreuve());
        verifierSessionModifiable(session, "retirer un candidat");

        Inscription inscription = passage.getInscription();
        String numDossier = inscription.getCandidat().getNumeroDossier();

        passageRepository.delete(passage);

        inscription.setEtapeParcours(etapeAvantExamen(session.getTypeEpreuve()));
        inscriptionRepository.save(inscription);

        auditService.logAction("RETRAIT_CANDIDAT_SESSION", "PassageExamen", numDossier,
                "Retrait de la session #" + sessionId + " (" + session.getTypeEpreuve() + ")", null);
    }

    /**
     * Modifie la date et le lieu d'une session : répercutée sur tous ses candidats encore en
     * attente de résultat, pas sur ceux déjà notés.
     */
    @Transactional
    public SessionExamenDTO modifierDateSession(Long sessionId, UpdateSessionRequest request) {
        SessionExamen session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'examen introuvable"));
        siteAccessService.verifierAccesEpreuve(session.getTypeEpreuve());
        verifierSessionModifiable(session, "modifier");

        session.setDatePassage(request.getDatePassage());
        if (request.getLieu() != null) {
            session.setLieu(request.getLieu());
        }
        if (request.getSiteId() != null && !request.getSiteId().equals(session.getSite() != null ? session.getSite().getId() : null)) {
            Site newSite = siteRepository.findById(request.getSiteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Site introuvable"));
            session.setSite(newSite);
        }
        if (request.getObservations() != null) {
            session.setObservations(request.getObservations());
        }
        sessionRepository.save(session);

        List<PassageExamen> candidatsActifs = passageRepository.findBySessionIdOrderByDateEnregistrementAsc(sessionId);
        for (PassageExamen passage : candidatsActifs) {
            if (passage.getResultat() == ResultatExamen.PROGRAMME) {
                passage.setDatePassage(request.getDatePassage());
                passageRepository.save(passage);
            }
        }

        auditService.logAction("MODIFICATION_SESSION", "SessionExamen", sessionId.toString(),
                "Session modifiée (Date: " + request.getDatePassage() + ")", null);

        return mapSessionToDTO(session);
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        SessionExamen session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'examen introuvable"));
        siteAccessService.verifierAccesEpreuve(session.getTypeEpreuve());

        List<PassageExamen> passages = passageRepository.findBySessionIdOrderByDateEnregistrementAsc(sessionId);

        // Si un des candidats a déjà un résultat définitif (REUSSI ou AJOURNE), seule l'autorité
        // EXAMENS_SUPPRIMER (pas la simple gestion de session, accordée par défaut au moniteur)
        // permet la suppression : au-delà, cela reviendrait à effacer un résultat proclamé.
        boolean aResultatsDefinitifs = passages.stream().anyMatch(p -> p.getResultat() != ResultatExamen.PROGRAMME);
        if (aResultatsDefinitifs && !currentUserPeutSupprimerSessionNotee()) {
            throw new BadRequestException("Impossible de supprimer une session dont certains candidats ont déjà un résultat proclamé");
        }

        // Libérer les candidats : remettre leur étape à l'étape préalable à l'examen si nécessaire
        for (PassageExamen p : passages) {
            Inscription inscription = p.getInscription();
            if (inscription != null) {
                // Si le candidat avait validé ou échoué, supprimer la session le replace à l'état de préparation
                inscription.setEtapeParcours(etapeAvantExamen(session.getTypeEpreuve()));
                inscriptionRepository.save(inscription);
            }
            passageRepository.delete(p);
        }

        sessionRepository.delete(session);
        auditService.logAction("SUPPRESSION_SESSION", "SessionExamen", sessionId.toString(),
                "Suppression session " + session.getTypeEpreuve() + " du " + session.getDatePassage(), null);
    }

    public List<SessionExamenDTO> listerSessions() {
        Set<TypeEpreuve> typesAutorises = siteAccessService.resoudreFiltreEpreuvesPourListe();
        if (typesAutorises != null && typesAutorises.isEmpty()) {
            return List.of();
        }
        return sessionRepository.listerSessions(typesAutorises).stream()
                .map(this::mapSessionToDTO)
                .collect(Collectors.toList());
    }

    public SessionExamenDTO getSessionDetail(Long sessionId) {
        SessionExamen session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session d'examen introuvable"));
        siteAccessService.verifierAccesEpreuve(session.getTypeEpreuve());
        return mapSessionToDTO(session);
    }

    private SessionExamenDTO mapSessionToDTO(SessionExamen session) {
        List<PassageExamenDTO> candidats = passageRepository.findBySessionIdOrderByDateEnregistrementAsc(session.getId())
                .stream().map(this::mapToDTO).collect(Collectors.toList());

        LocalDate today = LocalDate.now();
        LocalDate datePassage = session.getDatePassage();
        boolean dateArriveeOuPassee = !datePassage.isAfter(today);

        // Détermination du statut dynamique :
        // 1. TERMINE si candidats non vide et aucun candidat n'est PROGRAMME
        // 2. EN_COURS si datePassage <= today et (pas encore tous notés)
        // 3. PROGRAMME par défaut
        String statut = "PROGRAMME";
        boolean terminee = false;
        if (!candidats.isEmpty() && candidats.stream().noneMatch(c -> c.getResultat() == ResultatExamen.PROGRAMME)) {
            statut = "TERMINE";
            terminee = true;
        } else if (dateArriveeOuPassee) {
            statut = "EN_COURS";
        } else {
            statut = "PROGRAMME";
        }

        return SessionExamenDTO.builder()
                .id(session.getId())
                .typeEpreuve(session.getTypeEpreuve())
                .datePassage(session.getDatePassage())
                .lieu(session.getLieu())
                .siteId(session.getSite() != null ? session.getSite().getId() : null)
                .siteNom(session.getSite() != null ? session.getSite().getNom() : null)
                .moniteurId(session.getMoniteur() != null ? session.getMoniteur().getId() : null)
                .moniteurNomComplet(session.getMoniteur() != null ? session.getMoniteur().getNom() + " " + session.getMoniteur().getPrenom() : null)
                .moniteurSpecialites(session.getMoniteur() != null ? session.getMoniteur().getSpecialites() : null)
                .observations(session.getObservations())
                .datePassee(session.getDatePassage().isBefore(today))
                .terminee(terminee)
                .statut(statut)
                .candidats(candidats)
                .build();
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
        Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        Set<TypeEpreuve> typesAutorises = siteAccessService.resoudreFiltreEpreuvesPourListe();
        if ((siteIds != null && siteIds.isEmpty()) || (typesAutorises != null && typesAutorises.isEmpty())) {
            return List.of();
        }
        boolean masquerReussi = siteAccessService.estMoniteurRestreint();
        return passageRepository.findTop10ByDatePassageGreaterThanEqualOrderByDatePassageAsc(LocalDate.now()).stream()
                .filter(pe -> siteIds == null || (pe.getInscription().getSite() != null && siteIds.contains(pe.getInscription().getSite().getId())))
                .filter(pe -> typesAutorises == null || typesAutorises.contains(pe.getTypeEpreuve()))
                .filter(pe -> !masquerReussi || pe.getResultat() != ResultatExamen.REUSSI)
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Les 3 derniers examens (sessions) créés, tous statuts confondus — utilisé par le
     * widget du tableau de bord, distinct de getProchainsExamens() qui ne montre que les
     * passages à venir non encore joués.
     */
    public List<SessionExamenDTO> getDernieresSessionsCreees() {
        Set<Long> siteIds = siteAccessService.resoudreFiltreSitesPourListe();
        Set<TypeEpreuve> typesAutorises = siteAccessService.resoudreFiltreEpreuvesPourListe();
        if ((siteIds != null && siteIds.isEmpty()) || (typesAutorises != null && typesAutorises.isEmpty())) {
            return List.of();
        }
        return sessionRepository.findTop10ByOrderByDateCreationDesc().stream()
                .filter(s -> siteIds == null || (s.getSite() != null && siteIds.contains(s.getSite().getId())))
                .filter(s -> typesAutorises == null || typesAutorises.contains(s.getTypeEpreuve()))
                .limit(3)
                .map(this::mapSessionToDTO)
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
                .build();
    }
}
