package com.civicpulse.backend.config;

import com.civicpulse.backend.model.User;
import com.civicpulse.backend.model.Complaint;
import com.civicpulse.backend.model.ComplaintCategory;
import com.civicpulse.backend.repository.UserRepository;
import com.civicpulse.backend.repository.ComplaintRepository;
import com.civicpulse.backend.repository.ComplaintCategoryRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initData(
            UserRepository userRepository, 
            ComplaintRepository complaintRepository,
            ComplaintCategoryRepository categoryRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            
            // =================================================================
            // 1. SEED COMPLAINT CATEGORIES
            // =================================================================
            ComplaintCategory sanitary = null;
            ComplaintCategory electricity = null;
            ComplaintCategory roads = null;

            if (categoryRepository.count() == 0) {
                sanitary = new ComplaintCategory(); sanitary.setName("Sanitary");
                sanitary = categoryRepository.save(sanitary);

                electricity = new ComplaintCategory(); electricity.setName("Electricity");
                electricity = categoryRepository.save(electricity);

                roads = new ComplaintCategory(); roads.setName("Roads & Transport");
                roads = categoryRepository.save(roads);

                System.out.println("✅ Complaint Categories Seeded Successfully.");
            } else {
                roads = categoryRepository.findAll().get(0);
            }

            // =================================================================
            // 2. SEED CORE USERS (ADMIN, OFFICER, CITIZEN) WITH 'test1234'
            // =================================================================
            String sharedPassword = passwordEncoder.encode("test1234");

            // A. Create Super Admin
            User admin = userRepository.findByEmail("admin@civicpulse.com").orElse(null);
            if (admin == null) {
                admin = new User();
                admin.setName("Super Admin");
                admin.setEmail("admin@civicpulse.com");
                admin.setPassword(sharedPassword);
                admin.setRole("ADMIN");
                admin.setEnabled(true);
                admin = userRepository.save(admin);
                System.out.println("✅ Admin Account Seeded: admin@civicpulse.com");
            }

            // B. Create Department Officer
            User officer = userRepository.findByEmail("officer@civicpulse.com").orElse(null);
            if (officer == null) {
                officer = new User();
                officer.setName("Officer Suresh");
                officer.setEmail("officer@civicpulse.com");
                officer.setPassword(sharedPassword);
                officer.setRole("OFFICER");
                officer.setDepartment("roads");
                officer.setTicketsResolved(1); // Populates tracking performance cards
                officer.setTicketsReopened(1);
                officer.setEnabled(true);
                officer = userRepository.save(officer);
                System.out.println("✅ Officer Account Seeded: officer@civicpulse.com");
            }

            // C. Create Citizen User
            User citizen = userRepository.findByEmail("citizen@civicpulse.com").orElse(null);
            if (citizen == null) {
                citizen = new User();
                citizen.setName("Adi"); // Set explicitly to your handle asset
                citizen.setEmail("citizen@civicpulse.com");
                citizen.setPassword(sharedPassword);
                citizen.setRole("CITIZEN");
                citizen.setWardNumber("12"); // Matches your input placeholders
                citizen.setEnabled(true);
                citizen = userRepository.save(citizen);
                System.out.println("✅ Citizen Account Seeded: citizen@civicpulse.com");
            }

            // =================================================================
            // 3. SEED LIVE DUMMY COMPLAINTS (WAKES UP THE DASHBOARDS)
            // =================================================================
            if (complaintRepository.count() == 0 && citizen != null && officer != null && roads != null) {
                
                // Helper to dynamically calculate dates relative to "now"
                java.util.Calendar cal = java.util.Calendar.getInstance();

                // Ticket 1: Created 4 days ago, Assigned 3 days ago (Graph Day -4)
                cal.setTime(new Date());
                cal.add(java.util.Calendar.DATE, -4);
                Date fourDaysAgo = cal.getTime();

                cal.setTime(new Date());
                cal.add(java.util.Calendar.DATE, -3);
                Date threeDaysAgo = cal.getTime();

                // Sample Task 1: Assigned Ticket
                Complaint ticket1 = new Complaint();
                ticket1.setUser(citizen);
                ticket1.setCategoryId(roads.getId());
                ticket1.setAssignedTo(officer.getId());
                ticket1.setTitle("Severe Pothole on Main Bypass Road");
                ticket1.setDescription("Deep pothole near the central junction causing major traffic delays and safety hazards.");
                ticket1.setLocation("Tadepalligudem Junction");
                ticket1.setLatitude(16.8292);
                ticket1.setLongitude(81.5335);
                ticket1.setStatus("ASSIGNED");
                ticket1.setPriority("HIGH");
                ticket1.setAssignedAt(threeDaysAgo);
                ticket1.setImageUrl("https://lh3.googleusercontent.com/d/1dJoYc9bB4VxaUxqItz4jAbnGspx7J8WH");
                ticket1.setCreatedAt(fourDaysAgo); 
                ticket1.setUpdatedAt(threeDaysAgo);
                complaintRepository.save(ticket1);

                // Ticket 2: Created 6 days ago, Resolved 1 day ago (Graph Day -6 and Day -1)
                cal.setTime(new Date());
                cal.add(java.util.Calendar.DATE, -6);
                Date infoSixDaysAgo = cal.getTime();

                cal.setTime(new Date());
                cal.add(java.util.Calendar.DATE, -1);
                Date oneDayAgo = cal.getTime();

                Complaint ticket2 = new Complaint();
                ticket2.setUser(citizen);
                ticket2.setCategoryId(electricity != null ? electricity.getId() : roads.getId());
                ticket2.setAssignedTo(officer.getId());
                ticket2.setTitle("Broken Streetlight on Lane 4");
                ticket2.setDescription("The street lamp post has been completely non-functional for over a week, making the residential road dark.");
                ticket2.setLocation("Main Market Entry Gate");
                ticket2.setLatitude(16.8292);
                ticket2.setLongitude(81.5335);
                ticket2.setStatus("RESOLVED");
                ticket2.setPriority("MEDIUM");
                ticket2.setAdmin_comment("Replaced the default bulb fixture with a new LED assembly panel.");
                ticket2.setMaterialsUsed("1 LED bulb array, 3 meters connection wire");
                ticket2.setCitizen_feedback("Fast and efficient resolution! The street is much safer now.");
                ticket2.setCitizen_rating(5);
                ticket2.setImageUrl("https://lh3.googleusercontent.com/d/1yaTAODbcbZx4fpNG3v3jmo65D-r8BG6Y");
                ticket2.setResolution_proof_url("https://lh3.googleusercontent.com/d/156sAGn4uFnFLHeX7ng_so0qkRULfWHH0");
                ticket2.setCreatedAt(infoSixDaysAgo);
                ticket2.setUpdatedAt(oneDayAgo);
                complaintRepository.save(ticket2);

                // Ticket 3: Created Today (Graph Day 0 - Ensures data populates the current day)
                Complaint ticket3 = new Complaint();
                ticket3.setUser(citizen);
                ticket3.setCategoryId(sanitary != null ? sanitary.getId() : roads.getId());
                ticket3.setTitle("Overflowing Garbage Bin near Market");
                ticket3.setDescription("Garbage collection container is overflowing, spreading waste onto the pedestrian walkway.");
                ticket3.setLocation("Main Market Entry Gate");
                ticket3.setLatitude(16.8292);
                ticket3.setLongitude(81.5335);
                ticket3.setStatus("PENDING");
                ticket3.setPriority("HIGH");
                ticket3.setCreatedAt(new Date());
                ticket3.setUpdatedAt(new Date());
                ticket3.setImageUrl("https://lh3.googleusercontent.com/d/1-zBHbOLHi0OSUdSXR0k2_Fm7aBrthnPq");
                complaintRepository.save(ticket3);

                System.out.println("✅ Sample Dashboard Complaint Tickets Registered.");
            }
        };
    }
}

// package com.civicpulse.backend.config;

// import com.civicpulse.backend.model.User;
// import com.civicpulse.backend.repository.UserRepository;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.crypto.password.PasswordEncoder;

// @Configuration
// public class DataSeeder {

//     //When the app starts, run this code to seed data.CommandLineRunner is an interface
//     @Bean
//     public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
//         return args -> {
//             // Check if admin exists, if not, create one
//             if (userRepository.findByEmail("admin@civicpulse.com").isEmpty()) {
//                 User admin = new User();
//                 admin.setName("Super Admin");
//                 admin.setEmail("admin@civicpulse.com");
//                 admin.setPassword(passwordEncoder.encode("admin123")); // Default Password
//                 admin.setRole("ADMIN");
//                 admin.setEnabled(true); // Admin is always enabled
//                 userRepository.save(admin);
//                 System.out.println("✅ Default Admin Created: admin@civicpulse.com / admin123");
//             }
//         };
//     }
// }