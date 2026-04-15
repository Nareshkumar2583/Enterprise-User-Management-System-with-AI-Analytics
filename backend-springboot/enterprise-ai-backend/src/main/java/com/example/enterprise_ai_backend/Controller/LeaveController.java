package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.LeaveRequest;
import com.example.enterprise_ai_backend.model.Notification;
import com.example.enterprise_ai_backend.model.User;
import com.example.enterprise_ai_backend.repository.LeaveRepository;
import com.example.enterprise_ai_backend.repository.NotificationRepository;
import com.example.enterprise_ai_backend.repository.Userrepository;
import com.example.enterprise_ai_backend.Service.EmailService;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/leave")
@CrossOrigin
public class LeaveController {

    private final LeaveRepository leaveRepo;
    private final NotificationRepository notifRepo;
    private final Userrepository userRepo;
    private final EmailService emailService;

    public LeaveController(LeaveRepository leaveRepo, NotificationRepository notifRepo, Userrepository userRepo, EmailService emailService) {
        this.leaveRepo = leaveRepo;
        this.notifRepo = notifRepo;
        this.userRepo = userRepo;
        this.emailService = emailService;
    }

    // GET all leave requests (admin)
    @GetMapping
    public List<LeaveRequest> getAll() {
        return leaveRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // GET pending only
    @GetMapping("/pending")
    public List<LeaveRequest> getPending() {
        return leaveRepo.findByStatus("PENDING", Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // GET by user
    @GetMapping("/user/{userId}")
    public List<LeaveRequest> getByUser(@PathVariable String userId) {
        return leaveRepo.findByUserId(userId, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // POST submit leave request (user)
    @PostMapping
    public LeaveRequest submitLeave(@RequestBody LeaveRequest req) {
        req.setStatus("PENDING");
        req.setCreatedAt(Instant.now().toString());
        LeaveRequest saved = leaveRepo.save(req);

        // Notify Admin/HR (Finding an admin user)
        userRepo.findAll().stream()
            .filter(u -> "ADMIN".equals(u.getRole()) || "HR".equals(u.getRole()))
            .findFirst()
            .ifPresent(admin -> {
                notifRepo.save(new Notification(admin.getId(), "New Leave Request from User ID: " + req.getUserId(), "ALERT"));
            });

        return saved;
    }

    // GET currently approved leave (availability)
    @GetMapping("/approved")
    public List<LeaveRequest> getApproved() {
        return leaveRepo.findByStatus("APPROVED", Sort.by(Sort.Direction.ASC, "startDate"));
    }

    // PUT admin decision
    @PutMapping("/{id}/decision")
    public ResponseEntity<?> decide(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<LeaveRequest> opt = leaveRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        LeaveRequest req = opt.get();
        String newStatus = body.getOrDefault("status", "APPROVED");
        req.setStatus(newStatus);
        req.setAdminNote(body.getOrDefault("adminNote", ""));
        leaveRepo.save(req);

        // Notify User
        String msg = "Your leave request for " + req.getStartDate() + " has been " + newStatus;
        notifRepo.save(new Notification(req.getUserId(), msg, "INFO"));

        // Email User
        userRepo.findById(req.getUserId()).ifPresent(u -> {
            emailService.sendLeaveStatusEmail(u.getEmail(), newStatus, req.getStartDate(), req.getEndDate(), req.getAdminNote());
        });

        return ResponseEntity.ok(req);
    }
}
