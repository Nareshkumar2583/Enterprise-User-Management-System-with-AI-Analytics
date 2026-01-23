package com.example.enterprise_ai_backend.Service;

import com.example.enterprise_ai_backend.model.UserActivity;
import com.example.enterprise_ai_backend.repository.UserActivityRepository;
import org.springframework.stereotype.Service;

@Service
public class UserActivityService {

    private final UserActivityRepository repo;

    public UserActivityService(UserActivityRepository repo) {
        this.repo = repo;
    }

    public void log(String email, String action) {
        repo.save(new UserActivity(email, action));
    }
}
