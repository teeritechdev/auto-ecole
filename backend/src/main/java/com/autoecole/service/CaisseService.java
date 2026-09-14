package com.autoecole.service;

import com.autoecole.dto.CaisseDTOs.*;
import com.autoecole.entity.NatureOperation;
import com.autoecole.entity.Site;
import com.autoecole.entity.TransactionCaisse;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.TypeMouvementCaisse;
import com.autoecole.exception.BadRequestException;
import com.autoecole.exception.ResourceNotFoundException;
import com.autoecole.repository.NatureOperationRepository;
import com.autoecole.repository.SiteRepository;
import com.autoecole.repository.TransactionCaisseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Caisse & Trésorerie interne : caisse de dépenses/recettes diverses totalement autonome,
 * indépendante des candidats, des inscriptions et des paiements de formation (suivis
 * exclusivement dans le module Paiements). Chaque opération est rattachée à une
 * {@link NatureOperation} qui détermine son sens — jamais ressaisi au niveau de l'opération —
 * et à un site de formation, chaque site ayant sa propre caisse physique indépendante.
 */
@Service
@RequiredArgsConstructor
public class CaisseService {

    private final TransactionCaisseRepository transactionRepository;
    private final NatureOperationRepository natureOperationRepository;
    private final SiteRepository siteRepository;
    private final AuditService auditService;
    private final SiteAccessService siteAccessService;

    /** Combine la restriction par site de l'utilisateur courant (prioritaire, s'il est
     *  restreint) avec un filtre explicite optionnel (choix de l'ADMIN pour consulter un
     *  site en particulier) ; null = aucune restriction (toutes les caisses, vision ADMIN). */
    private Set<Long> resoudreSiteIdsPourFiltre(Long siteIdFiltre) {
        Set<Long> restriction = siteAccessService.resoudreFiltreSitesPourListe();
        if (restriction != null) return restriction;
        return siteIdFiltre != null ? Set.of(siteIdFiltre) : null;
    }

