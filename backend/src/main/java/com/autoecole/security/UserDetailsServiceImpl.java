package com.autoecole.security;

import com.autoecole.entity.Permission;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.repository.PermissionRepository;
import com.autoecole.repository.ProfilRepository;
import com.autoecole.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;
    private final PermissionRepository permissionRepository;
    private final ProfilRepository profilRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Utilisateur user = utilisateurRepository.findByUsername(username)
                .or(() -> utilisateurRepository.findByEmail(username))
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé avec l'identifiant: " + username));

        return UserDetailsImpl.build(user, resoudrePermissionCodes(user));
    }

    /**
     * ADMIN garde toujours l'accès total, indépendamment de ce qui est configuré sur son
     * profil (garde-fou pour ne jamais bloquer un administrateur) ; les autres rôles reçoivent
     * exactement les permissions de leur profil assigné (ou du profil système par défaut si aucun profil assigné).
     */
    private Set<String> resoudrePermissionCodes(Utilisateur user) {
        if (user.getRole() != null && user.getRole().getCode() == RoleEnum.ADMIN) {
            return permissionRepository.findAll().stream().map(Permission::getCode).collect(Collectors.toSet());
        }
        if (user.getProfil() != null) {
            return user.getProfil().getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet());
        }
        if (user.getRole() != null) {
            return profilRepository.findByRoleSysteme(user.getRole().getCode())
                    .map(p -> p.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet()))
                    .orElse(Set.of());
        }
        return Set.of();
    }
}
