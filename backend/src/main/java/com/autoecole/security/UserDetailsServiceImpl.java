package com.autoecole.security;

import com.autoecole.entity.Permission;
import com.autoecole.entity.Utilisateur;
import com.autoecole.entity.enums.RoleEnum;
import com.autoecole.repository.PermissionRepository;
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
     * exactement les permissions de leur profil assigné (cf. onglet Permissions).
     */
    private Set<String> resoudrePermissionCodes(Utilisateur user) {
        if (user.getRole().getCode() == RoleEnum.ADMIN) {
            return permissionRepository.findAll().stream().map(Permission::getCode).collect(Collectors.toSet());
        }
        if (user.getProfil() == null) {
            return Set.of();
        }
        return user.getProfil().getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet());
    }
}
