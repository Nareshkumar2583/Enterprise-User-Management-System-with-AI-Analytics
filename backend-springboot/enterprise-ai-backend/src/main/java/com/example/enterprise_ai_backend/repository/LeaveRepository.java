package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.LeaveRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface LeaveRepository extends MongoRepository<LeaveRequest, String> {
    List<LeaveRequest> findByStatus(String status, Sort sort);
    List<LeaveRequest> findByUserId(String userId, Sort sort);
}
