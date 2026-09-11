package com.autoecole.service;

import com.autoecole.dto.AuditDTOs.HistoriqueActionDTO;
import com.autoecole.entity.HistoriqueAction;
import com.autoecole.entity.Utilisateur;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.HistoriqueActionRepository;
import com.autoecole.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final HistoriqueActionRepository historiqueActionRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String action, String entiteCible, String identifiantCible, String details, String motif) {
        try {
            Utilisateur currentUser = getCurrentUser();

            HistoriqueAction logEntry = HistoriqueAction.builder()
                    .utilisateur(currentUser)
                    .action(action)
                    .entiteCible(entiteCible)
                    .identifiantCible(identifiantCible)
                    .details(details)
                    .motif(motif)
                    .timestamp(LocalDateTime.now())
                    .build();

            historiqueActionRepository.save(logEntry);
            log.info("Audit log enregistré: {} sur {} ({}) par {}", action, entiteCible, identifiantCible, 
                    currentUser != null ? currentUser.getUsername() : "SYSTEM");
        } catch (Exception e) {
            log.error("Erreur lors de l'enregistrement de l'audit: {}", e.getMessage());
        }
    }

    public Page<HistoriqueActionDTO> getHistorique(String entite, String action, LocalDateTime debut, LocalDateTime fin, Long utilisateurId, Pageable pageable) {
        return historiqueActionRepository.filtrerHistorique(entite, action, debut, fin, utilisateurId, pageable)
                .map(this::mapToDTO);
    }

    /**
     * Supprime une ou plusieurs entrées du journal d'audit (réservé ADMIN). La suppression
     * elle-même est journalisée (motif + résumé de ce qui a été supprimé) afin de conserver
     * une trace même lors d'un nettoyage, plutôt que de permettre un effacement totalement
     * silencieux de l'historique.
     */
    @Transactional
    public void supprimerActions(List<Long> ids, String motif) {
        if (motif == null || motif.isBlank()) {
            throw new BadRequestException("Le motif de suppression est obligatoire");
        }

        List<HistoriqueAction> entries = historiqueActionRepository.findAllById(ids);
        if (entries.isEmpty()) {
            throw new ResourceNotFoundException("Aucune entrée d'audit trouvée pour la suppression");
        }

        String resume = entries.stream()
                .map(h -> h.getAction() + "/" + h.getEntiteCible() + " (#" + h.getId() + ")")
                .collect(Collectors.joining(", "));

        historiqueActionRepository.deleteAll(entries);

        logAction("SUPPRESSION_AUDIT", "HistoriqueAction", entries.size() + " entrée(s)",
                "Entrées supprimées : " + resume, motif);
    }

    public Utilisateur getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String username = auth.getName();
            return utilisateurRepository.findByUsername(username).orElse(null);
        }
        return null;
    }

    private HistoriqueActionDTO mapToDTO(HistoriqueAction h) {
        return HistoriqueActionDTO.builder()
                .id(h.getId())
                .utilisateurId(h.getUtilisateur() != null ? h.getUtilisateur().getId() : null)
                .utilisateurNomComplet(h.getUtilisateur() != null ? h.getUtilisateur().getNom() + " " + h.getUtilisateur().getPrenom() : "Système")
                .action(h.getAction())
                .entiteCible(h.getEntiteCible())
                .identifiantCible(h.getIdentifiantCible())
                .details(h.getDetails())
                .motif(h.getMotif())
                .timestamp(h.getTimestamp())
                .ipAddress(h.getIpAddress())
                .build();
    }
}
