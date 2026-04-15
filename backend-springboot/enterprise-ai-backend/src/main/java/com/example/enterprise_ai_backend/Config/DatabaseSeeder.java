package com.example.enterprise_ai_backend.Config;

import com.example.enterprise_ai_backend.Service.UserService;
import com.example.enterprise_ai_backend.model.User;
import com.example.enterprise_ai_backend.repository.Userrepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserService userService;
    private final Userrepository userRepository;

    public DatabaseSeeder(UserService userService, Userrepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("No users found in database. Seeding provided credentials...");

            // Create ADMIN
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@enterprise.com");
            admin.setPassword("Admin@123");
            admin.setRole("ADMIN");
            admin.setDepartment("Management");
            userService.register(admin); // This encodes the password
            userService.promoteToAdmin(admin.getId());

            // Create User 1
            User user1 = new User();
            user1.setName("Naresh Kumar");
            user1.setEmail("nareshkumarsitdept@gmail.com");
            user1.setPassword("User@123");
            user1.setRole("USER");
            user1.setDepartment("IT");
            userService.register(user1);

            // Create User 2
            User user2 = new User();
            user2.setName("Dekiru Alice");
            user2.setEmail("dekiru205@gmail.com");
            user2.setPassword("Alice@123");
            user2.setRole("USER");
            user2.setDepartment("Engineering");
            userService.register(user2);

            System.out.println("✅ Database Seeding complete.");
        } else {
            System.out.println("✅ Users already seeded in Atlas. Skipping seeding.");
        }
    }
}
