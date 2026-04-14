package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.Notification;
import com.example.enterprise_ai_backend.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin
public class NotificationController {

    private final NotificationRepository repo;

    public NotificationController(NotificationRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/user/{userId}")
    public List<Notification> getUserNotifications(@PathVariable String userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/user/{userId}/unread")
    public List<Notification> getUnreadNotifications(@PathVariable String userId) {
        return repo.findByUserIdAndIsReadFalse(userId);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        Optional<Notification> opt = repo.findById(id);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setRead(true);
            repo.save(n);
            return ResponseEntity.ok(n);
        }
        return ResponseEntity.notFound().build();
    }
}
