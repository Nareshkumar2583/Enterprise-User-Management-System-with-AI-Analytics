package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.Service.AdminAnalyticsService;
import com.example.enterprise_ai_backend.dto.AnalyticsResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminAnalyticsController {

    private final AdminAnalyticsService analyticsService;

    public AdminAnalyticsController(AdminAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

}

