package com.autoecole.service;

import com.autoecole.dto.CodeDTOs.*;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.CodeConfiguration;
import com.autoecole.entity.CodeQuestion;
import com.autoecole.entity.CodeReponseTentative;
import com.autoecole.entity.CodeTentative;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.enums.LettreReponse;
import com.autoecole.entity.enums.StatutTentativeCode;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CodeQuestionRepository;
import com.autoecole.repository.CodeReponseTentativeRepository;
import com.autoecole.repository.CodeTentativeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Cœur métier du module Code de la route : progression par Cycle, démarrage/déroulement
 * d'une tentative, chronomètre côté serveur, historique. Un Cycle n'est jamais persisté :
 * c'est une tranche calculée à la volée sur la banque de questions actives, ordonnées et
 * jamais mélangées (cf. §4 du cahier des charges du module).
 */
@Service
@RequiredArgsConstructor
public class CodeService {

    private final CodeConfigurationService configurationService;
    private final CodeQuestionRepository questionRepository;
    private final CodeTentativeRepository tentativeRepository;
    private final CodeReponseTentativeRepository reponseRepository;
    private final InscriptionService inscriptionService;
    private final CandidatAccessService candidatAccessService;
    private final SiteAccessService siteAccessService;

    // ============================= PROGRESSION =============================

    public CodeProgressionDTO getProgression(Long candidatId) {
        verifierAccesCandidat(candidatId);

        CodeConfiguration config = configurationService.getConfigurationEntity();
        List<CodeQuestion> questionsActives = questionRepository.findByActifTrueOrderByOrdreAsc();
        int totalCycles = calculerNombreDeCycles(questionsActives.size(), config.getQuestionsParCycle());

        boolean accesExpire = estAccesExpire(candidatId, config);

        List<CodeCycleStatutDTO> cycles = new ArrayList<>();
        boolean cyclePrecedentReussi = true; // le Cycle 1 est toujours disponible au départ
        int cyclesReussis = 0;

        for (int numero = 1; numero <= totalCycles; numero++) {
            List<CodeTentative> tentatives = tentativeRepository
                    .findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(candidatId, numero);

            boolean reussi = tentatives.stream().anyMatch(t -> t.getStatut() == StatutTentativeCode.REUSSI);
            Integer meilleurScore = tentatives.stream()
                    .filter(t -> t.getStatut() != StatutTentativeCode.EN_COURS)
                    .map(CodeTentative::getScore)
                    .max(Integer::compareTo)
                    .orElse(null);

            StatutCycle statut;
            if (reussi) {
                statut = StatutCycle.REUSSI;
                cyclesReussis++;
            } else if (!config.isDeblocageAutomatiqueCycleSuivant() || cyclePrecedentReussi) {
                statut = tentatives.isEmpty() ? StatutCycle.DISPONIBLE : StatutCycle.ECHEC;
            } else {
                statut = StatutCycle.VERROUILLE;
            }

            int nbQuestionsCycle = Math.min(config.getQuestionsParCycle(),
                    questionsActives.size() - (numero - 1) * config.getQuestionsParCycle());

            cycles.add(CodeCycleStatutDTO.builder()
                    .numeroCycle(numero)
                    .nombreQuestions(nbQuestionsCycle)
                    .statut(statut)
                    .meilleurScore(meilleurScore)
                    .nbTentativesUtilisees(tentatives.size())
                    .tentativesMax(config.getTentativesMax())
                    .build());

            cyclePrecedentReussi = reussi;
        }

        return CodeProgressionDTO.builder()
                .candidatId(candidatId)
                .totalCycles(totalCycles)
                .cyclesReussis(cyclesReussis)
                .pourcentageProgression(totalCycles == 0 ? 0 : (cyclesReussis * 100.0) / totalCycles)
                .accesExpire(accesExpire)
                .cycles(cycles)
                .build();
    }

