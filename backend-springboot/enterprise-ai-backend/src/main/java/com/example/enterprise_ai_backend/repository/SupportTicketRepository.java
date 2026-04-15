package com.example.enterprise_ai_backend.repository;

import com.example.enterprise_ai_backend.model.SupportTicket;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SupportTicketRepository extends MongoRepository<SupportTicket, String> {
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
    List<SupportTicket> findByUserEmailOrderByCreatedAtDesc(String userEmail);
}
