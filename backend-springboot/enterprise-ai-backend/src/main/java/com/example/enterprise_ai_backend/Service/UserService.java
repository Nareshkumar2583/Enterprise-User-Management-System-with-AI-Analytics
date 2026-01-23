package com.example.enterprise_ai_backend.Service;

import com.example.enterprise_ai_backend.dto.UserResponse;
import com.example.enterprise_ai_backend.model.User;
import com.example.enterprise_ai_backend.repository.Userrepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final Userrepository repo;
    private final PasswordEncoder passwordEncoder;

    public UserService(Userrepository repo,
                       PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
    }

    // 🔐 REGISTER USER
    public User register(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null) {
            user.setRole("USER");
        }
        return repo.save(user);
    }

    // 🔑 LOGIN USER
    public User login(String email, String password) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        return user;
    }

    // 👥 GET ALL USERS (PASSWORD HIDDEN)
    public List<UserResponse> getAllUsers() {
        return repo.findAll()
                .stream()
                .map(u -> new UserResponse(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        u.getRole()
                ))
                .toList();
    }

    // ❌ DELETE USER
    public void deleteUser(String id) {
        repo.deleteById(id);
    }

    // 🔼 PROMOTE
    public void promoteToAdmin(String id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole("ADMIN");
        repo.save(user);
    }

    // 🔽 DEMOTE
    public void demoteToUser(String id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole("USER");
        repo.save(user);
    }
}
