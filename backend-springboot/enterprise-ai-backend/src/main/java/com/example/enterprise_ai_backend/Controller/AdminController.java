package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.Service.AdminAnalyticsService;
import com.example.enterprise_ai_backend.Service.UserService;
import com.example.enterprise_ai_backend.dto.UserResponse;
import com.example.enterprise_ai_backend.repository.LoginActivityRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    private final UserService userService;
    private final LoginActivityRepository activityRepo;
    private final AdminAnalyticsService analyticsService;

    public AdminController(UserService userService,
                           LoginActivityRepository activityRepo,AdminAnalyticsService analyticsService) {
        this.userService = userService;
        this.activityRepo = activityRepo;
        this.analyticsService=analyticsService;
    }

    // ✅ GET ALL USERS
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // ✅ GET SINGLE USER
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // ✅ DELETE USER
    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted");
    }

    // ✅ PROMOTE USER → ADMIN
    @PutMapping("/users/{id}/promote")
    public ResponseEntity<String> promoteUser(@PathVariable String id) {
        userService.promoteToAdmin(id);
        return ResponseEntity.ok("User promoted to ADMIN");
    }

    // ✅ DEMOTE ADMIN → USER
    @PutMapping("/users/{id}/demote")
    public ResponseEntity<String> demoteUser(@PathVariable String id) {
        userService.demoteToUser(id);
        return ResponseEntity.ok("User demoted to USER");
    }

    // ✅ LOGIN ACTIVITY (for chart)
    @GetMapping("/activity")
    public List<Map<String, Object>> getLoginActivity() {
        return activityRepo.findAll()
                .stream()
                .map(a -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("date", a.getDate().toString());
                    map.put("logins", a.getCount());
                    return map;
                })
                .toList();
    }
    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics() {
        return analyticsService.buildAnalytics();
    }

    // 🚫 BLOCK USER
    @PutMapping("/users/{id}/block")
    public ResponseEntity<String> blockUser(@PathVariable String id) {
        userService.blockUser(id, true);
        return ResponseEntity.ok("User account suspended.");
    }

    // ✅ UNBLOCK USER
    @PutMapping("/users/{id}/unblock")
    public ResponseEntity<String> unblockUser(@PathVariable String id) {
        userService.blockUser(id, false);
        return ResponseEntity.ok("User account restored.");
    }
}
