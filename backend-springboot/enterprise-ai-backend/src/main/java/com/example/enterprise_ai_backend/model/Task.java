package com.example.enterprise_ai_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "tasks")
public class Task {

    @Id
    private String id;
    
    private String title;
    private String description;
    private String status; // TODO, IN_PROGRESS, REVIEW, DONE
    
    // New Advanced Features
    private String dueDate; // ISO String
    private Integer timeSpentSeconds = 0;
    private java.util.List<java.util.Map<String, String>> comments = new java.util.ArrayList<>();
    private java.util.List<String> attachments = new java.util.ArrayList<>();
    private java.util.List<java.util.Map<String, String>> progressHistory = new java.util.ArrayList<>();
    
    // Assignee details
    private String assigneeId;
    private String assigneeEmail;
    
    // AI Reasoning details (if assigned via AI)
    private String aiReasoning;
    private int matchScore;
    
    // AI Task Predictions
    private Integer estimatedHours;
    private String delayRisk;
    private String priority;
    
    public Task() {}

    public Task(String title, String description, String status) {
        this.title = title;
        this.description = description;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getAssigneeId() { return assigneeId; }
    public void setAssigneeId(String assigneeId) { this.assigneeId = assigneeId; }
    
    public String getAssigneeEmail() { return assigneeEmail; }
    public void setAssigneeEmail(String assigneeEmail) { this.assigneeEmail = assigneeEmail; }
    
    public String getAiReasoning() { return aiReasoning; }
    public void setAiReasoning(String aiReasoning) { this.aiReasoning = aiReasoning; }
    
    public int getMatchScore() { return matchScore; }
    public void setMatchScore(int matchScore) { this.matchScore = matchScore; }
    
    public Integer getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Integer estimatedHours) { this.estimatedHours = estimatedHours; }
    
    public String getDelayRisk() { return delayRisk; }
    public void setDelayRisk(String delayRisk) { this.delayRisk = delayRisk; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    
    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
    
    public java.util.List<java.util.Map<String, String>> getComments() { return comments; }
    public void setComments(java.util.List<java.util.Map<String, String>> comments) { this.comments = comments; }
    
    public java.util.List<String> getAttachments() { return attachments; }
    public void setAttachments(java.util.List<String> attachments) { this.attachments = attachments; }
    
    public java.util.List<java.util.Map<String, String>> getProgressHistory() { return progressHistory; }
    public void setProgressHistory(java.util.List<java.util.Map<String, String>> progressHistory) { this.progressHistory = progressHistory; }
}
