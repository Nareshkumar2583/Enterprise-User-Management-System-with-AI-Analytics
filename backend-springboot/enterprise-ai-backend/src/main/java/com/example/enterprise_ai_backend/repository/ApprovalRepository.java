package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.ApprovalRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ApprovalRepository extends MongoRepository<ApprovalRequest, String> {
    List<ApprovalRequest> findByStatus(String status, Sort sort);
    List<ApprovalRequest> findByRequesterId(String requesterId, Sort sort);
}
