package com.example.enterprise_ai_backend.dto;

public class UserRiskResponse {

    private int engagementScore;
    private String riskLevel;
    private int retentionProbability;
    private String recommendation;

    public UserRiskResponse(int engagementScore, String riskLevel,
                            int retentionProbability, String recommendation) {
        this.engagementScore = engagementScore;
        this.riskLevel = riskLevel;
        this.retentionProbability = retentionProbability;
        this.recommendation = recommendation;
    }

    public int getEngagementScore() { return engagementScore; }
    public String getRiskLevel() { return riskLevel; }
    public int getRetentionProbability() { return retentionProbability; }
    public String getRecommendation() { return recommendation; }
}

