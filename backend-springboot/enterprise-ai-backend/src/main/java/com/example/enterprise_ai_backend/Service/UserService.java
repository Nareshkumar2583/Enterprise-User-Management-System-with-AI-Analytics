package com.example.enterprise_ai_backend.Service;

import com.example.enterprise_ai_backend.dto.UserResponse;
import com.example.enterprise_ai_backend.model.User;
import com.example.enterprise_ai_backend.repository.Userrepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class  UserService {

    private final Userrepository repo;
    private final PasswordEncoder passwordEncoder;

    private final RestTemplate restTemplate;
    private final String FASTAPI_URL = "https://enterprise-user-management-system-with.onrender.com";

    public UserService(Userrepository repo,
                       PasswordEncoder passwordEncoder,
                       RestTemplate restTemplate) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = restTemplate;
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

        if (user.isBlocked()) {
            throw new RuntimeException("Account is suspended. Please contact IT.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        return user;
    }

    // 👥 GET ALL USERS (FASTAPI BATCH)
    public List<UserResponse> getAllUsers() {
        List<User> users = repo.findAll();
        
        List<java.util.Map<String, String>> requestUsers = users.stream().map(u -> {
            java.util.Map<String, String> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            return map;
        }).toList();

        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("users", requestUsers);

        try {
            com.example.enterprise_ai_backend.dto.MLResponse[] mlResponses = restTemplate.postForObject(
                FASTAPI_URL + "/analyze_users_batch",
                payload,
                com.example.enterprise_ai_backend.dto.MLResponse[].class
            );

            if (mlResponses == null) throw new RuntimeException("Empty ML response");

            // Create a lookup map
            java.util.Map<String, com.example.enterprise_ai_backend.dto.MLResponse> mlMap = java.util.Arrays.stream(mlResponses)
                .collect(java.util.stream.Collectors.toMap(com.example.enterprise_ai_backend.dto.MLResponse::getUserId, r -> r));

            return users.stream().map(u -> {
                com.example.enterprise_ai_backend.dto.MLResponse ml = mlMap.getOrDefault(u.getId(), new com.example.enterprise_ai_backend.dto.MLResponse());
                return new UserResponse(
                    u.getId(), u.getName() != null ? u.getName() : "",
                    u.getEmail() != null ? u.getEmail() : "",
                    u.getRole() != null ? u.getRole() : "USER",
                    u.getDepartment(), u.getPhone(), u.getBio(), u.getProfilePictureUrl(), u.getSkills(),
                    ml.getRiskScore(), ml.getRiskLevel(), ml.getChurnProbability(),
                    ml.getSegment(), ml.isSuspicious(), ml.getRiskReason(), ml.getEngagementScore(),
                    ml.getBurnoutRisk(), ml.getRoleRecommendation()
                );
            }).toList();
        } catch (Exception e) {
            // Fallback if FastAPI is down
            return users.stream().map(u -> new UserResponse(
                u.getId(), u.getName(), u.getEmail(), u.getRole(),
                u.getDepartment(), u.getPhone(), u.getBio(), u.getProfilePictureUrl(), u.getSkills(),
                0, "LOW", 0, "Unknown", false, "AI Service Offline", 0,
                "LOW", "ROLE_OK"
            )).toList();
        }
    }

    // 👤 GET SINGLE USER BY ID (FASTAPI CALL)
    public UserResponse getUserById(String id) {
        User u = repo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        
        java.util.Map<String, String> payload = new java.util.HashMap<>();
        payload.put("id", u.getId());
        payload.put("email", u.getEmail());
        payload.put("role", u.getRole());

        try {
            com.example.enterprise_ai_backend.dto.MLResponse ml = restTemplate.postForObject(
                FASTAPI_URL + "/analyze_user",
                payload,
                com.example.enterprise_ai_backend.dto.MLResponse.class
            );
            if (ml == null) throw new RuntimeException("Null ML response");
            return new UserResponse(
                u.getId(), u.getName() != null ? u.getName() : "",
                u.getEmail() != null ? u.getEmail() : "",
                u.getRole() != null ? u.getRole() : "USER",
                u.getDepartment(), u.getPhone(), u.getBio(), u.getProfilePictureUrl(), u.getSkills(),
                ml.getRiskScore(), ml.getRiskLevel(), ml.getChurnProbability(),
                ml.getSegment(), ml.isSuspicious(), ml.getRiskReason(), ml.getEngagementScore(),
                ml.getBurnoutRisk(), ml.getRoleRecommendation()
            );
        } catch (Exception e) {
            return new UserResponse(
                u.getId(), u.getName(), u.getEmail(), u.getRole(),
                u.getDepartment(), u.getPhone(), u.getBio(), u.getProfilePictureUrl(), u.getSkills(),
                0, "LOW", 0, "Unknown", false, "AI Service Offline", 0,
                "LOW", "ROLE_OK"
            );
        }
    }

    // ❌ DELETE USER
    public void deleteUser(String id) {
        repo.deleteById(id);
    }

    // ✏️ UPDATE PROFILE
    public User updateProfile(String id, User updatedUser) {
        User user = repo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if(updatedUser.getName() != null) user.setName(updatedUser.getName());
        if(updatedUser.getEmail() != null) user.setEmail(updatedUser.getEmail());
        if(updatedUser.getDepartment() != null) user.setDepartment(updatedUser.getDepartment());
        if(updatedUser.getPhone() != null) user.setPhone(updatedUser.getPhone());
        if(updatedUser.getBio() != null) user.setBio(updatedUser.getBio());
        if(updatedUser.getProfilePictureUrl() != null) user.setProfilePictureUrl(updatedUser.getProfilePictureUrl());
        if(updatedUser.getSkills() != null) user.setSkills(updatedUser.getSkills());
        return repo.save(user);
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

    // ⏱️ STAMP LAST ACTIVE (called on every login)
    public void stampLastActive(String id) {
        repo.findById(id).ifPresent(user -> {
            user.setLastActiveDate(java.time.Instant.now().toString());
            repo.save(user);
        });
    }

    // 🚫 SUSPEND & RESTORE (WAVE 8)
    public void blockUser(String id, boolean blockStatus) {
        User user = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBlocked(blockStatus);
        repo.save(user);
    }
}
