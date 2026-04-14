package com.example.enterprise_ai_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "approval_requests")
public class ApprovalRequest {

    @Id
    private String id;
    private String requesterId;
    private String requesterEmail;
    private String type;        // ROLE_CHANGE | ACCESS_REQUEST | TASK_COMPLETE | OTHER
    private String description;
    private String status;      // PENDING | APPROVED | REJECTED
    private String adminNote;
    private String createdAt;
    private String resolvedAt;

    public ApprovalRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRequesterId() { return requesterId; }
    public void setRequesterId(String requesterId) { this.requesterId = requesterId; }
    public String getRequesterEmail() { return requesterEmail; }
    public void setRequesterEmail(String requesterEmail) { this.requesterEmail = requesterEmail; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(String resolvedAt) { this.resolvedAt = resolvedAt; }
}
