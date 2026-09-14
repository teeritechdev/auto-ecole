package com.autoecole.repository;

import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByUsername(String username);
    Optional<Utilisateur> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    /** Comptes du personnel (hors CANDIDAT) : utilisé par l'écran d'administration des
     *  utilisateurs, qui ne gère que Administrateur/Secrétaire/Caissière/Moniteur — les
     *  comptes CANDIDAT (auto-créés, sans email garanti) ont leur propre cycle de vie et
     *  ne doivent pas y apparaître (cf. audit ÉTAPE 5). */
    List<Utilisateur> findByRoleCodeNot(RoleEnum roleCode);
}
