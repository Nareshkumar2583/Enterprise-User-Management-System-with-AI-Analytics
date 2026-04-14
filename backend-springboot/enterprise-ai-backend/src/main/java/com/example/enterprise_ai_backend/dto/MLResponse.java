package com.example.enterprise_ai_backend.dto;

public class MLResponse {
    private String userId;
    private int riskScore;
    private String riskLevel;
    private int churnProbability;
    private String segment;
    private boolean suspicious;
    private String riskReason;
    private int engagementScore;
    private String burnoutRisk;
    private String roleRecommendation;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public int getChurnProbability() { return churnProbability; }
    public void setChurnProbability(int churnProbability) { this.churnProbability = churnProbability; }

    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }

    public boolean isSuspicious() { return suspicious; }
    public void setSuspicious(boolean suspicious) { this.suspicious = suspicious; }

    public String getRiskReason() { return riskReason; }
    public void setRiskReason(String riskReason) { this.riskReason = riskReason; }

    public int getEngagementScore() { return engagementScore; }
    public void setEngagementScore(int engagementScore) { this.engagementScore = engagementScore; }

    public String getBurnoutRisk() { return burnoutRisk; }
    public void setBurnoutRisk(String burnoutRisk) { this.burnoutRisk = burnoutRisk; }

    public String getRoleRecommendation() { return roleRecommendation; }
    public void setRoleRecommendation(String roleRecommendation) { this.roleRecommendation = roleRecommendation; }
}
