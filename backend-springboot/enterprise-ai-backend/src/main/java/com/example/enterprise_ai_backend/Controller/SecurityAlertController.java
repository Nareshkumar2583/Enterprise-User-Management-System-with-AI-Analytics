package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.Notification;
import com.example.enterprise_ai_backend.repository.NotificationRepository;
import com.example.enterprise_ai_backend.repository.Userrepository;
import com.example.enterprise_ai_backend.repository.AuditRepository;
import com.example.enterprise_ai_backend.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin
public class SecurityAlertController {

    private final Userrepository userRepo;
    private final AuditRepository auditRepo;
    private final NotificationRepository notifRepo;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;
    private final String FASTAPI_URL = "http://localhost:8000";

    public SecurityAlertController(Userrepository userRepo, AuditRepository auditRepo,
                                   NotificationRepository notifRepo, PasswordEncoder passwordEncoder,
                                   RestTemplate restTemplate) {
        this.userRepo = userRepo;
        this.auditRepo = auditRepo;
        this.notifRepo = notifRepo;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = restTemplate;
    }

    // POST /api/user/change-password
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> opt = userRepo.findByEmail(email);
            if (opt.isEmpty()) return ResponseEntity.status(401).build();

            User user = opt.get();
            String oldPassword = body.get("oldPassword");
            String newPassword = body.get("newPassword");

            if (oldPassword == null || newPassword == null)
                return ResponseEntity.badRequest().body(Map.of("error", "Both oldPassword and newPassword are required"));

            if (!passwordEncoder.matches(oldPassword, user.getPassword()))
                return ResponseEntity.status(403).body(Map.of("error", "Current password is incorrect"));

            if (newPassword.length() < 6)
                return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepo.save(user);

            // Log as audit event
            Notification n = new Notification(
                user.getId(),
                "Your password was successfully changed at " + Instant.now(),
                "SECURITY"
            );
            notifRepo.save(n);

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/user/login-history
    @GetMapping("/login-history")
    public ResponseEntity<?> loginHistory(Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> opt = userRepo.findByEmail(email);
            if (opt.isEmpty()) return ResponseEntity.status(401).build();

            User user = opt.get();
            var history = auditRepo.findByTargetUserIdOrderByTimestampDesc(user.getId())
                .stream().limit(20).toList();
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/login-anomaly — proxy to FastAPI
    @PostMapping("/login-anomaly")
    public ResponseEntity<?> detectLoginAnomaly(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/login_anomaly", body, Map.class);
            // If anomaly detected, save as security notification
            if (result != null && Boolean.TRUE.equals(result.get("isAnomaly")) && auth != null) {
                String email = auth.getName();
                userRepo.findByEmail(email).ifPresent(u -> {
                    Notification n = new Notification(
                        u.getId(),
                        "⚠️ 🚨 Security Alert: Unusual Login Detected. Risk: " + result.get("riskReason") + " | Action: " + result.get("action"),
                        "SECURITY"
                    );
                    notifRepo.save(n);
                });
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/churn-risk — proxy to FastAPI
    @PostMapping("/churn-risk")
    public ResponseEntity<?> churnRisk(@RequestBody Map<String, Object> body) {
        try {
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/churn_prediction", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/smart-ticket — NLP ticket routing
    @PostMapping("/smart-ticket")
    public ResponseEntity<?> smartTicket(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            if (auth != null) body.put("userEmail", auth.getName());
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/smart_ticket", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
