package com.projectcodework.second_shops.data;

import com.projectcodework.second_shops.model.Role;
import com.projectcodework.second_shops.model.User;
import com.projectcodework.second_shops.repository.RoleRepository;
import com.projectcodework.second_shops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationListener<ApplicationReadyEvent> {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void onApplicationEvent(@NonNull ApplicationReadyEvent event) {
        createDefaultRolesIfNotExist();
        createDefaultUsersIfNotExist();
    }

    private void createDefaultRolesIfNotExist() {
        createRoleIfNotExist("ROLE_ADMIN", "Administrator role with full access");
        createRoleIfNotExist("ROLE_USER", "Standard user role with limited access");
    }

    private void createRoleIfNotExist(String roleName, String description) {
        if (!roleRepository.existsByRoleName(roleName)) {
            Role role = new Role(roleName);
            roleRepository.save(role);
            System.out.println("Role '" + roleName + "' created successfully - " + description);
        }
    }

    private void createDefaultUsersIfNotExist() {
        // Create Admin User
        createAdminUserIfNotExist();
        
        // Create Regular Users
        createRegularUsersIfNotExist();
    }

    private void createAdminUserIfNotExist() {
        String adminEmail = "admin@shop.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            Role adminRole = roleRepository.findByRoleName("ROLE_ADMIN")
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));
            Role userRole = roleRepository.findByRoleName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("User role not found"));

            User admin = new User();
            admin.setFirstName("System");
            admin.setLastName("Administrator");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setEnabled(true);
            admin.setAccountNonExpired(true);
            admin.setAccountNonLocked(true);
            admin.setCredentialsNonExpired(true);
            admin.setRoles(Set.of(adminRole, userRole));
            
            userRepository.save(admin);
            System.out.println("Admin user created successfully - Email: " + adminEmail + ", Password: admin123");
        }
    }

    private void createRegularUsersIfNotExist() {
        Role userRole = roleRepository.findByRoleName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("User role not found"));

        for (int i = 1; i <= 5; i++) {
            String defaultEmail = "user" + i + "@shop.com";
            if (!userRepository.existsByEmail(defaultEmail)) {
                User user = new User();
                user.setFirstName("User" + i);
                user.setLastName("Test");
                user.setEmail(defaultEmail);
                user.setPassword(passwordEncoder.encode("password123"));
                user.setEnabled(true);
                user.setAccountNonExpired(true);
                user.setAccountNonLocked(true);
                user.setCredentialsNonExpired(true);
                user.setRoles(Set.of(userRole));
                
                userRepository.save(user);
                System.out.println("User" + i + " created successfully - Email: " + defaultEmail + ", Password: password123");
            }
        }
    }
}
