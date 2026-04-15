package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.Sprint;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SprintRepository extends MongoRepository<Sprint, String> {
    List<Sprint> findByStatus(String status);
    Optional<Sprint> findFirstByStatusOrderByCreatedAtDesc(String status);
}
