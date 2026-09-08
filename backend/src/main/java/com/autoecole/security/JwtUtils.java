package com.autoecole.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUtils {

    private static final String INSECURE_DEFAULT_SECRET =
            "SU5TRUNVUkUtREVWLU9OTFktREVGQVVMVC1KV1QtU0VDUkVULUNIQU5HRS1NRS1JTi1QUk9EVUNUSU9OLTAwMDAwMDAwMDA=";

    private final TokenBlacklistService tokenBlacklistService;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private int jwtExpirationMs;

    @PostConstruct
    void checkSecretStrength() {
        if (INSECURE_DEFAULT_SECRET.equals(jwtSecret)) {
            log.warn("=====================================================================");
            log.warn(" JWT_SECRET non défini : le secret de développement PAR DÉFAUT et NON");
            log.warn(" SÉCURISÉ est utilisé. Définissez la variable d'environnement JWT_SECRET");
            log.warn(" avec une clé forte avant tout déploiement en production.");
            log.warn("=====================================================================");
        }
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        Date issuedAt = new Date();
        Date expiration = new Date(issuedAt.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject((userPrincipal.getUsername()))
                .claim("role", userPrincipal.getAuthorities().iterator().next().getAuthority())
                .claim("userId", userPrincipal.getId())
                .claim("fullName", userPrincipal.getNom() + " " + userPrincipal.getPrenom())
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(key())
                .compact();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();
    }

    public String getUserNameFromJwtToken(String token) {
        return parseClaims(token).getSubject();
    }

    public String getJtiFromJwtToken(String token) {
        return parseClaims(token).getId();
    }

    public Date getExpirationFromJwtToken(String token) {
        return parseClaims(token).getExpiration();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Claims claims = parseClaims(authToken);
            if (tokenBlacklistService.isRevoked(claims.getId())) {
                return false;
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Token invalide ou expiré
        }
        return false;
    }

    /** Révoque immédiatement le token courant (déconnexion côté serveur). */
    public void revokeToken(String token) {
        try {
            Claims claims = parseClaims(token);
            tokenBlacklistService.revoke(claims.getId(), claims.getExpiration());
        } catch (JwtException | IllegalArgumentException e) {
            // Token déjà invalide/expiré : rien à révoquer
        }
    }
}
