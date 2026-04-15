package com.example.enterprise_ai_backend.Controller;

import com.example.enterprise_ai_backend.model.Sprint;
import com.example.enterprise_ai_backend.model.StandupLog;
import com.example.enterprise_ai_backend.model.Task;
import com.example.enterprise_ai_backend.repository.SprintRepository;
import com.example.enterprise_ai_backend.repository.StandupLogRepository;
import com.example.enterprise_ai_backend.repository.TaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin
public class SprintController {

    private final SprintRepository sprintRepo;
    private final TaskRepository taskRepo;
    private final StandupLogRepository standupRepo;

    public SprintController(SprintRepository sprintRepo, TaskRepository taskRepo, StandupLogRepository standupRepo) {
        this.sprintRepo = sprintRepo;
        this.taskRepo = taskRepo;
        this.standupRepo = standupRepo;
    }

    // 📋 SPRINT MANAGEMENT
    @PostMapping
    public Sprint createSprint(@RequestBody Sprint sprint, Authentication auth) {
        sprint.setStatus("PLANNING");
        sprint.setCreatedAt(Instant.now().toString());
        sprint.setCreatedBy(auth != null ? auth.getName() : "Admin");
        return sprintRepo.save(sprint);
    }

    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sprint> getSprint(@PathVariable String id) {
        return sprintRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<Sprint> getActiveSprint() {
        return sprintRepo.findFirstByStatusOrderByCreatedAtDesc("ACTIVE")
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Sprint> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return sprintRepo.findById(id).map(s -> {
            s.setStatus(status);
            return ResponseEntity.ok(sprintRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 📋 TASK MANAGEMENT WITHIN SPRINT
    @GetMapping("/backlog")
    public List<Task> getBacklog() {
        return taskRepo.findBySprintIdIsNull();
    }

    @GetMapping("/{id}/tasks")
    public List<Task> getSprintTasks(@PathVariable String id) {
        return taskRepo.findBySprintId(id);
    }

    @PostMapping("/{id}/add-task/{taskId}")
    public ResponseEntity<?> addTaskToSprint(@PathVariable String id, @PathVariable String taskId) {
        Optional<Sprint> sOpt = sprintRepo.findById(id);
        Optional<Task> tOpt = taskRepo.findById(taskId);

        if (sOpt.isPresent() && tOpt.isPresent()) {
            Task task = tOpt.get();
            task.setSprintId(id);
            taskRepo.save(task);

            Sprint sprint = sOpt.get();
            if(!sprint.getTaskIds().contains(taskId)) {
                sprint.getTaskIds().add(taskId);
                sprintRepo.save(sprint);
            }
            return ResponseEntity.ok(task);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}/remove-task/{taskId}")
    public ResponseEntity<?> removeTaskFromSprint(@PathVariable String id, @PathVariable String taskId) {
        Optional<Task> tOpt = taskRepo.findById(taskId);
        if (tOpt.isPresent()) {
            Task task = tOpt.get();
            task.setSprintId(null);
            taskRepo.save(task);
            return ResponseEntity.ok(Map.of("message", "Removed from sprint"));
        }
        return ResponseEntity.notFound().build();
    }

    // 🧍 DAILY STANDUP
    @PostMapping("/standup")
    public StandupLog submitStandup(@RequestBody StandupLog log, Authentication auth) {
        log.setCreatedAt(Instant.now().toString());
        log.setUserId(auth != null ? auth.getName() : "anonymous");
        log.setDate(LocalDate.now().toString());
        return standupRepo.save(log);
    }

    @GetMapping("/{id}/standups")
    public List<StandupLog> getSprintStandups(@PathVariable String id) {
        return standupRepo.findBySprintIdOrderByCreatedAtDesc(id);
    }

    // 📉 BURNDOWN CALCULATION
    @GetMapping("/{id}/burndown")
    public ResponseEntity<?> getBurndown(@PathVariable String id) {
        Optional<Sprint> sOpt = sprintRepo.findById(id);
        if (sOpt.isEmpty()) return ResponseEntity.notFound().build();
        Sprint sprint = sOpt.get();

        LocalDate start = LocalDate.parse(sprint.getStartDate());
        LocalDate end = LocalDate.parse(sprint.getEndDate());
        long totalDays = ChronoUnit.DAYS.between(start, end) + 1;

        List<Task> tasks = taskRepo.findBySprintId(id);
        int totalPoints = tasks.stream().mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 1).sum();

        List<Map<String, Object>> data = new ArrayList<>();
        
        // Hypothetical ideal line
        double idealPerDay = (double) totalPoints / (totalDays - 1);

        for (int i = 0; i < totalDays; i++) {
            LocalDate current = start.plusDays(i);
            Map<String, Object> point = new HashMap<>();
            point.put("day", current.toString());
            point.put("ideal", Math.max(0, totalPoints - (idealPerDay * i)));
            
            // For "actual", we check task histories or statuses
            // Simpler: if current <= today, calculate remaining. If > today, null (don't show)
            if (current.isBefore(LocalDate.now()) || current.isEqual(LocalDate.now())) {
                // Calculate remaining points at the end of THIS day
                // Real impl would check Task status change dates. 
                // Simplified: current status for "now", simulation for past
                int completedOnDayOrBefore = 0; // would need completion date in Task model
                // Let's assume for this mock that tasks done are done "now"
                int remaining = totalPoints - tasks.stream()
                        .filter(t -> "DONE".equals(t.getStatus()))
                        .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 1)
                        .sum();
                point.put("actual", remaining);
            }
            data.add(point);
        }

        return ResponseEntity.ok(Map.of(
            "totalPoints", totalPoints,
            "data", data
        ));
    }
}
