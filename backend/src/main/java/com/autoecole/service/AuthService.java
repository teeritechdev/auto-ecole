package com.autoecole.service;

import com.autoecole.dto.AuthDTOs.ChangePasswordRequest;
import com.autoecole.dto.AuthDTOs.JwtResponse;
import com.autoecole.dto.AuthDTOs.LoginRequest;
import com.autoecole.entity.Utilisateur;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.exception.TooManyRequestsException;
import com.autoecole.repository.UtilisateurRepository;
import com.autoecole.security.JwtUtils;
import com.autoecole.security.LoginAttemptService;
import com.autoecole.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuditService auditService;
    private final LoginAttemptService loginAttemptService;

    @Transactional
    public JwtResponse login(LoginRequest request) {
        String username = request.getUsername();

        if (loginAttemptService.isBlocked(username)) {
            long secondes = loginAttemptService.getRemainingLockoutSeconds(username);
            throw new TooManyRequestsException(
                    "Trop de tentatives échouées. Compte temporairement verrouillé, réessayez dans " + (secondes / 60 + 1) + " minute(s).");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword())
            );
        } catch (AuthenticationException ex) {
            loginAttemptService.recordFailure(username);
            throw ex;
        }

        loginAttemptService.recordSuccess(username);

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        Utilisateur user = utilisateurRepository.findById(userDetails.getId()).orElseThrow();

        auditService.logAction("CONNEXION", "Utilisateur", userDetails.getUsername(), "Connexion réussie de l'utilisateur", null);

        return JwtResponse.builder()
                .token(jwt)
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .nom(userDetails.getNom())
                .prenom(userDetails.getPrenom())
                .role(role)
                .photoProfile(user.getPhotoProfile())
                .siteId(user.getSite() != null ? user.getSite().getId() : null)
                .specialites(user.getSpecialites())
                .build();
    }

    public void logout(String authorizationHeader) {
        if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7);
            jwtUtils.revokeToken(token);

            Utilisateur currentUser = auditService.getCurrentUser();
            if (currentUser != null) {
                auditService.logAction("DECONNEXION", "Utilisateur", currentUser.getUsername(), "Déconnexion et révocation du token", null);
            }
        }
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Utilisateur currentUser = auditService.getCurrentUser();
        if (currentUser == null) {
            throw new ResourceNotFoundException("Utilisateur non identifié");
        }

        if (!passwordEncoder.matches(request.getAncienPassword(), currentUser.getPassword())) {
            throw new BadRequestException("L'ancien mot de passe est incorrect");
        }

        currentUser.setPassword(passwordEncoder.encode(request.getNouveauPassword()));
        utilisateurRepository.save(currentUser);

        auditService.logAction("MODIFICATION_MDP", "Utilisateur", currentUser.getUsername(), "Modification du mot de passe", null);
    }
}
