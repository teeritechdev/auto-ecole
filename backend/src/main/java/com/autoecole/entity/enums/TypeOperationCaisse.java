package com.autoecole.entity.enums;

/**
 * Sous-type d'une opération de Caisse & Trésorerie. FRAIS_EXAMEN (décaissement) et
 * PRELEVEMENT_FORMATION (encaissement, transfert manuel d'argent déjà collecté en
 * formation vers la caisse physique) sont des flux particuliers avec leur propre logique
 * de calcul. PAIEMENT_FORMATION trace automatiquement chaque versement/annulation de
 * formation (ENTREE/SORTIE) pour que l'ADMIN voie l'intégralité des mouvements financiers
 * au même endroit ; ces lignes sont exclues du calcul du Solde de Caisse (cf.
 * TransactionCaisseRepository) pour ne pas compter deux fois le même argent si un
 * PRELEVEMENT_FORMATION est ensuite fait dessus. AUTRE couvre tout le reste (formulaire
 * libre classique).
 */
public enum TypeOperationCaisse {
    FRAIS_EXAMEN,
    PRELEVEMENT_FORMATION,
    PAIEMENT_FORMATION,
    AUTRE
}
