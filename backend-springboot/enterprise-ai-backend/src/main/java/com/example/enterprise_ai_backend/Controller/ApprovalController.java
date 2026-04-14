package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.ApprovalRequest;
import com.example.enterprise_ai_backend.repository.ApprovalRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/approvals")
@CrossOrigin
public class ApprovalController {

    private final ApprovalRepository approvalRepo;

    public ApprovalController(ApprovalRepository approvalRepo) {
        this.approvalRepo = approvalRepo;
    }

    // GET all approvals (admin)
    @GetMapping
    public List<ApprovalRequest> getAll() {
        return approvalRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // GET pending only
    @GetMapping("/pending")
    public List<ApprovalRequest> getPending() {
        return approvalRepo.findByStatus("PENDING", Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // GET by requester (user's own requests)
    @GetMapping("/user/{userId}")
    public List<ApprovalRequest> getByUser(@PathVariable String userId) {
        return approvalRepo.findByRequesterId(userId, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // POST submit a new request (user)
    @PostMapping
    public ApprovalRequest submit(@RequestBody ApprovalRequest req) {
        req.setStatus("PENDING");
        req.setCreatedAt(Instant.now().toString());
        return approvalRepo.save(req);
    }

    // PUT admin decision: approve or reject
    @PutMapping("/{id}/decision")
    public ResponseEntity<?> decide(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<ApprovalRequest> opt = approvalRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ApprovalRequest req = opt.get();
        req.setStatus(body.getOrDefault("status", "APPROVED"));
        req.setAdminNote(body.getOrDefault("adminNote", ""));
        req.setResolvedAt(Instant.now().toString());
        approvalRepo.save(req);
        return ResponseEntity.ok(req);
    }
}
