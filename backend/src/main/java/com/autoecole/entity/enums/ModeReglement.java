package com.autoecole.entity.enums;

import com.autoecole.exception.BadRequestException;

public enum ModeReglement {
    ESPECES,
    VIREMENT,
    MOBILE_MONEY,
    CHEQUE;

    public static final java.util.Map<String, String> OPERATEURS = java.util.Map.of(
            "ORANGE_MONEY", "Orange Money",
            "MTN_MONEY", "MTN Money",
            "MOOV_MONEY", "Moov Money",
            "WAVE", "Wave");

    /** Valide l'opérateur Mobile Money (obligatoire pour ce mode, null sinon). */
    public static String validerOperateur(ModeReglement mode, String operateur) {
        if (mode != MOBILE_MONEY) {
            return null;
        }
        String o = operateur == null ? "" : operateur.trim();
        if (!OPERATEURS.containsKey(o)) {
            throw new BadRequestException("L'opérateur Mobile Money est obligatoire (Orange Money, MTN Money, Moov Money ou Wave)");
        }
        return o;
    }

    /** Valide et nettoie un numéro de téléphone Mobile Money (6 à 20 chiffres, +, espaces autorisés). */
    public static String validerNumero(ModeReglement mode, String numero, String libelle) {
        if (mode != MOBILE_MONEY) {
            return null;
        }
        String n = numero == null ? "" : numero.trim();
        if (n.isEmpty()) {
            throw new BadRequestException("Le numéro " + libelle + " est obligatoire pour un paiement Mobile Money");
        }
        if (!n.matches("\\+?[0-9 ]{6,20}")) {
            throw new BadRequestException("Le numéro " + libelle + " est invalide (chiffres uniquement, 6 à 20 caractères)");
        }
        return n;
    }
}
