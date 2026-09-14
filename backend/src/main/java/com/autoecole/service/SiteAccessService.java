package com.autoecole.service;

import com.autoecole.entity.Site;
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
 * Centralise la restriction d'accès par site : un moniteur, une secrétaire ou une caissière
 * rattaché(e) à un ou plusieurs sites ne gère que les candidats/examens/paiements de ces
 * sites (RG : le personnel de terrain ne voit que l'activité de son propre site).
 */
@Service
@RequiredArgsConstructor
public class SiteAccessService {

    private final AuditService auditService;

    public boolean estMoniteurRestreint() {
        Utilisateur u = auditService.getCurrentUser();
        return u != null && u.getRole() != null && u.getRole().getCode() == RoleEnum.MONITEUR;
    }

    /**
     * Vrai pour tout rôle rattachable à un ou plusieurs sites (MONITEUR, SECRETAIRE,
     * CAISSIERE) : ADMIN garde seul la vision globale, tous sites confondus.
     */
    public boolean estRestreintParSite() {
        Utilisateur u = auditService.getCurrentUser();
        if (u == null || u.getRole() == null) return false;
        RoleEnum role = u.getRole().getCode();
        return role == RoleEnum.MONITEUR || role == RoleEnum.SECRETAIRE || role == RoleEnum.CAISSIERE;
    }

    /**
     * Renvoie une copie détachée des ids de sites de l'utilisateur courant (même raison que
     * getSpecialitesMoniteurCourant() : la collection Hibernate liée à l'entité n'est pas
     * utilisable telle quelle en paramètre de requête JPQL).
     */
    public Set<Long> getSiteIdsMoniteurCourant() {
        Utilisateur u = auditService.getCurrentUser();
        if (u == null || u.getSites() == null) return Collections.emptySet();
        Set<Long> ids = new HashSet<>();
        for (Site s : u.getSites()) {
            ids.add(s.getId());
        }
        return ids;
    }

    /**
     * Ne filtre que si l'utilisateur courant est restreint par site (MONITEUR, SECRETAIRE,
     * CAISSIERE) : renvoie l'ensemble de ses sites (potentiellement vide, ce qui exclut alors
     * tout résultat), sinon null pour signifier "pas de restriction" (ADMIN).
     */
    public Set<Long> resoudreFiltreSitesPourListe() {
        if (!estRestreintParSite()) return null;
        return getSiteIdsMoniteurCourant();
    }

    /**
     * Vérifie l'accès à un candidat/dossier/session donné : lève une exception "introuvable"
     * (plutôt qu'un 403 explicite) si un utilisateur restreint par site tente d'accéder à
     * une ressource hors de ses sites, pour ne pas révéler son existence.
     */
    public void verifierAccesSite(Long siteIdCible) {
        if (!estRestreintParSite()) return;
        if (siteIdCible == null || !getSiteIdsMoniteurCourant().contains(siteIdCible)) {
            throw new ResourceNotFoundException("Candidat introuvable");
        }
    }

    /**
     * Vérifie qu'une action de création (nouveau candidat, réinscription...) porte bien sur
     * un site autorisé pour l'utilisateur courant restreint par site : message explicite,
     * contrairement à verifierAccesSite() pensé pour dissimuler l'existence d'une ressource.
     */
    public void verifierSiteAutorise(Long siteIdCible) {
        if (!estRestreintParSite()) return;
        if (siteIdCible == null || !getSiteIdsMoniteurCourant().contains(siteIdCible)) {
            throw new BadRequestException("Vous n'êtes pas autorisé à agir sur ce site de formation");
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
