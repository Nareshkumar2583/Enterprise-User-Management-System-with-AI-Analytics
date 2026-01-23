package com.example.enterprise_ai_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "login_activity")
public class LoginActivity {

    @Id
    private String id;

    private String email;
    private LocalDate date;
    private int count;

    // getters & setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
}

