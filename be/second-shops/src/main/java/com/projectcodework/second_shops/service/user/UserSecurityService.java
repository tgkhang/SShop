package com.projectcodework.second_shops.service.user;

import com.projectcodework.second_shops.model.User;
import com.projectcodework.second_shops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSecurityService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void encodeExistingPasswords() {
        userRepository.findAll().forEach(user -> {
            if (!isPasswordEncoded(user.getPassword())) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
                userRepository.save(user);
            }
        });
    }

    public boolean isPasswordEncoded(String password) {
        // BCrypt passwords start with $2a$, $2b$, or $2y$
        return password != null && password.matches("^\\$2[aby]\\$.*");
    }

    public User encodeUserPassword(User user) {
        if (!isPasswordEncoded(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return user;
    }
}
