package com.example.enterprise_ai_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String userId;      // Who receives this
    private String message;     // The alert text
    private String type;        // ALERT, INFO, DEADLINE
    private boolean isRead;
    private String createdAt;
    
    // Delivery Tracking
    private boolean emailSentStatus;
    private String emailError;

    public Notification() {}

    public Notification(String userId, String message, String type) {
        this.userId = userId;
        this.message = message;
        this.type = type;
        this.isRead = false;
        this.createdAt = Instant.now().toString();
        this.emailSentStatus = false;
        this.emailError = null;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getMessage() { return message; }
    public String getType() { return type; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public String getCreatedAt() { return createdAt; }
    
    public boolean getEmailSentStatus() { return emailSentStatus; }
    public void setEmailSentStatus(boolean status) { this.emailSentStatus = status; }
    public String getEmailError() { return emailError; }
    public void setEmailError(String error) { this.emailError = error; }
}
