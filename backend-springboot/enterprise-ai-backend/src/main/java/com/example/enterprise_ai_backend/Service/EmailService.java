package com.example.enterprise_ai_backend.Service;

import com.example.enterprise_ai_backend.repository.NotificationRepository;
import com.example.enterprise_ai_backend.model.Notification;
import com.example.enterprise_ai_backend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
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
    public void sendWelcomeEmail(User user) {
        if (mailSender == null) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject("Welcome to Enterprise AI Workspace! 👋");

            String htmlBody = "<html><body style='font-family: Arial, sans-serif; background: #f4f7f6; padding: 20px;'>"
                + "<div style='max-width: 600px; margin: auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);'>"
                + "<h1 style='color: #2c3e50;'>Welcome, " + user.getName() + "!</h1>"
                + "<p style='color: #34495e; font-size: 16px; line-height: 1.6;'>We're excited to have you on board our AI-driven enterprise platform. Your account is now active as a <strong>" + user.getRole() + "</strong>.</p>"
                + "<div style='background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 25px 0;'>"
                + "<h3 style='margin-top: 0;'>Your Workspace Details:</h3>"
                + "<ul style='padding-left: 20px;'>"
                + "<li><strong>Department:</strong> " + (user.getDepartment() != null ? user.getDepartment() : "Not Assigned") + "</li>"
                + "<li><strong>Role:</strong> " + user.getRole() + "</li>"
                + "</ul>"
                + "</div>"
                + "<p>Start exploring your dashboard and AI insights today!</p>"
                + "<a href='http://localhost:5173/login' style='display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Log In to Workspace</a>"
                + "</div></body></html>";

            helper.setText(htmlBody, true);
            mailSender.send(message);
            System.out.println("✅ Welcome Email sent to " + user.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Welcome Email failed: " + e.getMessage());
        }
    }

    @Async
    public void sendLeaveStatusEmail(String toEmail, String status, String startDate, String endDate, String adminNote) {
        if (mailSender == null) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Leave Request Status: " + status);

            String statusColor = "APPROVED".equals(status) ? "#27ae60" : "#e74c3c";
            
            String htmlBody = "<html><body style='font-family: Arial, sans-serif; padding: 20px;'> "
                + "<div style='max-width: 600px; border: 1px solid #ddd; padding: 30px; border-radius: 8px;'>"
                + "<h2>Leave Request Update</h2>"
                + "<p>Your leave request from <strong>" + startDate + "</strong> to <strong>" + endDate + "</strong> has been:</p>"
                + "<h1 style='color: " + statusColor + ";'>" + status + "</h1>"
                + (adminNote != null && !adminNote.isEmpty() ? "<p><strong>Admin Note:</strong> " + adminNote + "</p>" : "")
                + "<p>Please check the HR portal for more details.</p>"
                + "</div></body></html>";

            helper.setText(htmlBody, true);
            mailSender.send(message);
            System.out.println("✅ Leave Email sent to " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Leave Email failed: " + e.getMessage());
        }
    }

    @Async
    public void sendTaskAllocationEmail(String toEmail, String taskTitle, String priority, String deadline, String actorEmail, String notifId) {
        if (mailSender == null) {
            System.out.println("📧 [Email Triggered - MailSender Not Configured] To: " + toEmail + " | Task: " + taskTitle);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🚀 New Task Assigned: " + taskTitle);

            // Priority badge colors
            String priorityColor = "CRITICAL".equals(priority) ? "#dc2626" :
                                   "NORMAL".equals(priority)   ? "#2563eb" : "#64748b";
            String priorityBg    = "CRITICAL".equals(priority) ? "#fee2e2" :
                                   "NORMAL".equals(priority)   ? "#dbeafe" : "#f1f5f9";
            String priorityLabel = (priority != null && !priority.isEmpty()) ? priority : "NORMAL";

            String deadlineDisplay = (deadline != null && !deadline.isEmpty())
                ? deadline.replace("T", " at ").replace("Z", " UTC")
                : "No deadline set";

            String assignorName = (actorEmail != null && actorEmail.contains("@"))
                ? actorEmail.split("@")[0] : "the Admin";

            String htmlBody = "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'/><style>"
                + "body{margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;}"
                + ".wrapper{max-width:620px;margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}"
                + ".header{background:linear-gradient(135deg,#1e293b 0%,#3b82f6 100%);padding:36px 40px;text-align:center;}"
                + ".header h1{color:#ffffff;margin:0;font-size:22px;font-weight:700;}"
                + ".header p{color:#bfdbfe;margin:6px 0 0;font-size:14px;}"
                + ".body{padding:36px 40px;}"
                + ".greeting{font-size:17px;color:#1e293b;font-weight:600;margin-bottom:20px;}"
                + ".task-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;}"
                + ".task-title{font-size:20px;font-weight:700;color:#1e293b;margin:0 0 16px 0;}"
                + ".detail-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:14px;color:#475569;}"
                + ".label{font-weight:600;color:#64748b;width:110px;}"
                + ".badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;}"
                + ".deadline-box{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:24px;}"
                + ".deadline-title{font-size:15px;color:#9a3412;font-weight:700;margin-bottom:4px;}"
                + ".deadline-val{font-size:18px;color:#c2410c;font-weight:800;}"
                + ".deadline-sub{font-size:12px;color:#c2410c;margin-top:6px;}"
                + ".cta{text-align:center;margin:28px 0 0;}"
                + ".cta a{display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;}"
                + ".footer{background:#f1f5f9;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;font-size:12px;color:#94a3b8;}"
                + "</style></head><body>"
                + "<div class='wrapper'>"
                + "  <div class='header'>"
                + "    <h1>&#128640; New Task Assigned to You</h1>"
                + "    <p>Enterprise AI Workspace &mdash; Automated Notification</p>"
                + "  </div>"
                + "  <div class='body'>"
                + "    <div class='greeting'>Hello! You have a new task waiting for you.</div>"
                + "    <div class='task-card'>"
                + "      <div class='task-title'>&#128203; " + taskTitle + "</div>"
                + "      <div class='detail-row'>"
                + "        <span class='label'>&#9889; Priority</span>"
                + "        <span class='badge' style='background:" + priorityBg + ";color:" + priorityColor + "'>" + priorityLabel + "</span>"
                + "      </div>"
                + "      <div class='detail-row'>"
                + "        <span class='label'>&#128100; Assigned by</span>"
                + "        <span>" + assignorName + "</span>"
                + "      </div>"
                + "      <div class='detail-row'>"
                + "        <span class='label'>&#128202; Status</span>"
                + "        <span class='badge' style='background:#dbeafe;color:#1d4ed8'>TODO &mdash; Starting Soon</span>"
                + "      </div>"
                + "    </div>"
                + "    <div class='deadline-box'>"
                + "      <div class='deadline-title'>&#9200; Task Deadline</div>"
                + "      <div class='deadline-val'>" + deadlineDisplay + "</div>"
                + "      <div class='deadline-sub'>Please complete this task before the deadline to avoid a HIGH delay-risk flag from the AI system.</div>"
                + "    </div>"
                + "    <div class='cta'>"
                + "      <a href='http://localhost:5173/user/kanban'>View Task on Dashboard &rarr;</a>"
                + "    </div>"
                + "  </div>"
                + "  <div class='footer'>"
                + "    This is an automated notification from your Enterprise AI System.<br/>"
                + "    Do not reply to this email. Log in to manage your tasks."
                + "  </div>"
                + "</div>"
                + "</body></html>";

            helper.setText(htmlBody, true);
            System.out.println("🔄 Attempting to send Task Allocation Email to: " + toEmail + " via " + fromEmail);
            mailSender.send(message);

            updateNotificationStatus(notifId, true, null);
            System.out.println("✅ HTML Task Allocation Email sent successfully to " + toEmail + " | Task: " + taskTitle);
        } catch (Exception e) {
            updateNotificationStatus(notifId, false, e.getMessage());
            System.err.println("❌ Task Allocation Email failed for " + toEmail + " — " + e.getMessage());
            e.printStackTrace();
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
