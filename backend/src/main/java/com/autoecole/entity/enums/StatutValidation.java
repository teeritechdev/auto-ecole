package com.autoecole.entity.enums;

/**
 * État de la revue administrative d'un candidat proposé par un moniteur pour une
 * épreuve. EN_ATTENTE par défaut à la programmation ; VALIDE une fois approuvé
 * (le candidat reste visible chez le moniteur et l'administrateur).
 */
public enum StatutValidation {
    EN_ATTENTE,
    VALIDE
}
