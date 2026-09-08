package com.autoecole.security;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Protection anti brute-force sur l'authentification : verrouille temporairement
 * un identifiant après plusieurs échecs consécutifs.
 * Suffisant pour un déploiement mono-instance ; pour un déploiement
 * multi-instances, remplacer par un store partagé (ex: Redis).
 */
@Component
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);

    private record Attempts(AtomicInteger count, Instant lockedUntil) {
    }

    private final Map<String, Attempts> attemptsByUsername = new ConcurrentHashMap<>();

    private String normalize(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }

    public boolean isBlocked(String username) {
        Attempts attempts = attemptsByUsername.get(normalize(username));
        if (attempts == null || attempts.lockedUntil() == null) {
            return false;
        }
        return Instant.now().isBefore(attempts.lockedUntil());
    }

    public long getRemainingLockoutSeconds(String username) {
        Attempts attempts = attemptsByUsername.get(normalize(username));
        if (attempts == null || attempts.lockedUntil() == null) {
            return 0;
        }
        long remaining = Duration.between(Instant.now(), attempts.lockedUntil()).getSeconds();
        return Math.max(remaining, 0);
    }

    public void recordFailure(String username) {
        String key = normalize(username);
        Attempts attempts = attemptsByUsername.computeIfAbsent(key, k -> new Attempts(new AtomicInteger(0), null));
        int failures = attempts.count().incrementAndGet();
        if (failures >= MAX_ATTEMPTS) {
            attemptsByUsername.put(key, new Attempts(new AtomicInteger(failures), Instant.now().plus(LOCKOUT_DURATION)));
        }
    }

    public void recordSuccess(String username) {
        attemptsByUsername.remove(normalize(username));
    }
}
