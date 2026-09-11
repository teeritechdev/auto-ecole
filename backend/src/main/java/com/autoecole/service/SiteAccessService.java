package com.autoecole.service;

import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.EtapeParcours;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.entity.enums.TypeEpreuve;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Centralise la restriction d'accès des moniteurs aux candidats/examens de leur propre site
 * (RG : un moniteur ne gère que les candidats inscrits sur son site de rattachement).
 */
@Service
@RequiredArgsConstructor
public class SiteAccessService {

    private final AuditService auditService;

    public boolean estMoniteurRestreint() {
        Utilisateur u = auditService.getCurrentUser();
        return u != null && u.getRole() != null && u.getRole().getCode() == RoleEnum.MONITEUR;
    }

    public Long getSiteIdMoniteurCourant() {
        Utilisateur u = auditService.getCurrentUser();
        return (u != null && u.getSite() != null) ? u.getSite().getId() : null;
    }

    /**
     * Ne filtre que si l'utilisateur courant est un moniteur : renvoie son site (ou -1L
     * s'il n'a aucun site de rattachement, pour garantir qu'aucun résultat ne remonte),
     * sinon null pour signifier "pas de restriction".
     */
    public Long resoudreFiltreSitePourListe() {
        if (!estMoniteurRestreint()) return null;
        Long siteId = getSiteIdMoniteurCourant();
        return siteId != null ? siteId : -1L;
    }

    /**
     * Vérifie l'accès à un candidat/dossier donné : lève une exception "introuvable"
     * (plutôt qu'un 403 explicite) si un moniteur tente d'accéder à un candidat
     * hors de son site, pour ne pas révéler l'existence du dossier.
     */
    public void verifierAccesSite(Long siteIdCible) {
        if (!estMoniteurRestreint()) return;
        Long siteIdMoniteur = getSiteIdMoniteurCourant();
        if (siteIdMoniteur == null || siteIdCible == null || !siteIdMoniteur.equals(siteIdCible)) {
            throw new ResourceNotFoundException("Candidat introuvable");
        }
    }

    /**
     * Renvoie une copie détachée des spécialités du moniteur courant : la collection
     * Hibernate exposée par l'entité reste liée à celle-ci (elle porte une référence
     * vers son propriétaire), ce qui la rend impropre à un usage en paramètre de
     * requête JPQL (échec de sérialisation interne). On en copie donc le contenu.
     */
    public Set<TypeEpreuve> getSpecialitesMoniteurCourant() {
        Utilisateur u = auditService.getCurrentUser();
        return (u != null && u.getSpecialites() != null) ? new HashSet<>(u.getSpecialites()) : Collections.emptySet();
    }

    /**
     * Ne filtre que si l'utilisateur courant est un moniteur : renvoie l'ensemble de ses
     * spécialités (potentiellement vide, ce qui exclut alors tout résultat), sinon null
     * pour signifier "pas de restriction" (ADMIN, SECRETAIRE).
     */
    public Set<TypeEpreuve> resoudreFiltreEpreuvesPourListe() {
        if (!estMoniteurRestreint()) return null;
        return getSpecialitesMoniteurCourant();
    }

    /**
     * Vérifie que le moniteur courant est habilité à programmer/modifier une épreuve de ce
     * type : un moniteur ne peut agir que sur les épreuves correspondant à sa spécialité
     * (RG : "un moniteur Code ne programme que du Code"). Sans objet pour ADMIN/SECRETAIRE.
     */
    public void verifierAccesEpreuve(TypeEpreuve typeEpreuve) {
        if (!estMoniteurRestreint()) return;
        if (!getSpecialitesMoniteurCourant().contains(typeEpreuve)) {
            throw new BadRequestException(
                    "Vous n'êtes pas habilité à programmer ou modifier une épreuve de type " + typeEpreuve.name()
                            + " (spécialité non assignée à votre profil moniteur)");
        }
    }

    /** Étapes du parcours candidat qu'une spécialité de moniteur donne le droit de voir :
     *  l'étape de pratique elle-même, et l'étape "en attente de résultat" correspondante. */
    private static java.util.Set<EtapeParcours> etapesPourSpecialite(TypeEpreuve specialite) {
        return switch (specialite) {
            case CODE -> java.util.Set.of(EtapeParcours.CODE, EtapeParcours.EXAMEN_CODE);
            case CRENEAU -> java.util.Set.of(EtapeParcours.CRENEAU, EtapeParcours.EXAMEN_CRENEAU);
            case CIRCULATION -> java.util.Set.of(EtapeParcours.CIRCULATION, EtapeParcours.EXAMEN_CIRCULATION);
        };
    }

    /**
     * Ne filtre que si l'utilisateur courant est un moniteur : renvoie l'ensemble des
     * étapes du parcours candidat correspondant à sa/ses spécialité(s) (potentiellement
     * vide si aucune spécialité assignée, ce qui exclut alors tout résultat), sinon null
     * pour signifier "pas de restriction" (ADMIN, SECRETAIRE, CAISSIERE).
     */
    public Set<EtapeParcours> resoudreFiltreEtapesPourListe() {
        if (!estMoniteurRestreint()) return null;
        Set<EtapeParcours> etapes = new HashSet<>();
        for (TypeEpreuve specialite : getSpecialitesMoniteurCourant()) {
            etapes.addAll(etapesPourSpecialite(specialite));
        }
        return etapes;
    }
}
