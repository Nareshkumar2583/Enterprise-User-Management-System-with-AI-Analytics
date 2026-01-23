package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.Service.AiAnalyticsService;
import com.example.enterprise_ai_backend.Service.UserService;
import com.example.enterprise_ai_backend.dto.UserResponse;
import com.example.enterprise_ai_backend.model.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserService service;
    private final AiAnalyticsService aiService;

    public UserController(UserService service,AiAnalyticsService aiService) {
        this.service = service;
        this.aiService=aiService;
    }

    @GetMapping
    public List<UserResponse> getUsers() {
        return service.getAllUsers();
    }
}

