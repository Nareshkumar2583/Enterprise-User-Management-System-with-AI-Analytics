package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
public interface Userrepository extends MongoRepository<User,String> {
    Optional<User>findByEmail(String email);
}