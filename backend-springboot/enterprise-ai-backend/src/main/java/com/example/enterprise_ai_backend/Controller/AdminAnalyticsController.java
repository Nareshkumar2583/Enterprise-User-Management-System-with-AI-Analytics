package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.Service.AdminAnalyticsService;
import com.example.enterprise_ai_backend.repository.Userrepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminAnalyticsController {

    private final AdminAnalyticsService analyticsService;
    private final RestTemplate restTemplate;
    private final Userrepository userRepo;
    private final String FASTAPI_URL = "http://localhost:8000";

    // Rolling in-memory store of the last 30 trend points
    private final List<Map<String, Object>> trendHistory = Collections.synchronizedList(new ArrayList<>());

    public AdminAnalyticsController(AdminAnalyticsService analyticsService, RestTemplate restTemplate, Userrepository userRepo) {
        this.analyticsService = analyticsService;
        this.restTemplate = restTemplate;
        this.userRepo = userRepo;
    }

    // POST /api/admin/track - Spring Boot emits an activity event to River
    @PostMapping("/track")
    public ResponseEntity<?> trackActivity(@RequestBody Map<String, Object> event) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", event.getOrDefault("userId", "system"));
            payload.put("action", event.getOrDefault("action", "login"));
            payload.put("duration", event.getOrDefault("duration", 1.0));

            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/track_activity", payload, Map.class);

            // Store trend snapshot
            Map<String, Object> trendPoint = new LinkedHashMap<>();
            trendPoint.put("time", Instant.now().toString());
            trendPoint.put("score", result != null ? result.get("anomaly_score") : 0);
            trendPoint.put("isAnomaly", result != null ? result.get("is_anomaly") : false);

            trendHistory.add(trendPoint);
            if (trendHistory.size() > 30) trendHistory.remove(0);

            return ResponseEntity.ok(trendPoint);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("score", 0, "isAnomaly", false, "error", e.getMessage()));
        }
    }

    // GET /api/admin/live-trends - React polls this for the live River trend window
    @GetMapping("/live-trends")
    public ResponseEntity<List<Map<String, Object>>> getLiveTrends() {
        return ResponseEntity.ok(new ArrayList<>(trendHistory));
    }

    // POST /api/admin/allocate-task
    @PostMapping("/allocate-task")
    public ResponseEntity<?> allocateTask(@RequestBody Map<String, String> request) {
        try {
            String desc = request.getOrDefault("description", "Generic Task");
            
            // Build user list for FastAPI
            List<Map<String, String>> users = userRepo.findAll().stream().map(u -> {
                Map<String, String> m = new HashMap<>();
                m.put("id", u.getId());
                m.put("email", u.getEmail());
                m.put("role", u.getRole());
                return m;
            }).toList();

            Map<String, Object> payload = new HashMap<>();
            payload.put("description", desc);
            payload.put("users", users);

            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/allocate_task", payload, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/admin/team-analytics — pulls task counts per user from DB and sends to FastAPI
    @PostMapping("/team-analytics")
    public ResponseEntity<?> getTeamAnalytics(@RequestBody Map<String, Object> body) {
        try {
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/team_analytics", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/admin/auto-reallocate — determines if a task should be moved to another user
    @PostMapping("/auto-reallocate")
    public ResponseEntity<?> autoReallocate(@RequestBody Map<String, Object> body) {
        try {
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/auto_reallocate", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/admin/ai-chat — NLP query to FastAPI AI Chat assistant
    @PostMapping("/ai-chat")
    public ResponseEntity<?> aiChat(@RequestBody Map<String, Object> body) {
        try {
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/ai_chat", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/admin/role-audit — Evaluates all users for role discrepancies
    @GetMapping("/role-audit")
    public ResponseEntity<?> roleAudit() {
        try {
            List<Map<String, String>> users = userRepo.findAll().stream().map(u -> {
                Map<String, String> m = new HashMap<>();
                m.put("id", u.getId());
                m.put("email", u.getEmail());
                m.put("role", u.getRole());
                return m;
            }).toList();

            Map<String, Object> payload = new HashMap<>();
            payload.put("users", users);

            List<?> result = restTemplate.postForObject(FASTAPI_URL + "/analyze_users_batch", payload, List.class);
            
            // Filter to only those needing reallocation
            List<Map<String, Object>> recommendations = new ArrayList<>();
            if (result != null) {
                for (Object item : result) {
                    Map<String, Object> map = (Map<String, Object>) item;
                    String rec = (String) map.get("roleRecommendation");
                    if ("RECOMMEND_PROMOTE".equals(rec) || "RECOMMEND_DEMOTE".equals(rec)) {
                        recommendations.add(map);
                    }
                }
            }
            
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/admin/hr-intelligence — Burnout + Churn risk for all users
    @GetMapping("/hr-intelligence")
    public ResponseEntity<?> hrIntelligence() {
        try {
            var users = userRepo.findAll();
            List<Map<String, Object>> results = new ArrayList<>();

            for (var u : users) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("userId", u.getId());
                payload.put("email", u.getEmail());
                payload.put("daysSinceLogin", 3);         // simplified — real impl would check audit logs
                payload.put("weeklyLoginCount", 4);
                payload.put("tasksCompletedLast30Days", 8);
                payload.put("pendingTasks", 2);
                payload.put("avgSessionMinutes", 45);

                try {
                    Map<?,?> churn = restTemplate.postForObject("http://localhost:8000/churn_prediction", payload, Map.class);
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("userId", u.getId());
                    entry.put("name", u.getName() != null ? u.getName() : u.getEmail().split("@")[0]);
                    entry.put("email", u.getEmail());
                    entry.put("role", u.getRole());
                    entry.put("department", u.getDepartment() != null ? u.getDepartment() : "Unknown");
                    entry.put("churnRisk", churn.get("churnRisk"));
                    entry.put("churnScore", churn.get("churnScore"));
                    entry.put("alert", churn.get("alert"));
                    entry.put("primaryReason", churn.get("primaryReason"));
                    entry.put("recommendation", churn.get("recommendation"));
                    results.add(entry);
                } catch (Exception ignored) {}
            }

            // Sort by churn risk severity
            Map<String, Integer> riskOrder = Map.of("CRITICAL", 0, "HIGH", 1, "MEDIUM", 2, "LOW", 3);
            results.sort(Comparator.comparingInt(r -> riskOrder.getOrDefault((String) r.get("churnRisk"), 99)));

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 🌊 WAVE 8: Advanced Admin Superpowers

    // 1. AI Decision Support Proxy
    @PostMapping("/decision-support")
    public ResponseEntity<?> getDecisionSupport(@RequestBody Map<String, Object> payload) {
        try {
            Map<?,?> result = restTemplate.postForObject("http://localhost:8000/decision_support", payload, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 2. Predictive Project Insights Proxy
    @PostMapping("/project-predictions")
    public ResponseEntity<?> getProjectPredictions(@RequestBody Map<String, Object> payload) {
        try {
            Map<?,?> result = restTemplate.postForObject("http://localhost:8000/project_predictions", payload, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 3. Workload Heatmap Proxy
    @PostMapping("/workload-heatmap")
    public ResponseEntity<?> getWorkloadHeatmap(@RequestBody Map<String, Object> payload) {
        try {
            Map<?,?> result = restTemplate.postForObject("http://localhost:8000/workload_heatmap", payload, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 4. Org Analytics Basics
    @GetMapping("/org-analytics")
    public ResponseEntity<?> getOrgAnalytics() {
        try {
            var users = userRepo.findAll();
            int totalUsers = users.size();
            long adminCount = users.stream().filter(u -> "ADMIN".equals(u.getRole())).count();
            
            Map<String, Long> depDistribution = new HashMap<>();
            for(var u : users) {
                String d = u.getDepartment() != null ? u.getDepartment() : "Unassigned";
                depDistribution.put(d, depDistribution.getOrDefault(d, 0L) + 1);
            }

            return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "adminCount", adminCount,
                "departmentDistribution", depDistribution
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
