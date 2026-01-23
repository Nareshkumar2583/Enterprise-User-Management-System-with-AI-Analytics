package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.Service.AiAnalyticsService;
import com.example.enterprise_ai_backend.dto.UserRiskResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin
public class UserAnalyticsController {

    private final AiAnalyticsService aiService;

    public UserAnalyticsController(AiAnalyticsService aiService) {
        this.aiService = aiService;
    }

    // 🔥 AI Risk & Retention Prediction
    @GetMapping("/risk-analysis")
    public UserRiskResponse getRiskAnalysis() {

        // TEMP value (later connect to DB)
        int totalLogins = 42;

        return aiService.analyzeUser(totalLogins);
    }
}
