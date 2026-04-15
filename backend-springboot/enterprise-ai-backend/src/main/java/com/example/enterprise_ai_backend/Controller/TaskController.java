package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.AuditLog;
import com.example.enterprise_ai_backend.model.Task;
import com.example.enterprise_ai_backend.model.User;
import com.example.enterprise_ai_backend.model.Notification;
import com.example.enterprise_ai_backend.repository.AuditRepository;
import com.example.enterprise_ai_backend.repository.TaskRepository;
import com.example.enterprise_ai_backend.repository.NotificationRepository;
import com.example.enterprise_ai_backend.repository.Userrepository;
import com.example.enterprise_ai_backend.Service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin
public class TaskController {

    private final TaskRepository taskRepo;
    private final AuditRepository auditRepo;
    private final NotificationRepository notifRepo;
    private final Userrepository userRepo;
    private final EmailService emailService;
    private final RestTemplate restTemplate;
    private final String FASTAPI_URL = "http://localhost:8000";

    public TaskController(TaskRepository taskRepo, AuditRepository auditRepo, NotificationRepository notifRepo, Userrepository userRepo, RestTemplate restTemplate, EmailService emailService) {
        this.taskRepo = taskRepo;
        this.auditRepo = auditRepo;
        this.notifRepo = notifRepo;
        this.userRepo = userRepo;
        this.restTemplate = restTemplate;
        this.emailService = emailService;
    }

