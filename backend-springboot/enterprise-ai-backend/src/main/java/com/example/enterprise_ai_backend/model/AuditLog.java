package com.example.enterprise_ai_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "audit_logs")
public class AuditLog {
    
    @Id
    private String id;
    private String actorEmail;
    private String targetUserId;
    private String action;
    private String details;
    private String timestamp;

    public AuditLog() {}

    public AuditLog(String actorEmail, String targetUserId, String action, String details, String timestamp) {
        this.actorEmail = actorEmail;
        this.targetUserId = targetUserId;
        this.action = action;
        this.details = details;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }
    public String getTargetUserId() { return targetUserId; }
    public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