    /**
     * Résout le site de la transaction à créer : si l'utilisateur n'est affecté qu'à un seul
     * site, celui-ci est utilisé automatiquement ; s'il en a plusieurs, le site est
     * obligatoire et doit être l'un des siens. Pour ADMIN (non restreint), le site est
     * toujours obligatoire (chaque site a sa propre caisse physique).
     */
    private Site resoudreSiteTransaction(Long siteIdFourni) {
        if (!siteAccessService.estRestreintParSite()) {
            if (siteIdFourni == null) {
                throw new BadRequestException("Le site est obligatoire (chaque site a sa propre caisse)");
            }
            return siteRepository.findById(siteIdFourni)
                    .orElseThrow(() -> new ResourceNotFoundException("Site de formation introuvable"));
        }
        Set<Long> sitesAutorises = siteAccessService.getSiteIdsMoniteurCourant();
        Long siteId = siteIdFourni;
        if (siteId == null) {
            if (sitesAutorises.size() == 1) {
                siteId = sitesAutorises.iterator().next();
            } else if (sitesAutorises.isEmpty()) {
                throw new BadRequestException("Aucun site de formation n'est assigné à votre profil");
            } else {
                throw new BadRequestException("Le site est obligatoire (vous êtes affecté à plusieurs sites)");
            }
        } else if (!sitesAutorises.contains(siteId)) {
            throw new BadRequestException("Vous n'êtes pas affecté à ce site");
        }
        return siteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("Site de formation introuvable"));
    }

    // @Transactional est nécessaire ici : mapToDTO() lit natureOperation, une relation LAZY —
    // sans session Hibernate encore ouverte au moment de ce mapping (le repository ferme la
    // sienne dès que sa propre méthode retourne), l'accès lèverait une LazyInitializationException.
    @Transactional(readOnly = true)
    public Page<TransactionCaisseDTO> filtrerTransactions(TypeMouvementCaisse type, Long natureOperationId, LocalDateTime debut, LocalDateTime fin, Long siteId, Pageable pageable) {
        Set<Long> siteIds = resoudreSiteIdsPourFiltre(siteId);
        if (siteIds != null && siteIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return transactionRepository.filtrerTransactions(type, natureOperationId, debut, fin, siteIds, pageable)
                .map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public List<TransactionCaisseDTO> getTransactionsPourRapport(LocalDateTime debut, LocalDateTime fin) {
        Set<Long> siteIds = resoudreSiteIdsPourFiltre(null);
        if (siteIds != null && siteIds.isEmpty()) {
            return List.of();
        }
        return transactionRepository.findPourRapport(debut, fin, siteIds).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public RecapCaisseDTO getRecapCaisse(Long siteId) {
        Set<Long> siteIds = resoudreSiteIdsPourFiltre(siteId);
        if (siteIds != null && siteIds.isEmpty()) {
            return RecapCaisseDTO.builder()
                    .totalEntrees(BigDecimal.ZERO).totalSorties(BigDecimal.ZERO).soldeCaisse(BigDecimal.ZERO)
                    .totalEntreesJour(BigDecimal.ZERO).totalSortiesJour(BigDecimal.ZERO).soldeJour(BigDecimal.ZERO)
                    .build();
        }

        BigDecimal totalEntrees = transactionRepository.sumByTypeMouvement(TypeMouvementCaisse.ENTREE, siteIds);
        BigDecimal totalSorties = transactionRepository.sumByTypeMouvement(TypeMouvementCaisse.SORTIE, siteIds);
        BigDecimal soldeCaisse = totalEntrees.subtract(totalSorties);

        LocalDateTime debutJour = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime finJour = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        BigDecimal entreesJour = transactionRepository.sumByTypeMouvementBetween(TypeMouvementCaisse.ENTREE, debutJour, finJour, siteIds);
        BigDecimal sortiesJour = transactionRepository.sumByTypeMouvementBetween(TypeMouvementCaisse.SORTIE, debutJour, finJour, siteIds);
        BigDecimal soldeJour = entreesJour.subtract(sortiesJour);

        return RecapCaisseDTO.builder()
                .totalEntrees(totalEntrees)
                .totalSorties(totalSorties)
                .soldeCaisse(soldeCaisse)
                .totalEntreesJour(entreesJour)
                .totalSortiesJour(sortiesJour)
                .soldeJour(soldeJour)
                .build();
    }

    @Transactional
    public TransactionCaisseDTO enregistrerTransaction(CreateTransactionCaisseRequest request) {
        Utilisateur currentUser = auditService.getCurrentUser();

        NatureOperation nature = natureOperationRepository.findById(request.getNatureOperationId())
                .orElseThrow(() -> new ResourceNotFoundException("Nature d'opération introuvable"));
        if (!nature.isActif()) {
            throw new BadRequestException("Cette nature d'opération est inactive et ne peut plus être utilisée");
        }

        Site site = resoudreSiteTransaction(request.getSiteId());

        TransactionCaisse tx = TransactionCaisse.builder()
                .natureOperation(nature)
                .typeMouvement(nature.getSens())
                .montant(request.getMontant())
                .libelle(request.getLibelle().trim())
                .numeroFacture(request.getNumeroFacture())
                .dateTransaction(LocalDateTime.now())
                .utilisateur(currentUser)
                .site(site)
                .build();

        TransactionCaisse saved = transactionRepository.save(tx);
        auditService.logAction("MOUVEMENT_CAISSE", "TransactionCaisse", saved.getId().toString(),
                nature.getSens() + " de " + request.getMontant() + " FCFA - " + nature.getLibelle() + " - " + request.getLibelle() + " (site : " + site.getNom() + ")", null);

        return mapToDTO(saved);
    }

    @Transactional
    public void deleteTransaction(Long id, String motif) {
        TransactionCaisse tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction introuvable"));

        transactionRepository.delete(tx);
        auditService.logAction("SUPPRESSION_MOUVEMENT_CAISSE", "TransactionCaisse", id.toString(),
                "Suppression du mouvement " + tx.getTypeMouvement() + " de " + tx.getMontant() + " FCFA", motif);
    }

    @Transactional(readOnly = true)
    public List<TransactionCaisseDTO> getDernieresTransactions() {
        Set<Long> siteIds = resoudreSiteIdsPourFiltre(null);
        if (siteIds != null && siteIds.isEmpty()) {
            return List.of();
        }
        return transactionRepository.findDernieresTransactions(siteIds, PageRequest.of(0, 10)).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TransactionCaisseDTO mapToDTO(TransactionCaisse tx) {
        NatureOperation n = tx.getNatureOperation();
        return TransactionCaisseDTO.builder()
                .id(tx.getId())
                .natureOperation(NatureOperationDTO.builder()
                        .id(n.getId())
                        .code(n.getCode())
                        .libelle(n.getLibelle())
                        .sens(n.getSens())
                        .planComptable(n.getPlanComptable())
                        .description(n.getDescription())
                        .actif(n.isActif())
                        .build())
                .typeMouvement(tx.getTypeMouvement())
                .montant(tx.getMontant())
                .libelle(tx.getLibelle())
                .numeroFacture(tx.getNumeroFacture())
                .dateTransaction(tx.getDateTransaction())
                .utilisateurId(tx.getUtilisateur() != null ? tx.getUtilisateur().getId() : null)
                .utilisateurNomComplet(tx.getUtilisateur() != null ? tx.getUtilisateur().getNom() + " " + tx.getUtilisateur().getPrenom() : "")
                .siteId(tx.getSite() != null ? tx.getSite().getId() : null)
                .siteNom(tx.getSite() != null ? tx.getSite().getNom() : null)
                .build();
    }
}
