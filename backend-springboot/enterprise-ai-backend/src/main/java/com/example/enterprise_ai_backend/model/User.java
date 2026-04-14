package com.example.enterprise_ai_backend.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;
    @Indexed(unique = true)
    private String email;
    private String password;
    private String role;

    // Profile details
    private String department;
    private String phone;
    private String bio;
    private String profilePictureUrl;
    private java.util.List<String> skills;

    // Gamification fields
    private int points = 0;
    private java.util.List<String> badges = new java.util.ArrayList<>();
    private int level = 1;
    private int streakDays = 0;
    private String lastActiveDate;

    // getters & setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public java.util.List<String> getSkills() { return skills; }
    public void setSkills(java.util.List<String> skills) { this.skills = skills; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    public java.util.List<String> getBadges() { return badges != null ? badges : new java.util.ArrayList<>(); }
    public void setBadges(java.util.List<String> badges) { this.badges = badges; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public int getStreakDays() { return streakDays; }
    public void setStreakDays(int streakDays) { this.streakDays = streakDays; }

    public String getLastActiveDate() { return lastActiveDate; }
    public void setLastActiveDate(String lastActiveDate) { this.lastActiveDate = lastActiveDate; }

    // Advanced Security
    private boolean blocked = false;
    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }
}
