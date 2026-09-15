package com.autoecole.repository;

import com.autoecole.entity.Profil;
import com.autoecole.entity.enums.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfilRepository extends JpaRepository<Profil, Long> {
    Optional<Profil> findByRoleSysteme(RoleEnum roleSysteme);
    boolean existsByNomIgnoreCase(String nom);
}
