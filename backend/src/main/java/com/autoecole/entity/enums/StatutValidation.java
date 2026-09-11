package com.autoecole.entity.enums;

/**
 * État de la revue administrative d'un candidat proposé par un moniteur pour une
 * épreuve. EN_ATTENTE par défaut à la programmation ; VALIDE une fois approuvé
 * (le candidat reste visible chez le moniteur et l'administrateur) ; RETIRE si
 * rejeté ou retiré (n'apparaît plus dans la session, mais reste tracé côté
 * moniteur pour qu'il puisse reprogrammer le candidat autrement).
 */
public enum StatutValidation {
    EN_ATTENTE,
    VALIDE,
    RETIRE
}
