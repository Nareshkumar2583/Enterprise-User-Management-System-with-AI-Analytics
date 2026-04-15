package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByAssigneeId(String assigneeId);
    List<Task> findBySprintId(String sprintId);
    List<Task> findBySprintIdIsNull();
    List<Task> findByAssigneeIdAndSprintId(String assigneeId, String sprintId);
}