    private void logAudit(String actor, String target, String action, String details) {
        AuditLog log = new AuditLog(actor, target, action, details, Instant.now().toString());
        auditRepo.save(log);
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepo.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Task> getTasksByUser(@PathVariable String userId) {
        return taskRepo.findByAssigneeId(userId);
    }

    @PostMapping
    public Task createTask(@RequestBody Task task, Authentication auth) {
        if (task.getStatus() == null || task.getStatus().isEmpty()) {
            task.setStatus("TODO");
        }
        
        // Ping FastAPI for Task Metrics Prediction
        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("description", task.getTitle() + " " + task.getDescription());
            payload.put("assigneeEmail", task.getAssigneeEmail() != null ? task.getAssigneeEmail() : "unknown@user.com");
            
            Map<?,?> pred = restTemplate.postForObject(FASTAPI_URL + "/predict_task_metrics", payload, Map.class);
            if (pred != null) {
                task.setEstimatedHours(pred.get("estimatedHours") instanceof Number ? ((Number) pred.get("estimatedHours")).intValue() : null);
                task.setDelayRisk((String) pred.get("delayRisk"));
                task.setPriority((String) pred.get("priority"));
            }
        } catch (Exception e) {
            System.err.println("Failed to reach ML engine for predictions: " + e.getMessage());
        }

        Task saved = taskRepo.save(task);

        String actor = auth != null && auth.getName() != null ? auth.getName() : "System";
        logAudit(actor, task.getAssigneeId(), "TASK_CREATED", "Task created: '" + task.getTitle() + "'. Expected Risk: " + task.getDelayRisk());
        
        if (task.getAssigneeId() != null) {
            String msg = "New tracked task assigned: " + task.getTitle() + " (" + task.getPriority() + ")";
            String type = "CRITICAL".equals(task.getPriority()) ? "ALERT" : "INFO";
            Notification savedNotif = notifRepo.save(new Notification(task.getAssigneeId(), msg, type));
            
            // ✉️ Send Async Email Alert
            String targetEmail = task.getAssigneeEmail();
            if ((targetEmail == null || targetEmail.isEmpty()) && task.getAssigneeId() != null) {
                targetEmail = userRepo.findById(task.getAssigneeId()).map(User::getEmail).orElse(null);
            }
            if (targetEmail != null) {
                emailService.sendTaskAllocationEmail(targetEmail, task.getTitle(), task.getPriority(), task.getDueDate(), actor, savedNotif.getId());
            }
        }

        return saved;
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateTaskStatus(@PathVariable String id, @RequestBody java.util.Map<String, String> body, Authentication auth) {
        String newStatus = body.get("status");
        Optional<Task> opt = taskRepo.findById(id);
        
        if (opt.isPresent()) {
            Task task = opt.get();
            String oldStatus = task.getStatus();
            task.setStatus(newStatus);
            
            // Add progress history entry
            Map<String, String> historyEntry = new HashMap<>();
            historyEntry.put("oldStatus", oldStatus);
            historyEntry.put("newStatus", newStatus);
            historyEntry.put("timestamp", Instant.now().toString());
            List<Map<String, String>> history = task.getProgressHistory();
            if(history == null) history = new java.util.ArrayList<>();
            history.add(historyEntry);
            task.setProgressHistory(history);
            
            taskRepo.save(task);
            
            String actor = auth != null && auth.getName() != null ? auth.getName() : "System";
            logAudit(actor, task.getAssigneeId(), "TASK_MOVED", "Moved task '" + task.getTitle() + "' from " + oldStatus + " to " + newStatus);
            
            return ResponseEntity.ok(task);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
        Optional<Task> opt = taskRepo.findById(id);
        if (opt.isPresent()) {
            Task task = opt.get();
            List<Map<String, String>> comments = task.getComments();
            if(comments == null) comments = new java.util.ArrayList<>();
            
            Map<String, String> comment = new HashMap<>();
            comment.put("userId", auth != null && auth.getName() != null ? auth.getName() : "Anonymous");
            comment.put("text", body.get("text"));
            comment.put("timestamp", Instant.now().toString());
            
            comments.add(comment);
            task.setComments(comments);
            taskRepo.save(task);
            return ResponseEntity.ok(task);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/time")
    public ResponseEntity<?> updateTimeSpent(@PathVariable String id, @RequestBody Map<String, Integer> body) {
        Optional<Task> opt = taskRepo.findById(id);
        if (opt.isPresent()) {
            Task task = opt.get();
            int additionalSeconds = body.getOrDefault("secondsToAdd", 0);
            int currentTime = task.getTimeSpentSeconds() != null ? task.getTimeSpentSeconds() : 0;
            task.setTimeSpentSeconds(currentTime + additionalSeconds);
            taskRepo.save(task);
            return ResponseEntity.ok(task);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/attachments")
    public ResponseEntity<?> addAttachment(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<Task> opt = taskRepo.findById(id);
        if (opt.isPresent()) {
            Task task = opt.get();
            List<String> attachments = task.getAttachments();
            if(attachments == null) attachments = new java.util.ArrayList<>();
            
            attachments.add(body.get("fileUri"));
            task.setAttachments(attachments);
            taskRepo.save(task);
            return ResponseEntity.ok(task);
        }
        return ResponseEntity.notFound().build();
    }

    // 🌊 WAVE 8: Bulk Task Management
    @PutMapping("/bulk-update")
    public ResponseEntity<?> bulkUpdateTasks(@RequestBody Map<String, Object> payload, Authentication auth) {
        try {
            List<String> taskIds = (List<String>) payload.get("taskIds");
            Map<String, String> updates = (Map<String, String>) payload.get("updates");
            if (taskIds == null || taskIds.isEmpty()) return ResponseEntity.badRequest().body("No tasks provided");

            List<Task> tasks = (List<Task>) taskRepo.findAllById(taskIds);
            String actor = auth != null && auth.getName() != null ? auth.getName() : "Admin";

            for (Task task : tasks) {
                if (updates.containsKey("status")) {
                    String newStatus = updates.get("status");
                    String oldStatus = task.getStatus();
                    task.setStatus(newStatus);
                    
                    Map<String, String> he = new HashMap<>();
                    he.put("oldStatus", oldStatus);
                    he.put("newStatus", newStatus);
                    he.put("timestamp", Instant.now().toString());
                    if(task.getProgressHistory() == null) task.setProgressHistory(new java.util.ArrayList<>());
                    task.getProgressHistory().add(he);
                }
                
                if (updates.containsKey("assigneeId")) {
                    task.setAssigneeId(updates.get("assigneeId"));
                    task.setAssigneeEmail(updates.get("assigneeEmail"));
                    Notification savedNotif = notifRepo.save(new Notification(updates.get("assigneeId"), "You were bulk-assigned to task: " + task.getTitle(), "INFO"));
                    
                    // ✉️ Send Async Email for Bulk Assignment
                    String targetEmail = task.getAssigneeEmail();
                    if ((targetEmail == null || targetEmail.isEmpty()) && task.getAssigneeId() != null) {
                        targetEmail = userRepo.findById(task.getAssigneeId()).map(User::getEmail).orElse(null);
                    }
                    if (targetEmail != null) {
                        emailService.sendTaskAllocationEmail(targetEmail, task.getTitle(), task.getPriority(), task.getDueDate(), actor, savedNotif.getId());
                    }
                }
                
                logAudit(actor, task.getAssigneeId() != null ? task.getAssigneeId() : "Unassigned", "TASK_BULK_UPDATE", "Bulk updated task " + task.getTitle());
            }

            taskRepo.saveAll(tasks);
            return ResponseEntity.ok(Map.of("message", "Updated " + tasks.size() + " tasks"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/assignee")
    public ResponseEntity<?> updateTaskAssignee(@PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
        Optional<Task> opt = taskRepo.findById(id);
        if (opt.isPresent()) {
            Task task = opt.get();
            String newId = body.get("assigneeId");
            String newEmail = body.get("assigneeEmail");
            String oldId = task.getAssigneeId();

            task.setAssigneeId(newId);
            task.setAssigneeEmail(newEmail);
            taskRepo.save(task);

            String actor = (auth != null) ? auth.getName() : "Admin";
            logAudit(actor, newId, "TASK_ASSIGNED_MANUAL", "Manually assigned task '" + task.getTitle() + "' to " + newEmail);

            if (newId != null && !newId.equals(oldId)) {
                Notification n = notifRepo.save(new Notification(newId, "New task assigned: " + task.getTitle(), "INFO"));
                
                String emailToUse = newEmail;
                if (emailToUse == null || emailToUse.isEmpty()) {
                    emailToUse = userRepo.findById(newId).map(User::getEmail).orElse(null);
                }
                
                if (emailToUse != null) {
                    emailService.sendTaskAllocationEmail(emailToUse, task.getTitle(), task.getPriority(), task.getDueDate(), actor, n.getId());
                } else {
                    System.err.println("⚠️ Could not find email for assignee " + newId + ". Notification preserved in app but email not sent.");
                }
            }
            return ResponseEntity.ok(task);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable String id, Authentication auth) {
        Optional<Task> opt = taskRepo.findById(id);
        if (opt.isPresent()) {
            Task task = opt.get();
            taskRepo.deleteById(id);
            
            String actor = (auth != null) ? auth.getName() : "Admin";
            logAudit(actor, id, "TASK_DELETED", "Deleted task: '" + task.getTitle() + "'");
            
            return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}

