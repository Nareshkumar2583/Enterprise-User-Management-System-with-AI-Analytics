package com.example.enterprise_ai_backend.dto;
import java.util.Map;

public class AnalyticsResponse {

    private long totalUsers;
    private long adminCount;
    private long activeUsers;
    private Map<String, Long> roleDistribution;

    public AnalyticsResponse(long totalUsers, long adminCount,
                             long activeUsers, Map<String, Long> roleDistribution) {
        this.totalUsers = totalUsers;
        this.adminCount = adminCount;
        this.activeUsers = activeUsers;
        this.roleDistribution = roleDistribution;
    }

    public long getTotalUsers() { return totalUsers; }
    public long getAdminCount() { return adminCount; }
    public long getActiveUsers() { return activeUsers; }
    public Map<String, Long> getRoleDistribution() { return roleDistribution; }
}
