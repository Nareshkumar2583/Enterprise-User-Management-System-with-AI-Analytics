package com.example.enterprise_ai_backend.Service;

import com.example.enterprise_ai_backend.model.LoginActivity;
import com.example.enterprise_ai_backend.repository.LoginActivityRepository;
import com.example.enterprise_ai_backend.repository.Userrepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminAnalyticsService {

    private final Userrepository userRepo;
    private final LoginActivityRepository activityRepo;

    public AdminAnalyticsService(Userrepository userRepo,
                                 LoginActivityRepository activityRepo){
        this.userRepo=userRepo;
        this.activityRepo=activityRepo;
    }

    /* ---------------- TOTAL USERS ---------------- */
    public long totalUsers() {
        return userRepo.count();
    }

    /* ---------------- ADMIN COUNT ---------------- */
    public long adminCount() {
        return userRepo.findAll()
                .stream()
                .filter(u -> "ADMIN".equals(u.getRole()))
                .count();
    }

    /* ---------------- ACTIVE USERS (7 DAYS) ---------------- */
    public long activeUsersLast7Days() {
        LocalDate cutoff = LocalDate.now().minusDays(7);

        return activityRepo.findAll()
                .stream()
                .filter(a -> a.getDate().isAfter(cutoff))
                .map(LoginActivity::getEmail)
                .distinct()
                .count();
    }

    /* ---------------- ENGAGEMENT SCORE ---------------- */
    public int engagementScore() {
        long total = totalUsers();
        if (total == 0) return 0;

        long active = activeUsersLast7Days();
        return (int) ((active * 100) / total);
    }

    /* ---------------- ROLE DISTRIBUTION ---------------- */
    public Map<String, Long> roleDistribution() {
        Map<String, Long> map = new HashMap<>();

        userRepo.findAll().forEach(u ->
                map.put(u.getRole(),
                        map.getOrDefault(u.getRole(), 0L) + 1)
        );

        return map;
    }

    /* ---------------- ROLE RISK ANALYSIS ---------------- */
    public String roleRiskInsight() {
        long admins = adminCount();
        long total = totalUsers();

        if (total == 0) return "No users";

        double ratio = (double) admins / total;

        if (ratio > 0.2) return "High admin privilege risk";
        if (ratio < 0.05) return "Admin shortage risk";
        return "Admin ratio healthy";
    }

    /* ---------------- INACTIVE USERS ---------------- */
    public long inactiveUsers() {
        long active = activeUsersLast7Days();
        return totalUsers() - active;
    }

    /* ---------------- RISK LEVEL ---------------- */
    public String inactivityRiskLevel() {
        long inactive = inactiveUsers();

        if (inactive > 10) return "HIGH";
        if (inactive > 3) return "MEDIUM";
        return "LOW";
    }

    /* ---------------- PREDICTIVE ANALYTICS ---------------- */
    public int predictNextWeekLogins() {
        List<LoginActivity> last7Days = activityRepo.findAll()
                .stream()
                .filter(a -> a.getDate().isAfter(LocalDate.now().minusDays(7)))
                .toList();

        if (last7Days.isEmpty()) return 0;

        int total = last7Days.stream()
                .mapToInt(LoginActivity::getCount)
                .sum();

        int avg = total / last7Days.size();

        // simple AI-style growth assumption (+10%)
        return (int) (avg * 7 * 1.1);
    }

    /* ---------------- FINAL ANALYTICS MAP ---------------- */
    public Map<String, Object> buildAnalytics() {
        Map<String, Object> data = new HashMap<>();

        data.put("totalUsers", totalUsers());
        data.put("adminCount", adminCount());
        data.put("activeUsers", activeUsersLast7Days());
        data.put("engagementScore", engagementScore());
        data.put("roleDistribution", roleDistribution());
        data.put("roleInsight", roleRiskInsight());
        data.put("inactiveUsers", inactiveUsers());
        data.put("riskLevel", inactivityRiskLevel());
        data.put("predictedLoginsNextWeek", predictNextWeekLogins());

        return data;
    }
}
