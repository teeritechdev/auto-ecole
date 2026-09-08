package com.autoecole.security;

import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registre en mémoire des tokens JWT révoqués (déconnexion explicite).
 * Suffisant pour un déploiement mono-instance ; pour un déploiement
 * multi-instances, remplacer par un store partagé (ex: Redis).
 */
@Component
public class TokenBlacklistService {

    private final Map<String, Date> revokedJti = new ConcurrentHashMap<>();

    public void revoke(String jti, Date expiration) {
        if (jti == null) {
            return;
        }
        purgeExpired();
        revokedJti.put(jti, expiration);
    }

    public boolean isRevoked(String jti) {
        if (jti == null) {
            return false;
        }
        return revokedJti.containsKey(jti);
    }

    private void purgeExpired() {
        Date now = new Date();
        revokedJti.entrySet().removeIf(entry -> entry.getValue().before(now));
    }
}
