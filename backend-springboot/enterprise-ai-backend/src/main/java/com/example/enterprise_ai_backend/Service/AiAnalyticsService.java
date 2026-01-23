package com.example.enterprise_ai_backend.Service;
import com.example.enterprise_ai_backend.dto.UserRiskResponse;
import org.springframework.stereotype.Service;

@Service
public class AiAnalyticsService {

    public UserRiskResponse analyzeUser(int totalLogins) {

        int score;
        String risk;
        int retention;
        String recommendation;

        if (totalLogins > 40) {
            score = 85;
            risk = "LOW";
            retention = 92;
            recommendation = "User is highly engaged. Maintain experience.";
        }
        else if (totalLogins >= 20) {
            score = 65;
            risk = "MEDIUM";
            retention = 72;
            recommendation = "Encourage more engagement with notifications.";
        }
        else {
            score = 40;
            risk = "HIGH";
            retention = 45;
            recommendation = "Send re-engagement email or offer.";
        }

        return new UserRiskResponse(score, risk, retention, recommendation);
    }
}

