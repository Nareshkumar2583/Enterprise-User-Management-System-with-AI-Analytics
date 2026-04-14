package com.example.enterprise_ai_backend.Service;

import com.example.enterprise_ai_backend.repository.NotificationRepository;
import com.example.enterprise_ai_backend.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private NotificationRepository notifRepo;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:noreply@enterprise.com}")
    private String fromEmail;

    @Async
    public void sendTaskAllocationEmail(String toEmail, String taskTitle, String priority, String deadline, String actorEmail, String notifId) {
        if (mailSender == null) {
            System.out.println("📧 [Email Triggered - MailSender Not Configured] To: " + toEmail + " | Content: Assigned task '" + taskTitle + "'");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("🚨 New Task Allocated: " + taskTitle);
            message.setText("Hello,\n\nYou have been assigned a new task: " + taskTitle + 
                            "\nPriority: " + priority + 
                            "\nDeadline: " + (deadline != null && !deadline.isEmpty() ? deadline : "Not Set") + 
                            "\nAssigned internally by: " + (actorEmail != null ? actorEmail : "AI System") + 
                            "\n\nPlease log into your Enterprise AI dashboard to view and manage this task.\n\nBest Regards,\nEnterprise AI System");
            
            mailSender.send(message);
            updateNotificationStatus(notifId, true, null);
            System.out.println("✅ Email sent successfully to " + toEmail);
        } catch (Exception e) {
            updateNotificationStatus(notifId, false, e.getMessage());
            System.err.println("❌ Failed to send email to " + toEmail + " (SMTP likely unconfigured: " + e.getMessage() + ")");
        }
    }

    private void updateNotificationStatus(String notifId, boolean success, String error) {
        if (notifId == null) return;
        Optional<Notification> opt = notifRepo.findById(notifId);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setEmailSentStatus(success);
            n.setEmailError(error);
            notifRepo.save(n);
        }
    }
}
