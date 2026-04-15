package com.example.enterprise_ai_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "support_tickets")
public class SupportTicket {

    @Id
    private String id;
    private String userEmail;
    private String subject;
    private String body;
    
    // AI Classification Results
    private String ticketId; // AI-generated external ID
    private String department;
    private String priority;
    private String sentiment;
    private Double urgencyScore;
    private String suggestedAction;
    private Integer estimatedResolutionHours;
    
    private String status; // OPEN, IN_PROGRESS, RESOLVED
    private String createdAt;

    public SupportTicket() {
        this.status = "OPEN";
        this.createdAt = Instant.now().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getSentiment() { return sentiment; }
    public void setSentiment(String sentiment) { this.sentiment = sentiment; }
    public Double getUrgencyScore() { return urgencyScore; }
    public void setUrgencyScore(Double urgencyScore) { this.urgencyScore = urgencyScore; }
    public String getSuggestedAction() { return suggestedAction; }
    public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }
    public Integer getEstimatedResolutionHours() { return estimatedResolutionHours; }
    public void setEstimatedResolutionHours(Integer estimatedResolutionHours) { this.estimatedResolutionHours = estimatedResolutionHours; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
