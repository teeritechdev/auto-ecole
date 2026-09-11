package com.autoecole.security;

import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.security.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.security.login.lockout-minutes:15}")
    private long lockoutMinutes;

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
        if (failures >= maxAttempts) {
            attemptsByUsername.put(key, new Attempts(new AtomicInteger(failures), Instant.now().plus(Duration.ofMinutes(lockoutMinutes))));
        }
    }

    public void recordSuccess(String username) {
        attemptsByUsername.remove(normalize(username));
    }
}
