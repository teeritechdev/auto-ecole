package com.autoecole.entity.enums;

/**
 * Étape du parcours pédagogique du candidat, du dépôt du dossier jusqu'à l'obtention
 * du permis (ou l'expiration du dossier). Avance/recule automatiquement au fil des
 * versements et des résultats d'examens (cf. ExamenService, PaiementService).
 */
public enum EtapeParcours {
    INSCRIPTION,
    CODE,
    EXAMEN_CODE,
    CRENEAU,
    EXAMEN_CRENEAU,
    CIRCULATION,
    EXAMEN_CIRCULATION,
    PERMIS_OBTENU,
    EXPIRE
}
