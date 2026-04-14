package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.AuditLog;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByTargetUserId(String targetUserId, Sort sort);
    List<AuditLog> findByTargetUserIdOrderByTimestampDesc(String targetUserId);
}
