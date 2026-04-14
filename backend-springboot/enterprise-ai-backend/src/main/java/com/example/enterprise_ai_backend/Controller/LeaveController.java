package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.LeaveRequest;
import com.example.enterprise_ai_backend.repository.LeaveRepository;
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

    public LeaveController(LeaveRepository leaveRepo) {
        this.leaveRepo = leaveRepo;
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
        return leaveRepo.save(req);
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
        req.setStatus(body.getOrDefault("status", "APPROVED"));
        req.setAdminNote(body.getOrDefault("adminNote", ""));
        leaveRepo.save(req);
        return ResponseEntity.ok(req);
    }
}
