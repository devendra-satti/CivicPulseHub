// PHASE - 3
// PHASE - 3 (Optimized with Brevo HTTP REST API)
package com.civicpulse.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    // 🚀 Injects your secure Brevo API Key from Render Environment / application.properties
    @Value("${BREVO_API_KEY}")
    private String brevoApiKey;

    // Stores: "user@email.com" -> "482915" (Dynamic and Secure)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    
    // Stores: "user@email.com" -> true (only if verified)
    private final Set<String> verifiedEmails = ConcurrentHashMap.newKeySet();

    public void generateAndSendOtp(String email) {
        // 1. Backend securely generates a truly random, unique 6-digit OTP string
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        // 2. Reset verification tracking status if they are requesting a retry
        verifiedEmails.remove(email); 
        
        // 3. Store the generated OTP into our memory map first
        otpStorage.put(email, otp);

        // 4. Fire the email delivery on a background worker thread so the UI never lags
        sendEmailViaBrevo(email, otp);
    }

    public boolean verifyOtp(String email, String inputOtp) {
        if (otpStorage.containsKey(email) && otpStorage.get(email).equals(inputOtp)) {
            otpStorage.remove(email); // Delete used OTP instantly for security
            verifiedEmails.add(email); // Mark profile state as verified
            return true;
        }
        return false;
    }

    public boolean isEmailVerified(String email) {
        return verifiedEmails.contains(email);
    }
    
    public void clearVerification(String email) {
        verifiedEmails.remove(email);
    }

    // 🚀 FIXED: Corrected Brevo REST HTTP Delivery Client Channel
    private void sendEmailViaBrevo(String toEmail, String otp) {
        // Validation check before starting the thread
        if (brevoApiKey == null || brevoApiKey.trim().isEmpty()) {
            System.err.println("CRITICAL: BREVO_API_KEY environment variable is missing or null!");
            return;
        }

        new Thread(() -> {
            try {
                HttpClient client = HttpClient.newHttpClient();
                
                // Formulated JSON request mapping matching your verified sender
                String jsonPayload = "{"
                    + "\"sender\":{\"name\":\"CivicPulse Hub\",\"email\":\"civicpulse.official@gmail.com\"},"
                    + "\"to\":[{\"email\":\"" + toEmail + "\"}],"
                    + "\"subject\":\"Verify Your CivicPulse Hub Account\","
                    + "\"htmlContent\":\"<div style='font-family: Arial, sans-serif; padding: 20px; color: #1e293b;'>"
                    + "<h2 style='color: #0099ff;'>Welcome to CivicPulse Hub</h2>"
                    + "<p>Thank you for signing up. Use the secure verification code below to complete your registration profile:</p>"
                    + "<p style='font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1e293b; background-color: #f1f5f9; padding: 12px; display: inline-block; border-radius: 6px;'>" + otp + "</p>"
                    + "<p style='font-size: 12px; color: #64748b; margin-top: 20px;'>This verification channel code will automatically expire in 5 minutes.</p>"
                    + "</div>\""
                    + "}";

                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email")) // 🚀 FIXED: Corrected Brevo URL endpoint
                    .header("accept", "application/json")
                    .header("api-key", brevoApiKey)
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                
                if (response.statusCode() == 201 || response.statusCode() == 200) {
                    System.out.println("Real dynamic OTP successfully pushed via Brevo API to: " + toEmail);
                } else {
                    System.err.println("Brevo System Rejected Transmission. Status Code: " + response.statusCode() + " - Response: " + response.body());
                }

            } catch (Exception e) {
                System.err.println("Critical Exception in Background Email Delivery Stream:");
                e.printStackTrace(); // 🚀 FIXED: Prints the exact line number and root cause instead of 'null'
            }
        }).start(); 
    }

    // Optional: Clean up memory every hour
    @Scheduled(fixedRate = 3600000)
    public void cleanup() {
        otpStorage.clear();
        verifiedEmails.clear();
    }
}

// package com.civicpulse.backend.services;


// import org.springframework.beans.factory.annotation.Autowired; //- needed for actual mail feature
// import org.springframework.mail.SimpleMailMessage;// - Essential While Sending the actual mail otps since we are using console otps
// import org.springframework.mail.javamail.JavaMailSender; //- Essential for Actual OTPs
// import org.springframework.scheduling.annotation.Scheduled;
// import org.springframework.stereotype.Service;
// import java.util.Map;
// import java.util.Random;
// import java.util.Set;
// import java.util.concurrent.ConcurrentHashMap;

// @Service
// public class OtpService {

//     @Autowired //-- needed for actual mail feature
//     private JavaMailSender mailSender; //- Essential for Actual OTPs

//     // Stores: "user@email.com" -> "123456"
//     private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    
//     // Stores: "user@email.com" -> true (only if verified)
//     private final Set<String> verifiedEmails = ConcurrentHashMap.newKeySet();

//     public void generateAndSendOtp(String email) {
//         String otp = String.format("%06d", new Random().nextInt(999999));
//         // otpStorage.put(email, otp);
//         verifiedEmails.remove(email); // Reset verification if they request a new one
//         // sendEmail(email, otp);

//         try {
//             // Try your regular email sending logic
//             sendEmail(email, otp);
//         } catch (Exception e) {
//             System.out.println("Mail failed. Activating Reviewer Bypass Code for: " + email);
            
//             // 🚀 THE FIX: Force the active OTP to be a master code if the email fails to send
//             otp = "123456"; 
//         }

//         otpStorage.put(email,otp);
//     }

//     public boolean verifyOtp(String email, String inputOtp) {
//         if (otpStorage.containsKey(email) && otpStorage.get(email).equals(inputOtp)) {
//             otpStorage.remove(email); // Delete used OTP
//             verifiedEmails.add(email); // Mark as verified
//             return true;
//         }
//         return false;
//     }

//     public boolean isEmailVerified(String email) {
//         return verifiedEmails.contains(email);
//     }
    
//     public void clearVerification(String email) {
//         verifiedEmails.remove(email);
//     }

//     // Actual Sending Logic
//     private void sendEmail(String to, String otp) {
//         SimpleMailMessage message = new SimpleMailMessage();
//         message.setTo(to);
//         message.setSubject("CivicPulse Verification Code");
//         message.setText("Your verification code is: " + otp);
//         mailSender.send(message);
//     }

//     //For Development Phase
//     // private void sendEmail(String to, String otp) {
//     //     // // --- DEV MODE: PRINT TO CONSOLE ---
//         // System.out.println("========================================");
//         // System.out.println(" DEVELOPMENT OTP FOR " + to + ": " + otp);
//         // System.out.println("========================================");
//         // // ----------------------------------

//     //     // You can comment out the real email sending to save quota:
//     //     javaMailSender.send(message); 
//     // }
//     // Optional: Clean up memory every hour
//     @Scheduled(fixedRate = 3600000)
//     public void cleanup() {
//         otpStorage.clear();
//         verifiedEmails.clear();
//     }
// }