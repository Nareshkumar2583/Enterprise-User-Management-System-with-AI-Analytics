package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.Service.UserService;
import com.example.enterprise_ai_backend.Service.EmailService;
import com.example.enterprise_ai_backend.Service.UserActivityService;
import com.example.enterprise_ai_backend.model.Notification;
import com.example.enterprise_ai_backend.repository.NotificationRepository;
import com.example.enterprise_ai_backend.dto.Login;
import com.example.enterprise_ai_backend.dto.LoginResponse;
import com.example.enterprise_ai_backend.model.User;
import com.example.enterprise_ai_backend.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final UserService service;
    private final JwtUtil jwtUtil;
    private final UserActivityService activityService;
    private final EmailService emailService;
    private final NotificationRepository notifRepo;

    public AuthController(
            UserService service,
            JwtUtil jwtUtil,
            UserActivityService activityService,
            EmailService emailService,
            NotificationRepository notifRepo
    ) {
        this.service = service;
        this.jwtUtil = jwtUtil;
        this.activityService = activityService;
        this.emailService = emailService;
        this.notifRepo = notifRepo;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User saved = service.register(user);
            activityService.log(saved.getEmail(), "Account Registered");
            
            // In-app Welcome
            notifRepo.save(new Notification(saved.getId(), "Welcome to Enterprise AI! We're glad you're here.", "INFO"));
            
            // Email Welcome
            emailService.sendWelcomeEmail(saved);
            
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/test-mail")
    public ResponseEntity<?> testLiveEmail() {
        emailService.sendTaskAllocationEmail(
            "nareshkumarsitdept@gmail.com", 
            "Live Inbox Verification by Enterprise AI Agent", 
            "CRITICAL", 
            "RIGHT NOW", 
            "dekiru0076@gmail.com (ADMIN)", 
            null
        );
        return ResponseEntity.ok("Email Triggered Natively to nareshkumarsitdept@gmail.com!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Login request) {
        try {
            User user = service.login(
                    request.getEmail(),
                    request.getPassword()
            );

            activityService.log(user.getEmail(), "Logged in");

            // Stamp last active date for HR Intelligence
            service.stampLastActive(user.getId());

            String token = jwtUtil.generateToken(
                    user.getEmail(),
                    user.getRole()
            );

            return ResponseEntity.ok(
                    new LoginResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole())
            );

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());
        }
    }
}
