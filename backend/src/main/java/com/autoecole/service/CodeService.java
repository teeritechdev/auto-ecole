package com.autoecole.service;

import com.autoecole.dto.CodeDTOs.*;
import com.autoecole.entity.Candidat;
import com.autoecole.entity.CodeConfiguration;
import com.autoecole.entity.CodeQuestion;
import com.autoecole.entity.CodeReponseTentative;
import com.autoecole.entity.CodeTentative;
import com.autoecole.entity.Inscription;
import com.autoecole.entity.SerieCode;
import com.autoecole.entity.enums.LettreReponse;
import com.autoecole.entity.enums.StatutTentativeCode;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.CodeQuestionRepository;
import com.autoecole.repository.CodeReponseTentativeRepository;
import com.autoecole.repository.CodeTentativeRepository;
import com.autoecole.repository.SerieCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Cœur métier du module Code de la route : progression par Série, démarrage/déroulement
 * d'une tentative, chronomètre côté serveur, historique. Une Série est créée librement par
 * l'ADMIN (cf. CodeSerieService) avec ses propres questions assignées, jamais mélangées
 * (cf. §4 du cahier des charges du module).
 */
@Service
@RequiredArgsConstructor
public class CodeService {

    private final CodeConfigurationService configurationService;
    private final CodeQuestionRepository questionRepository;
    private final SerieCodeRepository serieRepository;
    private final CodeTentativeRepository tentativeRepository;
    private final CodeReponseTentativeRepository reponseRepository;
    private final InscriptionService inscriptionService;
    private final CandidatAccessService candidatAccessService;
    private final SiteAccessService siteAccessService;

    // ============================= PROGRESSION =============================

