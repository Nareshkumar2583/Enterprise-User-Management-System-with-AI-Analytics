package com.example.enterprise_ai_backend.dto;

public class LoginResponse {

    private String token;
    private String id;
    private String name;
    private String email;
    private String role;

    public LoginResponse(String token, String id, String name, String email, String role) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public String getToken() { return token; }
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}
