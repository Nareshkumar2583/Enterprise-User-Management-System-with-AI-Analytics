package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.Service.AiAnalyticsService;
import com.example.enterprise_ai_backend.dto.UserRiskResponse;
import com.example.enterprise_ai_backend.model.User;
import com.example.enterprise_ai_backend.repository.Userrepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin
public class UserAnalyticsController {

    private final AiAnalyticsService aiService;
    private final RestTemplate restTemplate;
    private final Userrepository userRepo;
    private final String FASTAPI_URL = "http://localhost:8000";

    public UserAnalyticsController(AiAnalyticsService aiService, RestTemplate restTemplate, Userrepository userRepo) {
        this.aiService = aiService;
        this.restTemplate = restTemplate;
        this.userRepo = userRepo;
    }

    // GET /api/user/me — fetch own profile (USER role)
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> opt = userRepo.findByEmail(email);
            if (opt.isEmpty()) return ResponseEntity.status(401).build();
            return ResponseEntity.ok(opt.get());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 🔥 AI Risk & Retention Prediction
    @GetMapping("/risk-analysis")
    public ResponseEntity<?> getRiskAnalysis(Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> optionalUser = userRepo.findByEmail(email);
            if(optionalUser.isEmpty()) return ResponseEntity.badRequest().body("User not found");
            User user = optionalUser.get();
            
            // Map payload
            Map<String, String> payload = new HashMap<>();
            payload.put("id", user.getId());
            payload.put("email", user.getEmail());
            payload.put("role", user.getRole());

            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/analyze_user", payload, Map.class);
            
            // Map FastAPI response keys to what the frontend expects historically + new ones
            Map<String, Object> finalRes = new HashMap<>();
            finalRes.put("engagementScore", result.get("engagementScore"));
            finalRes.put("riskLevel", result.get("riskLevel"));
            finalRes.put("retentionProbability", 100 - (int)result.get("churnProbability"));
            finalRes.put("recommendation", result.get("roleRecommendation"));
            finalRes.put("productivityScore", result.get("engagementScore")); // Map directly for now
            finalRes.put("nextBestTask", "Review High-Priority Security Tickets"); // Demo
            
            return ResponseEntity.ok(finalRes);
        } catch(Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // GET /api/user/forecast
    @GetMapping("/forecast")
    public ResponseEntity<?> getForecast(Authentication auth) {
        try {
            String email = auth.getName(); // JWT extracts email
            Optional<User> optionalUser = userRepo.findByEmail(email);
            if(optionalUser.isEmpty()) return ResponseEntity.badRequest().body("User not found");
            User user = optionalUser.get();
            
            Map<String, String> payload = new HashMap<>();
            payload.put("userId", user.getId());
            payload.put("email", user.getEmail());

            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/forecast_performance", payload, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // POST /api/user/route-ticket
    @PostMapping("/route-ticket")
    public ResponseEntity<?> routeTicket(@RequestBody Map<String, String> request) {
        try {
            String text = request.getOrDefault("text", "");
            
            Map<String, String> payload = new HashMap<>();
            payload.put("text", text);

            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/route_ticket", payload, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/track-activity
    @PostMapping("/track-activity")
    public ResponseEntity<?> trackActivity(@RequestBody Map<String, Object> request, Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> optionalUser = userRepo.findByEmail(email);
            if(optionalUser.isEmpty()) return ResponseEntity.status(401).build();
            User user = optionalUser.get();

            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", user.getId());
            payload.put("action", request.getOrDefault("action", "unknown"));
            
            // Handle numeric duration safely
            Object durObj = request.getOrDefault("duration", 0.0);
            double duration = 0.0;
            if(durObj instanceof Number) {
                duration = ((Number)durObj).doubleValue();
            } else if(durObj instanceof String) {
                duration = Double.parseDouble((String)durObj);
            }
            payload.put("duration", duration);

            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/track_activity", payload, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Behavior Tracking failed: " + e.getMessage());
            // Return OK so frontend doesn't crash on silently failed ML tracking
            return ResponseEntity.ok(Map.of("anomaly_score", 0.0, "is_anomaly", false));
        }
    }

    // ─── WAVE 6: ADVANCED USER AI FEATURES ────────────────────────────────────────

    // POST /api/user/ai-assistant
    @PostMapping("/ai-assistant")
    public ResponseEntity<?> aiAssistant(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> opt = userRepo.findByEmail(email);
            if (opt.isEmpty()) return ResponseEntity.status(401).build();
            User user = opt.get();
            body.put("userId", user.getId());
            body.put("email", user.getEmail());
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/user_ai_assistant", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/daily-planner
    @PostMapping("/daily-planner")
    public ResponseEntity<?> dailyPlanner(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> opt = userRepo.findByEmail(email);
            if (opt.isEmpty()) return ResponseEntity.status(401).build();
            User user = opt.get();
            body.put("userId", user.getId());
            body.put("email", user.getEmail());
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/daily_planner", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/workload-prediction
    @PostMapping("/workload-prediction")
    public ResponseEntity<?> workloadPrediction(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> opt = userRepo.findByEmail(email);
            if (opt.isEmpty()) return ResponseEntity.status(401).build();
            User user = opt.get();
            body.put("userId", user.getId());
            body.put("email", user.getEmail());
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/workload_prediction", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/collaboration-suggestions
    @PostMapping("/collaboration-suggestions")
    public ResponseEntity<?> collaborationSuggestions(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> opt = userRepo.findByEmail(email);
            if (opt.isEmpty()) return ResponseEntity.status(401).build();
            User user = opt.get();
            body.put("userId", user.getId());
            body.put("email", user.getEmail());
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/collaboration_suggestions", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/growth-insights
    @PostMapping("/growth-insights")
    public ResponseEntity<?> growthInsights(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> opt = userRepo.findByEmail(email);
            if (opt.isEmpty()) return ResponseEntity.status(401).build();
            User user = opt.get();
            body.put("userId", user.getId());
            body.put("email", user.getEmail());
            body.put("skills", user.getSkills() != null ? user.getSkills() : new java.util.ArrayList<>());
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/growth_insights", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/summarize-task
    @PostMapping("/summarize-task")
    public ResponseEntity<?> summarizeTask(@RequestBody Map<String, Object> body) {
        try {
            Map<?,?> result = restTemplate.postForObject(FASTAPI_URL + "/auto_summarize_task", body, Map.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/user/award-points — Awards gamification points when task completed
    @PostMapping("/award-points")
    public ResponseEntity<?> awardPoints(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            String email = auth.getName();
            Optional<User> opt = userRepo.findByEmail(email);
            if (opt.isEmpty()) return ResponseEntity.status(401).build();
            User user = opt.get();

            int pointsToAdd = body.containsKey("points") ? ((Number) body.get("points")).intValue() : 10;
            String badgeToAdd = (String) body.get("badge");

            user.setPoints(user.getPoints() + pointsToAdd);
            user.setLevel(Math.max(1, user.getPoints() / 100));

            java.util.List<String> badges = new java.util.ArrayList<>(user.getBadges());
            if (badgeToAdd != null && !badgeToAdd.isEmpty() && !badges.contains(badgeToAdd)) {
                badges.add(badgeToAdd);
            }
            // Auto milestone badges
            if (user.getPoints() >= 50 && !badges.contains("\uD83C\uDF1F Rising Star")) badges.add("\uD83C\uDF1F Rising Star");
            if (user.getPoints() >= 100 && !badges.contains("\uD83D\uDD25 Task Master")) badges.add("\uD83D\uDD25 Task Master");
            if (user.getPoints() >= 250 && !badges.contains("\uD83C\uDFC6 Legend")) badges.add("\uD83C\uDFC6 Legend");
            if (user.getPoints() >= 500 && !badges.contains("\uD83D\uDC8E Elite")) badges.add("\uD83D\uDC8E Elite");
            user.setBadges(badges);

            userRepo.save(user);
            return ResponseEntity.ok(Map.of("points", user.getPoints(), "level", user.getLevel(), "badges", user.getBadges()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/user/leaderboard — Returns all users ranked by points
    @GetMapping("/leaderboard")
    public ResponseEntity<?> leaderboard() {
        try {
            java.util.List<Map<String, Object>> board = userRepo.findAll().stream()
                .sorted((a, b) -> b.getPoints() - a.getPoints())
                .limit(10)
                .map(u -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("name", u.getName() != null ? u.getName() : u.getEmail().split("@")[0]);
                    entry.put("email", u.getEmail());
                    entry.put("points", u.getPoints());
                    entry.put("level", u.getLevel());
                    entry.put("badges", u.getBadges());
                    return entry;
                })
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(board);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

