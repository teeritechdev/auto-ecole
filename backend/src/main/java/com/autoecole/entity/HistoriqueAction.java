package com.autoecole.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_actions", indexes = {
    @Index(name = "idx_historique_date", columnList = "timestamp"),
    @Index(name = "idx_historique_entite", columnList = "entite_cible")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Column(length = 100, nullable = false)
    private String action;

    @Column(name = "entite_cible", length = 100, nullable = false)
    private String entiteCible;

    @Column(name = "identifiant_cible", length = 100)
    private String identifiantCible;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(length = 255)
    private String motif;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "ip_address", length = 50)
    private String ipAddress;
}
