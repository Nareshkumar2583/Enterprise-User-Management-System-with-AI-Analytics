package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.Service.UserActivityService;
import com.example.enterprise_ai_backend.Service.UserService;
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

    public AuthController(
            UserService service,
            JwtUtil jwtUtil,
            UserActivityService activityService
    ) {
        this.service = service;
        this.jwtUtil = jwtUtil;
        this.activityService = activityService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User saved = service.register(user);
            activityService.log(saved.getEmail(), "Account Registered");
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Login request) {
        try {
            User user = service.login(
                    request.getEmail(),
                    request.getPassword()
            );

            activityService.log(user.getEmail(), "Logged in");

            String token = jwtUtil.generateToken(
                    user.getEmail(),
                    user.getRole()
            );

            return ResponseEntity.ok(
                    new LoginResponse(token, user.getEmail(), user.getRole())
            );

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());
        }
    }
}
