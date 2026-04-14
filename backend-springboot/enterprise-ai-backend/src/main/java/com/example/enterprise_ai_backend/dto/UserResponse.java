package com.example.enterprise_ai_backend.dto;

public class UserResponse {

    private String id;
    private String name;
    private String email;
    private String role;
    private String department;
    private String phone;
    private String bio;
    private String profilePictureUrl;
    private java.util.List<String> skills;
    
    // ML Features
    private int riskScore;
    private String riskLevel;
    private int churnProbability;
    private String segment;
    private boolean suspicious;
    private String riskReason;
    private int engagementScore;
    private String burnoutRisk;
    private String roleRecommendation;

    public UserResponse(String id, String name, String email, String role, 
                        String department, String phone, String bio, String profilePictureUrl, java.util.List<String> skills,
                        int riskScore, String riskLevel, int churnProbability, 
                        String segment, boolean suspicious, String riskReason, int engagementScore,
                        String burnoutRisk, String roleRecommendation) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.department = department;
        this.phone = phone;
        this.bio = bio;
        this.profilePictureUrl = profilePictureUrl;
        this.skills = skills;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.churnProbability = churnProbability;
        this.segment = segment;
        this.suspicious = suspicious;
        this.riskReason = riskReason;
        this.engagementScore = engagementScore;
        this.burnoutRisk = burnoutRisk;
        this.roleRecommendation = roleRecommendation;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getDepartment() { return department; }
    public String getPhone() { return phone; }
    public String getBio() { return bio; }
    public String getProfilePictureUrl() { return profilePictureUrl; }
    public java.util.List<String> getSkills() { return skills; }
    public int getRiskScore() { return riskScore; }
    public String getRiskLevel() { return riskLevel; }
    public int getChurnProbability() { return churnProbability; }
    public String getSegment() { return segment; }
    public boolean isSuspicious() { return suspicious; }
    public String getRiskReason() { return riskReason; }
    public int getEngagementScore() { return engagementScore; }
    public String getBurnoutRisk() { return burnoutRisk; }
    public String getRoleRecommendation() { return roleRecommendation; }
}
