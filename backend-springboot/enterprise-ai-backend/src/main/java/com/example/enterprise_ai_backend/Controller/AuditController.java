package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.AuditLog;
import com.example.enterprise_ai_backend.repository.AuditRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin
public class AuditController {

    private final AuditRepository auditRepo;

    public AuditController(AuditRepository auditRepo) {
        this.auditRepo = auditRepo;
    }

    @GetMapping
    public List<AuditLog> getAllLogs() {
        return auditRepo.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
    }

    @GetMapping("/user/{userId}")
    public List<AuditLog> getUserLogs(@PathVariable String userId) {
        return auditRepo.findByTargetUserId(userId, Sort.by(Sort.Direction.DESC, "timestamp"));
    }
}