    public List<CodeHistoriqueLigneDTO> getHistorique(Long candidatId) {
        verifierAccesCandidat(candidatId);
        return tentativeRepository.findByCandidatIdOrderByDateDebutDesc(candidatId).stream()
                .map(t -> CodeHistoriqueLigneDTO.builder()
                        .tentativeId(t.getId())
                        .numeroCycle(t.getNumeroCycle())
                        .numeroTentative(t.getNumeroTentative())
                        .dateDebut(t.getDateDebut())
                        .dateFin(t.getDateFin())
                        .score(t.getScore())
                        .totalQuestions(t.getTotalQuestionsCycle())
                        .statut(t.getStatut())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Un candidat ne peut consulter que son propre dossier (CandidatAccessService). Un moniteur
     * reste soumis à la restriction par site déjà en vigueur (SiteAccessService), ET doit être
     * spécialisé "Code" pour consulter le module Code de la route d'un candidat — même pattern
     * que celui déjà appliqué aux examens (SiteAccessService.verifierAccesEpreuve), réutilisé
     * ici avec TypeEpreuve.CODE. Ce contrôle est volontairement indépendant de l'étape de
     * parcours courante du candidat : le module Code de la route est un outil de révision
     * autonome (cf. Cahier_des_charges_Claude_Code_Module_Code_Auto_Ecole), un moniteur "Code"
     * garde donc accès aux candidats qu'il a suivis même après qu'ils ont avancé vers une étape
     * ultérieure (Créneau, Circulation, Permis obtenu).
     */
    private void verifierAccesCandidat(Long candidatId) {
        candidatAccessService.verifierEstSoiMeme(candidatId);
        inscriptionService.verifierAccesCandidat(candidatId);
        siteAccessService.verifierAccesEpreuve(TypeEpreuve.CODE);
    }

    // ============================= DÉMARRAGE D'UN CYCLE =============================

    @Transactional
    public EtatTentativeDTO demarrerCycle(int numeroCycle) {
        Candidat candidat = candidatAccessService.getCandidatCourant();
        Long candidatId = candidat.getId();

        Inscription inscription = inscriptionService.getInscriptionActive(candidatId);
        if (LocalDate.now().isAfter(inscription.getDateEcheance())) {
            throw new BadRequestException("Votre inscription a expiré : le module Code n'est plus accessible pour ce cycle de formation");
        }

        CodeConfiguration config = configurationService.getConfigurationEntity();
        if (estAccesExpire(candidatId, config)) {
            throw new BadRequestException("L'accès au module Code de la route a expiré");
        }

        List<CodeQuestion> questionsActives = questionRepository.findByActifTrueOrderByOrdreAsc();
        int totalCycles = calculerNombreDeCycles(questionsActives.size(), config.getQuestionsParCycle());
        if (numeroCycle < 1 || numeroCycle > totalCycles) {
            throw new BadRequestException("Cycle invalide");
        }

        if (config.isDeblocageAutomatiqueCycleSuivant() && numeroCycle > 1) {
            boolean cyclePrecedentReussi = tentativeRepository
                    .existsByCandidatIdAndNumeroCycleAndStatut(candidatId, numeroCycle - 1, StatutTentativeCode.REUSSI);
            if (!cyclePrecedentReussi) {
                throw new BadRequestException("Ce Cycle est verrouillé : réussissez d'abord le Cycle " + (numeroCycle - 1));
            }
        }

        // Reprise d'une tentative déjà en cours (rafraîchissement de page, etc.)
        CodeTentative tentativeEnCours = tentativeRepository
                .findByCandidatIdAndNumeroCycleAndStatut(candidatId, numeroCycle, StatutTentativeCode.EN_COURS)
                .orElse(null);
        if (tentativeEnCours != null) {
            EtatTentativeDTO expire = cloturerSiExpiree(tentativeEnCours);
            if (expire != null) {
                return expire;
            }
            return buildEtatEnCours(tentativeEnCours, questionsActives);
        }

        List<CodeTentative> tentativesPrecedentes = tentativeRepository
                .findByCandidatIdAndNumeroCycleOrderByNumeroTentativeAsc(candidatId, numeroCycle);
        if (tentativesPrecedentes.size() >= config.getTentativesMax()) {
            throw new BadRequestException("Nombre maximum de tentatives atteint pour ce Cycle (" + config.getTentativesMax() + ")");
        }
        if (!tentativesPrecedentes.isEmpty() && !config.isRepriseAutoriseeApresEchec()) {
            boolean dejaReussi = tentativesPrecedentes.stream().anyMatch(t -> t.getStatut() == StatutTentativeCode.REUSSI);
            if (!dejaReussi) {
                throw new BadRequestException("La reprise de ce Cycle après échec n'est pas autorisée");
            }
        }

        List<CodeQuestion> questionsDuCycle = extraireQuestionsDuCycle(questionsActives, numeroCycle, config.getQuestionsParCycle());
        if (questionsDuCycle.isEmpty()) {
            throw new BadRequestException("Aucune question disponible pour ce Cycle");
        }

        LocalDateTime maintenant = LocalDateTime.now();
        CodeTentative tentative = CodeTentative.builder()
                .candidat(candidat)
                .inscription(inscription)
                .numeroCycle(numeroCycle)
                .numeroTentative(tentativesPrecedentes.size() + 1)
                .dateDebut(maintenant)
                .dateAffichageQuestionCourante(maintenant)
                .indexQuestionCourante(0)
                .statut(StatutTentativeCode.EN_COURS)
                .snapQuestionsParCycle(config.getQuestionsParCycle())
                .totalQuestionsCycle(questionsDuCycle.size())
                .snapSeuilReussite(config.getSeuilReussite())
                .snapTempsParQuestionSecondes(config.getTempsParQuestionSecondes())
                .snapDureeMaxCycleSecondes(config.getDureeMaxCycleSecondes())
                .snapTentativesMax(config.getTentativesMax())
                .snapRetourAutorise(config.isRetourQuestionPrecedenteAutorise())
                .snapCorrectionImmediate(config.isCorrectionImmediate())
                .build();

        tentative = tentativeRepository.save(tentative);
        return buildEtatEnCours(tentative, questionsActives);
    }

    // ============================= DÉROULEMENT =============================

    @Transactional
    public EtatTentativeDTO repondre(Long tentativeId, LettreReponse reponseCandidat) {
        CodeTentative tentative = getTentativePossedee(tentativeId);
        if (tentative.getStatut() != StatutTentativeCode.EN_COURS) {
            return etatDepuisTentativeTerminee(tentative);
        }

        EtatTentativeDTO expire = cloturerSiExpiree(tentative);
        if (expire != null) {
            return expire;
        }

        List<CodeQuestion> questionsActives = questionRepository.findByActifTrueOrderByOrdreAsc();
        List<CodeQuestion> questionsDuCycle = extraireQuestionsDuCycle(questionsActives, tentative.getNumeroCycle(), tentative.getSnapQuestionsParCycle());
        if (tentative.getIndexQuestionCourante() >= questionsDuCycle.size()) {
            return finaliser(tentative, false);
        }
        CodeQuestion question = questionsDuCycle.get(tentative.getIndexQuestionCourante());

        LocalDateTime maintenant = LocalDateTime.now();
        long tempsEcouleQuestion = Duration.between(tentative.getDateAffichageQuestionCourante(), maintenant).getSeconds();
        // Le serveur revalide systématiquement le délai : une réponse hors délai est ignorée,
        // même si le client en a transmis une (cf. §18 du cahier des charges du module).
        LettreReponse reponseRetenue = tempsEcouleQuestion > tentative.getSnapTempsParQuestionSecondes() ? null : reponseCandidat;
        boolean correcte = reponseRetenue != null && reponseRetenue == question.getBonneReponse();

        reponseRepository.save(CodeReponseTentative.builder()
                .tentative(tentative)
                .question(question)
                .ordreDansCycle(tentative.getIndexQuestionCourante())
                .reponseDonnee(reponseRetenue)
                .correcte(correcte)
                .tempsReponseSecondes((int) Math.min(tempsEcouleQuestion, tentative.getSnapTempsParQuestionSecondes()))
                .build());

        tentative.setNbBonnesReponses(tentative.getNbBonnesReponses() + (correcte ? 1 : 0));
        tentative.setNbMauvaisesReponses(tentative.getNbMauvaisesReponses() + (correcte ? 0 : 1));
        tentative.setIndexQuestionCourante(tentative.getIndexQuestionCourante() + 1);
        tentative.setDateAffichageQuestionCourante(maintenant);

        // §5/§6 du cahier des charges du module : la correction (correct/incorrect + explication)
        // n'est renvoyée que si la configuration de CETTE tentative (snapshot figé au démarrage,
        // cf. javadoc de CodeTentative) l'autorisait ; jamais avant la réponse, jamais si désactivée.
        CorrectionReponseDTO correction = tentative.isSnapCorrectionImmediate()
                ? CorrectionReponseDTO.builder()
                        .correcte(correcte)
                        .bonneReponse(question.getBonneReponse())
                        .explication(question.getExplication())
                        .build()
                : null;

        if (tentative.getIndexQuestionCourante() >= questionsDuCycle.size()) {
            EtatTentativeDTO resultat = finaliser(tentative, false);
            resultat.setCorrection(correction);
            return resultat;
        }

        tentativeRepository.save(tentative);
        EtatTentativeDTO suite = buildEtatEnCours(tentative, questionsActives);
        suite.setCorrection(correction);
        return suite;
    }

    @Transactional
    public EtatTentativeDTO revenirQuestionPrecedente(Long tentativeId) {
        CodeTentative tentative = getTentativePossedee(tentativeId);
        if (tentative.getStatut() != StatutTentativeCode.EN_COURS) {
            return etatDepuisTentativeTerminee(tentative);
        }
        if (!tentative.isSnapRetourAutorise()) {
            throw new BadRequestException("Le retour à la question précédente n'est pas autorisé pour cette tentative");
        }
        if (tentative.getIndexQuestionCourante() <= 0) {
            throw new BadRequestException("Il n'y a pas de question précédente");
        }

        EtatTentativeDTO expire = cloturerSiExpiree(tentative);
        if (expire != null) {
            return expire;
        }

        int ordrePrecedent = tentative.getIndexQuestionCourante() - 1;
        reponseRepository.findByTentativeIdAndOrdreDansCycle(tentativeId, ordrePrecedent).ifPresent(reponse -> {
            if (reponse.isCorrecte()) {
                tentative.setNbBonnesReponses(Math.max(0, tentative.getNbBonnesReponses() - 1));
            } else {
                tentative.setNbMauvaisesReponses(Math.max(0, tentative.getNbMauvaisesReponses() - 1));
            }
        });
        reponseRepository.deleteByTentativeIdAndOrdreDansCycle(tentativeId, ordrePrecedent);

        tentative.setIndexQuestionCourante(ordrePrecedent);
        tentative.setDateAffichageQuestionCourante(LocalDateTime.now());
        tentativeRepository.save(tentative);

        return buildEtatEnCours(tentative, questionRepository.findByActifTrueOrderByOrdreAsc());
    }

    @Transactional
    public EtatTentativeDTO terminerTentative(Long tentativeId) {
        CodeTentative tentative = getTentativePossedee(tentativeId);
        if (tentative.getStatut() != StatutTentativeCode.EN_COURS) {
            return etatDepuisTentativeTerminee(tentative);
        }
        EtatTentativeDTO expire = cloturerSiExpiree(tentative);
        if (expire != null) {
            return expire;
        }
        return finaliser(tentative, false);
    }

    public EtatTentativeDTO getEtatTentative(Long tentativeId) {
        CodeTentative tentative = getTentativePossedee(tentativeId);
        if (tentative.getStatut() != StatutTentativeCode.EN_COURS) {
            return etatDepuisTentativeTerminee(tentative);
        }
        EtatTentativeDTO expire = cloturerSiExpiree(tentative);
        if (expire != null) {
            return expire;
        }
        return buildEtatEnCours(tentative, questionRepository.findByActifTrueOrderByOrdreAsc());
    }

    // ============================= UTILITAIRES INTERNES =============================

    private CodeTentative getTentativePossedee(Long tentativeId) {
        CodeTentative tentative = tentativeRepository.findById(tentativeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tentative introuvable"));
        candidatAccessService.verifierEstSoiMeme(tentative.getCandidat().getId());
        return tentative;
    }

    /** Ferme automatiquement une tentative EN_COURS dont la durée maximale du Cycle est
     *  dépassée (contrôle serveur du chronomètre, cf. §6/§18 du cahier des charges du module).
     *  Renvoie le résultat si la tentative vient d'être close, sinon null. */
    private EtatTentativeDTO cloturerSiExpiree(CodeTentative tentative) {
        long tempsEcouleCycle = Duration.between(tentative.getDateDebut(), LocalDateTime.now()).getSeconds();
        if (tempsEcouleCycle > tentative.getSnapDureeMaxCycleSecondes()) {
            return finaliser(tentative, true);
        }
        return null;
    }

    private EtatTentativeDTO finaliser(CodeTentative tentative, boolean parExpiration) {
        tentative.setScore(tentative.getNbBonnesReponses());
        tentative.setDateFin(LocalDateTime.now());
        tentative.setStatut(parExpiration
                ? StatutTentativeCode.EXPIREE
                : (tentative.getScore() >= tentative.getSnapSeuilReussite() ? StatutTentativeCode.REUSSI : StatutTentativeCode.ECHEC));
        tentativeRepository.save(tentative);
        return etatDepuisTentativeTerminee(tentative);
    }

    private EtatTentativeDTO etatDepuisTentativeTerminee(CodeTentative tentative) {
        boolean reussi = tentative.getStatut() == StatutTentativeCode.REUSSI;
        long dejaUtilisees = tentativeRepository.countByCandidatIdAndNumeroCycle(tentative.getCandidat().getId(), tentative.getNumeroCycle());
        return EtatTentativeDTO.builder()
                .resultat(CodeResultatTentativeDTO.builder()
                        .tentativeId(tentative.getId())
                        .numeroCycle(tentative.getNumeroCycle())
                        .score(tentative.getScore())
                        .totalQuestions(tentative.getTotalQuestionsCycle())
                        .seuilReussite(tentative.getSnapSeuilReussite())
                        .statut(tentative.getStatut())
                        .reussi(reussi)
                        .cycleSuivantDebloque(reussi)
                        .peutReprendre(!reussi && dejaUtilisees < tentative.getSnapTentativesMax())
                        .build())
                .build();
    }

    private EtatTentativeDTO buildEtatEnCours(CodeTentative tentative, List<CodeQuestion> questionsActives) {
        List<CodeQuestion> questionsDuCycle = extraireQuestionsDuCycle(questionsActives, tentative.getNumeroCycle(), tentative.getSnapQuestionsParCycle());
        CodeQuestion question = questionsDuCycle.get(tentative.getIndexQuestionCourante());
        return EtatTentativeDTO.builder()
                .enCours(TentativeEnCoursDTO.builder()
                        .tentativeId(tentative.getId())
                        .numeroCycle(tentative.getNumeroCycle())
                        .numeroTentative(tentative.getNumeroTentative())
                        .indexQuestionCourante(tentative.getIndexQuestionCourante())
                        .totalQuestionsDuCycle(questionsDuCycle.size())
                        .question(mapQuestionPourCandidat(question))
                        .tempsParQuestionSecondes(tentative.getSnapTempsParQuestionSecondes())
                        .dureeMaxCycleSecondes(tentative.getSnapDureeMaxCycleSecondes())
                        .dateDebut(tentative.getDateDebut())
                        .dateAffichageQuestionCourante(tentative.getDateAffichageQuestionCourante())
                        .retourAutorise(tentative.isSnapRetourAutorise())
                        .peutRevenirEnArriere(tentative.isSnapRetourAutorise() && tentative.getIndexQuestionCourante() > 0)
                        .build())
                .build();
    }

    private CodeQuestionPourCandidatDTO mapQuestionPourCandidat(CodeQuestion q) {
        return CodeQuestionPourCandidatDTO.builder()
                .id(q.getId())
                .ordre(q.getOrdre())
                .enonce(q.getEnonce())
                .imageData(q.getImageData())
                .reponseA(q.getReponseA())
                .reponseB(q.getReponseB())
                .reponseC(q.getReponseC())
                .reponseD(q.getReponseD())
                .build();
    }

    private List<CodeQuestion> extraireQuestionsDuCycle(List<CodeQuestion> questionsActives, int numeroCycle, int questionsParCycle) {
        int debut = (numeroCycle - 1) * questionsParCycle;
        if (debut >= questionsActives.size()) {
            return List.of();
        }
        int fin = Math.min(numeroCycle * questionsParCycle, questionsActives.size());
        return questionsActives.subList(debut, fin);
    }

    private int calculerNombreDeCycles(int nombreQuestionsActives, int questionsParCycle) {
        if (nombreQuestionsActives == 0 || questionsParCycle <= 0) return 0;
        return (int) Math.ceil((double) nombreQuestionsActives / questionsParCycle);
    }

    /** Distingue explicitement les trois expirations du §14 du cahier des charges du module :
     *  ici, seule celle propre au module Code (indépendante des 8 mois de l'inscription et
     *  du chronomètre d'une tentative). */
    private boolean estAccesExpire(Long candidatId, CodeConfiguration config) {
        if (config.getDureeExpirationAccesJours() == null) return false;
        Inscription inscription = inscriptionService.getInscriptionActive(candidatId);
        LocalDate limite = inscription.getDateInscription().plusDays(config.getDureeExpirationAccesJours());
        return LocalDate.now().isAfter(limite);
    }
}