    @Transactional(readOnly = true)
    public CodeProgressionDTO getProgression(Long candidatId) {
        verifierAccesCandidat(candidatId);

        CodeConfiguration config = configurationService.getConfigurationEntity();
        List<SerieCode> series = serieRepository.findByActifTrueOrderByOrdreAsc();
        boolean accesExpire = estAccesExpire(candidatId, config);

        List<CodeSerieStatutDTO> statutsSeries = new ArrayList<>();
        boolean seriePrecedenteReussie = true; // la 1ère série est toujours disponible au départ
        int seriesReussies = 0;

        for (SerieCode serie : series) {
            List<CodeTentative> tentatives = tentativeRepository
                    .findByCandidatIdAndSerieIdOrderByNumeroTentativeAsc(candidatId, serie.getId());

            boolean reussi = tentatives.stream().anyMatch(t -> t.getStatut() == StatutTentativeCode.REUSSI);
            boolean enCours = tentatives.stream().anyMatch(t -> t.getStatut() == StatutTentativeCode.EN_COURS);
            boolean aEchec = tentatives.stream().anyMatch(t -> t.getStatut() == StatutTentativeCode.ECHEC
                    || t.getStatut() == StatutTentativeCode.EXPIREE
                    || t.getStatut() == StatutTentativeCode.ABANDONNEE);

            Integer meilleurScore = tentatives.stream()
                    .filter(t -> t.getStatut() != StatutTentativeCode.EN_COURS)
                    .map(CodeTentative::getScore)
                    .max(Integer::compareTo)
                    .orElse(null);

            StatutSerie statut;
            if (reussi) {
                statut = StatutSerie.REUSSI;
                seriesReussies++;
            } else if (enCours) {
                statut = StatutSerie.EN_COURS;
            } else if (!config.isDeblocageAutomatiqueSerieSuivante() || seriePrecedenteReussie) {
                statut = aEchec ? StatutSerie.ECHEC : StatutSerie.DISPONIBLE;
            } else {
                statut = StatutSerie.VERROUILLE;
            }

            long nbQuestionsSerie = questionRepository.countBySerieId(serie.getId());

            statutsSeries.add(CodeSerieStatutDTO.builder()
                    .serieId(serie.getId())
                    .serieNom(serie.getNom())
                    .nombreQuestions((int) nbQuestionsSerie)
                    .statut(statut)
                    .meilleurScore(meilleurScore)
                    .nbTentativesUtilisees(tentatives.size())
                    .build());

            seriePrecedenteReussie = reussi;
        }

        return CodeProgressionDTO.builder()
                .candidatId(candidatId)
                .totalSeries(series.size())
                .seriesReussies(seriesReussies)
                .pourcentageProgression(series.isEmpty() ? 0 : (seriesReussies * 100.0) / series.size())
                .accesExpire(accesExpire)
                .series(statutsSeries)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CodeHistoriqueLigneDTO> getHistorique(Long candidatId) {
        verifierAccesCandidat(candidatId);
        return tentativeRepository.findByCandidatIdOrderByDateDebutDesc(candidatId).stream()
                .map(t -> CodeHistoriqueLigneDTO.builder()
                        .tentativeId(t.getId())
                        .serieId(t.getSerie().getId())
                        .serieNom(t.getSerie().getNom())
                        .numeroTentative(t.getNumeroTentative())
                        .dateDebut(t.getDateDebut())
                        .dateFin(t.getDateFin())
                        .score(t.getScore())
                        .totalQuestions(t.getTotalQuestionsSerie())
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
     *
     * IMPORTANT : verifierAccesEpreuve(CODE) ne s'applique qu'aux MONITEURs (restriction par
     * spécialité). Pour un CANDIDAT, cet appel est sans objet et peut provoquer une erreur
     * inattendue si le contexte sécurité ne contient pas de profil moniteur. On délègue donc
     * la vérification de spécialité uniquement lorsque le connecté est un moniteur.
     */
    private void verifierAccesCandidat(Long candidatId) {
        candidatAccessService.verifierEstSoiMeme(candidatId);
        inscriptionService.verifierAccesCandidat(candidatId);
        // La vérification de spécialité CODE ne concerne que les moniteurs :
        // un CANDIDAT accède toujours à son propre module sans contrainte de spécialité.
        if (siteAccessService.estMoniteurRestreint()) {
            siteAccessService.verifierAccesEpreuve(TypeEpreuve.CODE);
        }
    }

    // ============================= DÉMARRAGE D'UNE SÉRIE =============================

    @Transactional
    public EtatTentativeDTO demarrerSerie(Long serieId) {
        Candidat candidat = candidatAccessService.getCandidatCourant();
        Long candidatId = candidat.getId();

        Inscription inscription = inscriptionService.getInscriptionActive(candidatId);
        if (LocalDate.now().isAfter(inscription.getDateEcheance())) {
            throw new BadRequestException("Votre inscription a expiré : le module Code n'est plus accessible pour cette série");
        }

        CodeConfiguration config = configurationService.getConfigurationEntity();
        if (estAccesExpire(candidatId, config)) {
            throw new BadRequestException("L'accès au module Code de la route a expiré");
        }

        SerieCode serie = serieRepository.findById(serieId)
                .filter(SerieCode::isActif)
                .orElseThrow(() -> new BadRequestException("Série invalide"));

        List<SerieCode> series = serieRepository.findByActifTrueOrderByOrdreAsc();
        int position = series.indexOf(serie);
        if (config.isDeblocageAutomatiqueSerieSuivante() && position > 0) {
            SerieCode seriePrecedente = series.get(position - 1);
            boolean seriePrecedenteReussie = tentativeRepository
                    .existsByCandidatIdAndSerieIdAndStatut(candidatId, seriePrecedente.getId(), StatutTentativeCode.REUSSI);
            if (!seriePrecedenteReussie) {
                throw new BadRequestException("Cette série est verrouillée : réussissez d'abord la série « " + seriePrecedente.getNom() + " »");
            }
        }

        // Reprise d'une tentative déjà en cours (rafraîchissement de page, etc.)
        CodeTentative tentativeEnCours = tentativeRepository
                .findByCandidatIdAndSerieIdAndStatut(candidatId, serieId, StatutTentativeCode.EN_COURS)
                .orElse(null);
        if (tentativeEnCours != null) {
            EtatTentativeDTO expire = cloturerSiExpiree(tentativeEnCours);
            if (expire == null) {
                return buildEtatEnCours(tentativeEnCours);
            }
            // La tentative précédente était expirée et vient d'être clôturée.
            // On enchaîne directement sur la création d'une nouvelle tentative ci-dessous.
        }

        List<CodeTentative> tentativesPrecedentes = tentativeRepository
                .findByCandidatIdAndSerieIdOrderByNumeroTentativeAsc(candidatId, serieId);
        if (!tentativesPrecedentes.isEmpty() && !config.isRepriseAutoriseeApresEchec()) {
            boolean dejaReussi = tentativesPrecedentes.stream().anyMatch(t -> t.getStatut() == StatutTentativeCode.REUSSI);
            if (!dejaReussi) {
                throw new BadRequestException("La reprise de cette série après échec n'est pas autorisée");
            }
        }

        List<CodeQuestion> questionsSerie = questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(serieId);
        if (questionsSerie.isEmpty()) {
            throw new BadRequestException("Aucune question disponible pour cette série");
        }

        LocalDateTime maintenant = LocalDateTime.now();
        CodeTentative tentative = CodeTentative.builder()
                .candidat(candidat)
                .inscription(inscription)
                .serie(serie)
                .numeroTentative(tentativesPrecedentes.size() + 1)
                .dateDebut(maintenant)
                .dateAffichageQuestionCourante(maintenant)
                .indexQuestionCourante(0)
                .statut(StatutTentativeCode.EN_COURS)
                .totalQuestionsSerie(questionsSerie.size())
                .snapSeuilReussite(config.getSeuilReussite())
                .snapTempsParQuestionSecondes(config.getTempsParQuestionSecondes())
                .snapDureeMaxSerieSecondes(config.getDureeMaxSerieSecondes())
                .snapRetourAutorise(config.isRetourQuestionPrecedenteAutorise())
                .snapCorrectionImmediate(config.isCorrectionImmediate())
                .build();

        tentative = tentativeRepository.save(tentative);
        return buildEtatEnCours(tentative);
    }

    // ============================= DÉROULEMENT =============================

    @Transactional
    public EtatTentativeDTO repondre(Long tentativeId, Set<LettreReponse> reponsesCandidat) {
        CodeTentative tentative = getTentativePossedee(tentativeId);
        if (tentative.getStatut() != StatutTentativeCode.EN_COURS) {
            return etatDepuisTentativeTerminee(tentative);
        }

        EtatTentativeDTO expire = cloturerSiExpiree(tentative);
        if (expire != null) {
            return expire;
        }

        List<CodeQuestion> questionsSerie = questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(tentative.getSerie().getId());
        if (tentative.getIndexQuestionCourante() >= questionsSerie.size()) {
            return finaliser(tentative, false);
        }
        CodeQuestion question = questionsSerie.get(tentative.getIndexQuestionCourante());

        LocalDateTime maintenant = LocalDateTime.now();
        long tempsEcouleQuestion = Duration.between(tentative.getDateAffichageQuestionCourante(), maintenant).getSeconds();
        // Le serveur revalide systématiquement le délai : une réponse hors délai est ignorée,
        // même si le client en a transmis une (cf. §18 du cahier des charges du module).
        Set<LettreReponse> reponsesRetenues = tempsEcouleQuestion > tentative.getSnapTempsParQuestionSecondes() || reponsesCandidat == null
                ? Set.of()
                : reponsesCandidat;
        Set<LettreReponse> bonnesReponses = LettreReponse.fromCsv(question.getBonneReponses());
        // À choix multiples, la réponse n'est correcte que si l'ensemble coché correspond
        // exactement à l'ensemble attendu (aucune bonne réponse manquante, aucune en trop) —
        // même convention que les examens officiels du Code de la route.
        boolean correcte = !reponsesRetenues.isEmpty() && reponsesRetenues.equals(bonnesReponses);

        reponseRepository.save(CodeReponseTentative.builder()
                .tentative(tentative)
                .question(question)
                .ordreDansCycle(tentative.getIndexQuestionCourante())
                .reponsesDonnees(LettreReponse.toCsv(reponsesRetenues))
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
                        .bonnesReponses(bonnesReponses)
                        .explication(question.getExplication())
                        .build()
                : null;

        if (tentative.getIndexQuestionCourante() >= questionsSerie.size()) {
            EtatTentativeDTO resultat = finaliser(tentative, false);
            resultat.setCorrection(correction);
            return resultat;
        }

        tentativeRepository.save(tentative);
        EtatTentativeDTO suite = buildEtatEnCours(tentative);
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

        return buildEtatEnCours(tentative);
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

    @Transactional
    public EtatTentativeDTO getEtatTentative(Long tentativeId) {
        CodeTentative tentative = getTentativePossedee(tentativeId);
        if (tentative.getStatut() != StatutTentativeCode.EN_COURS) {
            return etatDepuisTentativeTerminee(tentative);
        }
        EtatTentativeDTO expire = cloturerSiExpiree(tentative);
        if (expire != null) {
            return expire;
        }
        return buildEtatEnCours(tentative);
    }

    // ============================= UTILITAIRES INTERNES =============================

    private CodeTentative getTentativePossedee(Long tentativeId) {
        CodeTentative tentative = tentativeRepository.findById(tentativeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tentative introuvable"));
        candidatAccessService.verifierEstSoiMeme(tentative.getCandidat().getId());
        return tentative;
    }

    /** Ferme automatiquement une tentative EN_COURS dont la durée maximale de la série est
     *  dépassée (contrôle serveur du chronomètre, cf. §6/§18 du cahier des charges du module). */
    private EtatTentativeDTO cloturerSiExpiree(CodeTentative tentative) {
        long tempsEcouleSerie = Duration.between(tentative.getDateDebut(), LocalDateTime.now()).getSeconds();
        if (tempsEcouleSerie > tentative.getSnapDureeMaxSerieSecondes()) {
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
        // Aucune limite de tentatives : seule la config "reprise autorisée après échec"
        // détermine si le candidat peut relancer cette série.
        boolean repriseAutorisee = configurationService.getConfigurationEntity().isRepriseAutoriseeApresEchec();
        return EtatTentativeDTO.builder()
                .resultat(CodeResultatTentativeDTO.builder()
                        .tentativeId(tentative.getId())
                        .serieId(tentative.getSerie().getId())
                        .serieNom(tentative.getSerie().getNom())
                        .score(tentative.getScore())
                        .totalQuestions(tentative.getTotalQuestionsSerie())
                        .seuilReussite(tentative.getSnapSeuilReussite())
                        .statut(tentative.getStatut())
                        .reussi(reussi)
                        .serieSuivanteDebloquee(reussi)
                        .peutReprendre(!reussi && repriseAutorisee)
                        .build())
                .build();
    }

    private EtatTentativeDTO buildEtatEnCours(CodeTentative tentative) {
        List<CodeQuestion> questionsSerie = questionRepository.findBySerieIdAndActifTrueOrderByOrdreAsc(tentative.getSerie().getId());
        if (questionsSerie.isEmpty()) {
            throw new BadRequestException("Aucune question active disponible pour cette série");
        }
        int index = Math.min(Math.max(0, tentative.getIndexQuestionCourante()), questionsSerie.size() - 1);
        CodeQuestion question = questionsSerie.get(index);
        return EtatTentativeDTO.builder()
                .enCours(TentativeEnCoursDTO.builder()
                        .tentativeId(tentative.getId())
                        .serieId(tentative.getSerie().getId())
                        .serieNom(tentative.getSerie().getNom())
                        .numeroTentative(tentative.getNumeroTentative())
                        .indexQuestionCourante(index)
                        .totalQuestionsDeLaSerie(questionsSerie.size())
                        .question(mapQuestionPourCandidat(question))
                        .tempsParQuestionSecondes(tentative.getSnapTempsParQuestionSecondes())
                        .dureeMaxSerieSecondes(tentative.getSnapDureeMaxSerieSecondes())
                        .dateDebut(tentative.getDateDebut())
                        .dateAffichageQuestionCourante(tentative.getDateAffichageQuestionCourante())
                        .retourAutorise(tentative.isSnapRetourAutorise())
                        .peutRevenirEnArriere(tentative.isSnapRetourAutorise() && index > 0)
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
                .sousTitreGroupeAB(q.getSousTitreGroupeAB())
                .sousTitreGroupeCD(q.getSousTitreGroupeCD())
                .nombreOptions(q.getNombreOptionsEffectif())
                .build();
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
