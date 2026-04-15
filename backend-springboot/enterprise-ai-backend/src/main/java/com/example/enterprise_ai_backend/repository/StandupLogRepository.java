package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.StandupLog;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface StandupLogRepository extends MongoRepository<StandupLog, String> {
    List<StandupLog> findBySprintId(String sprintId);
    List<StandupLog> findByUserIdAndSprintId(String userId, String sprintId);
    List<StandupLog> findBySprintIdOrderByCreatedAtDesc(String sprintId);
}
