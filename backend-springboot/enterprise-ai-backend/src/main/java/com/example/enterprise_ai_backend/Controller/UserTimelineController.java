package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.UserActivity;
import com.example.enterprise_ai_backend.repository.UserActivityRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@CrossOrigin
public class UserTimelineController {

    private final UserActivityRepository repo;

    public UserTimelineController(UserActivityRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/timeline")
    public List<UserActivity> getTimeline(Authentication auth) {
        return repo.findByUserEmailOrderByTimestampDesc(auth.getName());
    }
}

