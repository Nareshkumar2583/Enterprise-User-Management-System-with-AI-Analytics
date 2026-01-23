package com.example.enterprise_ai_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "user_activity")
public class UserActivity {

    @Id
    private String id;

    private String userEmail;
    private String action;
    private LocalDateTime timestamp;

    public UserActivity(String userEmail, String action) {
        this.userEmail = userEmail;
        this.action = action;
        this.timestamp = LocalDateTime.now();
    }

    public String getUserEmail() { return userEmail; }
    public String getAction() { return action; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
