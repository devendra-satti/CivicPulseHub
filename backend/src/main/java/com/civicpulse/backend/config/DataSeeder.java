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
                officer.setTicketsResolved(14); // Populates tracking performance cards
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
                ticket1.setImageUrl("https://media.istockphoto.com/id/95658927/photo/a-large-pot-hole-filled-with-water-on-an-asphalt-road.jpg?s=612x612&w=0&k=20&c=o4V3HZV1HqlopqwJ7DsI8BuwD7k26UKthAZ_FSn8SrY=");
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
                ticket1.setLatitude(16.8292);
                ticket1.setLongitude(81.5335);
                ticket2.setStatus("RESOLVED");
                ticket2.setPriority("MEDIUM");
                ticket2.setAdmin_comment("Replaced the default bulb fixture with a new LED assembly panel.");
                ticket2.setMaterialsUsed("1 LED bulb array, 3 meters connection wire");
                ticket2.setCitizen_feedback("Fast and efficient resolution! The street is much safer now.");
                ticket2.setCitizen_rating(5);
                ticket2.setImageUrl("data:image/jpeg;base64,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");
                ticket2.setResolution_proof_url("https://thumbs.dreamstime.com/b/street-scene-night-urban-town-light-trails-car-lights-63552704.jpg");
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
                ticket1.setLatitude(16.8292);
                ticket1.setLongitude(81.5335);
                ticket3.setStatus("PENDING");
                ticket3.setPriority("HIGH");
                ticket3.setCreatedAt(new Date());
                ticket3.setUpdatedAt(new Date());
                ticket3.setImageUrl("https://media.istockphoto.com/id/178415548/photo/garbage-and-seagulls.jpg?s=612x612&w=0&k=20&c=OfUZHxAbG2g00Du0emE8SI0re7o-pmL1R_KAjB_bQCU=");
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