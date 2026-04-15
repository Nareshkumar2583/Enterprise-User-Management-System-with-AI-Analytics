package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.Notification;
import com.example.enterprise_ai_backend.model.User;
import com.example.enterprise_ai_backend.repository.NotificationRepository;
import com.example.enterprise_ai_backend.repository.Userrepository;
import com.example.enterprise_ai_backend.Service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin
public class NotificationController {

    private final NotificationRepository repo;
    private final Userrepository userRepo;
    private final EmailService emailService;

    public NotificationController(NotificationRepository repo, Userrepository userRepo, EmailService emailService) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.emailService = emailService;
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
        try {
            Optional<Notification> opt = repo.findById(id);
            if (opt.isPresent()) {
                Notification n = opt.get();
                n.setRead(true);
                repo.save(n);
                return ResponseEntity.ok(n);
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());
        }
    }
}
