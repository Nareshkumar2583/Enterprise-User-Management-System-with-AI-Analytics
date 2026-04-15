package com.example.enterprise_ai_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "standup_logs")
public class StandupLog {

    @Id
    private String id;

    private String userId;
    private String userEmail;
    private String sprintId;
    private String date; // YYYY-MM-DD

    private String yesterday;  // what did you do yesterday
    private String today;      // what will you do today
    private String blockers;   // any blockers

    private String createdAt;
    private String mood; // GREAT | GOOD | STRUGGLING | BLOCKED

    public StandupLog() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getSprintId() { return sprintId; }
    public void setSprintId(String sprintId) { this.sprintId = sprintId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getYesterday() { return yesterday; }
    public void setYesterday(String yesterday) { this.yesterday = yesterday; }

    public String getToday() { return today; }
    public void setToday(String today) { this.today = today; }

    public String getBlockers() { return blockers; }
    public void setBlockers(String blockers) { this.blockers = blockers; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }
}
