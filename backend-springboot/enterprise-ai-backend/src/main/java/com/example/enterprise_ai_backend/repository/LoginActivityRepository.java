package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.LoginActivity;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface LoginActivityRepository
        extends MongoRepository<LoginActivity, String> {

    Optional<LoginActivity> findByDate(LocalDate date);
}

