package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.UserActivity;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface UserActivityRepository
        extends MongoRepository<UserActivity, String> {

    List<UserActivity> findByUserEmailOrderByTimestampDesc(String userEmail);
}
