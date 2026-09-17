package com.autoecole.entity.enums;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

public enum LettreReponse {
    A,
    B,
    C,
    D;

    /** Sérialise un ensemble de lettres en CSV trié (ex: "A,C") : conserve le format déjà
     *  utilisé dans la colonne "bonne_reponse" avant la réforme multi-réponses, où une
     *  lettre seule y était stockée telle quelle — aucune migration de données requise. */
    public static String toCsv(Set<LettreReponse> lettres) {
        return lettres.stream().sorted().map(Enum::name).collect(Collectors.joining(","));
    }

    public static Set<LettreReponse> fromCsv(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(LettreReponse::valueOf)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
