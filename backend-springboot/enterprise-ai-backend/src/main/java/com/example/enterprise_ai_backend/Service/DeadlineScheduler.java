package com.example.enterprise_ai_backend.Service;

import com.example.enterprise_ai_backend.model.Notification;
import com.example.enterprise_ai_backend.model.Task;
import com.example.enterprise_ai_backend.model.User;
import com.example.enterprise_ai_backend.repository.NotificationRepository;
import com.example.enterprise_ai_backend.repository.TaskRepository;
import com.example.enterprise_ai_backend.repository.Userrepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class DeadlineScheduler {

    private final TaskRepository taskRepo;
    private final Userrepository userRepo;
    private final NotificationRepository notifRepo;
    private final EmailService emailService;

    public DeadlineScheduler(TaskRepository taskRepo, Userrepository userRepo, NotificationRepository notifRepo, EmailService emailService) {
        this.taskRepo = taskRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
        this.emailService = emailService;
    }

    // Runs every day at 8:00 AM server time
    @Scheduled(cron = "0 0 8 * * ?")
    public void sendDeadlineReminders() {
        System.out.println("🕒 [Scheduler] Running Daily Deadline Reminder Check...");
        
        List<Task> activeTasks = taskRepo.findAll();
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        String tomorrowStr = tomorrow.format(formatter);

        for (Task t : activeTasks) {
            if ("DONE".equals(t.getStatus())) continue;
            if (t.getDueDate() == null || t.getDueDate().isEmpty()) continue;

            // Simple match: if due date starts with tomorrow's date
            if (t.getDueDate().startsWith(tomorrowStr)) {
                
                String targetEmail = t.getAssigneeEmail();
                if ((targetEmail == null || targetEmail.isEmpty()) && t.getAssigneeId() != null) {
                    targetEmail = userRepo.findById(t.getAssigneeId()).map(User::getEmail).orElse(null);
                }

                if (targetEmail != null) {
                    // Create in-app deadline notification
                    String msg = "⏳ Reminder: Task '" + t.getTitle() + "' is due tomorrow!";
                    Notification savedNotif = notifRepo.save(new Notification(t.getAssigneeId(), msg, "DEADLINE"));
                    
                    // Dispatch email asynchronously
                    emailService.sendTaskAllocationEmail(
                            targetEmail, 
                            "[DEADLINE REMINDER] " + t.getTitle(), 
                            t.getPriority(), 
                            t.getDueDate(), 
                            "AI Scheduler", 
                            savedNotif.getId()
                    );
                }
            }
        }
    }
}
