# CivicPulse Hub 🏢💡
### A Unified Smart City Feedback & Grievance Tracking Platform

---

## 👨‍💻 Project Metadata & Attribution
* **Developer:** Satti Devendra Adi Reddy
* **Context:** Software Development Internship (Backend Focus) Project 
* **Organization:** Infosys Springboard
* **Tenure:** November 2025 – January 2026
* **Academic Institution:** Sasi Institute of Technology and Engineering (SASI), Computer Science and Engineering

---

## 🎯 Project Overview & Core Mission
CivicPulse Hub is an enterprise-grade, role-based grievance tracking system designed to eliminate structural inefficiencies in municipal municipal reporting. The platform digitizes the standard workflow of citizen issue lodging, administrative evaluation, algorithmic workload allocation, and field verification. 

By binding public administration milestones to hard performance indicators (such as 24-hour service-level deadlines) and cryptographically verifying user context via JWT and dynamic background communication hooks, it bridges the trust gap between citizens and local governance bodies.

---

## ✨ Highlight Features & Operational Flow

### 1. Robust Multi-Role Ecosystem & Visual Dashboards
The system features isolated workflows for three distinct user archetypes:
* **Citizen Portal**: Allows users to dynamically map out geolocation points, submit media attachments, monitor individual ticket history, trigger complaint reopenings, and submit resolution quality ratings.
* **Department Officer Terminal**: Provides field workers with prioritized task lists, SLA countdown thresholds, automated status transition logs, and material utilization inputs.
* **Super Admin Control Center**: Offers comprehensive controls for system data streams, including officer registration approvals, real-time ticket reassignments, validation feedback processing, and macro analytical tracking panels.

### 2. Decoupled, Non-Blocking OTP Infrastructure
* **Frontend Resilience**: Built using custom React hooks (`useOtp.ts`) utilizing pure promise layout streams to ensure UI forms never freeze or deadlock during network handshakes.
* **Backend Mail Client**: Utilizes multi-threaded asynchronous background loops communicating securely over Port 443 to drop production authentication parameters seamlessly via external Brevo SMTP endpoints without stalling core main thread runtime environments.

### 3. Dynamic Visual Analytics Engine
The Admin and Officer dashboards deploy custom responsive interactive components to track operational performance using time-series data:
* **7-Day Filing Trend AreaChart**: Maps out regional issue escalation speeds over a sliding timeline.
* **Category & Zone Resource BarCharts**: Identifies public infrastructure friction points categorized by department types and local structural wards.
* **SLA Compliance Tracking**: Analyzes resolution velocity against a strict 24-hour baseline.

### 4. Enterprise Data Integrity & Local Storage Pipeline
* **Comprehensive Relational Logging**: Tracks the entire lifecycle of a grievance inside dedicated audit tables (`complaint_history`) mapping out action constraints, timestamp vectors, user role IDs, and modification contexts.
* **Secure Local Asset Serving**: Bypasses traditional Cross-Origin Resource Sharing (CORS) image blocks by spinning up native operating-system relative file mapping directories utilizing custom Spring `WebMvcConfigurer` handlers.

---

## 🛠️ Technology Stack

### Backend Infrastructure
* **Core Framework**: Spring Boot 3.x (Java 17)
* **Security & Auth**: Spring Security 6.x (Stateless JSON Web Tokens, BCrypt password hashing, method-level `@EnableMethodSecurity` rules)
* **Data Access**: Spring Data JPA (Hibernate ORM mapping engine)
* **Database Target**: Relational Engine supporting MySQL-compatible syntax mappings (H2 In-Memory Sandbox with remote administrative console routing overrides)
* **Communication Clients**: Java Native HTTP Client 11 (Brevo REST Communication Stream API)

### Frontend Engine
* **Library Framework**: React.js 18 (TypeScript Strict Compilation Environment)
* **Build System**: Vite.js
* **Data Visualization**: Recharts (High-Performance Vector Graphics Charts)
* **State & Routing**: React Context Subsystems & React Router DOM 6

### Database Architecture & Persistence Layer
* **Database Engine Migration**: Architected originally for **MySQL** database infrastructures; dynamically modified and refactored to **H2 Database Engine (In-Memory Sandbox Operation Mode)** to satisfy server-side storage and deployment constraints on Render's free tier.
* **ORM Engine**: Hibernate 6.x (High-performance object-relational abstraction runtime mapper handling schema generation dynamically).
* **Abstraction Layer**: Spring Data JPA (Automated repository interfaces mapping straight to JPQL and native SQL queries).
* **Configuration Profile**: Managed with programmatic remote accessibility switches (`web-allow-others=true`) and secure frame rendering bypasses (`SAMEORIGIN`) to ensure accessible browser-based administration.
* **Seeding Infrastructure**: Automated runtime instantiation via a multi-layered `CommandLineRunner` script that generates time-series mock records and configures local disk binary file tracking on system hot-starts.

---

## 📁 Repository Directory Architecture
```text
C:.
│   package-lock.json
│   package.json
│
├───backend
│   │   .gitattributes
│   │   mvnw
│   │   mvnw.cmd
│   │   pom.xml
│   │
│   ├───.mvn
│   │   └───wrapper
│   │           maven-wrapper.properties
│   │
│   ├───src
│   │   ├───main
│   │   │   ├───java
│   │   │   │   └───com
│   │   │   │       └───civicpulse
│   │   │   │           └───backend
│   │   │   │               │   BackendApplication.java
│   │   │   │               │
│   │   │   │               ├───config
│   │   │   │               │       DataSeeder.java
│   │   │   │               │       JwtAuthenticationFilter.java
│   │   │   │               │       SecurityConfig.java
│   │   │   │               │       WebConfig.java
│   │   │   │               │
│   │   │   │               ├───controller
│   │   │   │               │       AdminController.java
│   │   │   │               │       AuthController.java
│   │   │   │               │       CitizenController.java
│   │   │   │               │       ComplaintController.java
│   │   │   │               │       NotificationController.java
│   │   │   │               │       OfficerController.java
│   │   │   │               │       ResetPasswordRequest.java
│   │   │   │               │       UserController.java
│   │   │   │               │
│   │   │   │               ├───model
│   │   │   │               │       Complaint.java
│   │   │   │               │       ComplaintCategory.java
│   │   │   │               │       ComplaintHistory.java
│   │   │   │               │       Notification.java
│   │   │   │               │       User.java
│   │   │   │               │
│   │   │   │               └───repository
│   │   │   │                       ComplaintCategoryRepository.java
│   │   │   │                       ComplaintHistoryRepository.java
│   │   │   │                       ComplaintRepository.java
│   │   │   │                       NotificationRepository.java
│   │   │   │                       UserRepository.java
│   │   │   │               │
│   │   │   │               └───services
│   │   │   │                       CustomUserDetailsService.java
│   │   │   │                       MailService.java
│   │   │   │                       OtpService.java
│   │   │   │
│   │   │   └───resources
│   │   │       │   application.properties
│   │   │       │
│   │   │       ├───static
│   │   │       └───templates
│   │   └───test
│   │       └───java
│   │           └───com
│   │               └───civicpulse
│   │                   └───backend
│   │                           BackendApplicationTests.java
│   │
│   └───uploads
│
└───civicpulse-frontend
    │   eslint.config.js
    │   index.html
    │   package-lock.json
    │   package.json
    │   README.md
    │   tsconfig.app.json
    │   tsconfig.json
    │   tsconfig.node.json
    │   vite.config.ts
    │
    └───src
        │   App.tsx
        │   main.tsx
        │
        ├───api
        │       admin.ts
        │       auth.ts
        │       client.ts
        │       complaint.ts
        │
        ├───auth
        │       AuthContext.tsx
        │       ProtectedRoute.tsx
        │
        ├───components
        │   ├───Auth
        │   │       AuthForm.tsx
        │   │       MarketingPanel.tsx
        │   │
        │   ├───Common
        │   │       ImageViewer.tsx
        │   │       NotificationBell.tsx
        │   │       SkeletonLoader.tsx
        │   │
        │   └───Complaints
        │           ComplaintForm.tsx
        │           ComplaintList.tsx
        │
        ├───hooks
        │       useOtp.ts
        │
        ├───pages
        │       AdminDashBoard.tsx
        │       CitizenDashboard.tsx
        │       LoginPage.tsx
        │       MainPage.css
        │       OfficerDashBoard.tsx
        │       SignUpPage.tsx
        │
        └───types
                auth.ts
```

## 🛠️ Local Installation & Environment Setup

## 1. Backend Engine Construction

Navigate to the target subdirectory container workspace:

```bash
cd backend
```

Ensure your `src/main/resources/application.properties` configuration details match your sandbox variables:

```properties

# Inject target authorization values
BREVO_API_KEY=YOUR_PRODUCTION_XKEYSIB_TOKEN_HERE
```

Install dependencies and compile the execution bytecode:

```bash
./mvnw clean package
```

Fire up the Spring Boot execution target:

```bash
./mvnw spring-boot:run
```

---

## 2. Frontend Layout Initialization

Route back down into your reactive application folder root:

```bash
cd civicpulse-frontend
```

Download the compiled module dependency trees:

```bash
npm install
```

Launch the local client development server wrapper over Vite:

```bash
npm run dev
```

Access the running UI framework by loading:

```text
http://localhost:5173
```

into your browser.

---

# 🌐 Deployment Configuration & Cloud Integration Architecture

The operational layout of **CivicPulse Hub** relies on an interconnected, modern cloud infrastructure mapping to ensure delivery speed, stability, and zero development friction:

```text
  +-----------------------+              +------------------------+
  |    GitHub Repository  |              |      UptimeRobot       |
  |  (Source Code Matrix) |              |  (Inactivity KeepAlive)|
  +-----------+-----------+              +-----------+------------+
              |                                      |
     [Auto-Build Triggers]                    [HTTP Ping Loops]
              |                                      |
     +--------+--------+                             |
     |                 |                             v
     v                 v               +-------------+------------+
+----+----+      +-----+---+           |   Render Cloud Engine    |
| Netlify |      | Brevo   |<=========>| (Spring Boot API Server) |
| (React) |      | (Mails) | [REST API]| (H2 Database Sandbox)    |
+---------+      +---------+           +-------------+------------+
                                                     |
                                            [Serves Local Assets]
                                                     v
                                       +-------------+------------+
                                       |      /uploads Folder     |
                                       | (Static Binary Evidence) |
                                       +--------------------------+
```

---

## 1. GitHub (Source Version Matrix)

Acts as the single source of truth for code orchestration. Leveraging explicit branch structuring rules, code modifications committed locally instantly trigger centralized Webhook updates across deployment nodes.

---

## 2. Render (Backend Application & Database Server)

Hosts the compiled Java Spring Boot microservice environment within a containerized Linux virtual image space. It manages runtime dependencies, handles the embedded secure H2 Relational database RAM space, and exposes a secure HTTPS connection endpoint to handle outside API consumption requests.

---

## 3. Netlify (Static Web Application Client)

Hosts the compiled production-optimized bundle of the React frontend application. Netlify monitors the frontend directory on GitHub, handling automatic continuous deployment pipelines on every push, and ensures delivery via rapid content delivery network nodes (CDNs).

---

## 4. Brevo (Dynamic Communication Infrastructure)

Acts as the system’s dedicated transactional email engine. When the Spring Boot runtime issues a payload command via its native HTTP client configuration, Brevo captures the parameters, processes the HTML structure templates, and delivers secure OTP codes directly to citizen email inboxes.

---

## 5. UptimeRobot (Performance Stability Monitoring)

Addresses the operational limitations of free cloud servers. Because free Render instances automatically enter low-power sleep states after 15 minutes of user inactivity, UptimeRobot executes automated 5-minute HTTP ping intervals to the backend health route. This keeps the application container perpetually awake, preventing long delays for evaluation panels.

---

# ⚠️ Challenges Faced & Resolution Paths

## 1. Early Development: Database Layer Structural Realignment (MySQL to H2)

### The Issue:
The backend architecture was originally built, tested, and optimized locally for a standalone **MySQL** relational database database cluster. However, migrating to a free cloud hosting tier on Render created a constraint: standard persistent external storage volumes were limited or required premium tier upgrades. Deploying the raw MySQL connection caused container timeouts and database connection initialization drops.

### The Fix:
Dynamically re-architected the data layer to utilize an embedded **H2 Relational Database Engine** running in **In-Memory Sandbox Operation Mode** for production deployment. This required modifying database dialects, overriding default Spring Security frame protection rules (`SAMEORIGIN`), and configuring a secure web console dashboard fallback (`web-allow-others=true`) so interviewers could still review relational user data dynamically through their web browsers.

---

## 2. Mid Development: The JSX Rendering Phase Asynchronous Loop Violation

### The Issue:
While integrating the administrative analytics dashboards, early UI implementations attempted to compute custom metrics (such as calculating citizen satisfaction star averages) by calling asynchronous API hooks (`await getUserComplaints()`) directly inside a synchronous JavaScript `.map()` loop during the JSX render phase. This fundamentally violated React lifecycle principles, causing immediate component crashes, infinite render loops, and frozen dashboards.

### The Fix:
Abstracted data aggregation algorithms completely out of the presentation layer. Refactored the collection pipeline into a structured React lifecycle combination: initializing independent loading states and hooking into a standalone `useEffect` layout block. The refined setup fires all citizen metrics concurrently using highly optimized `Promise.all` arrays in the background before updating state parameters synchronously.

---

## 3. Late Development & Deployment: Ephemeral Storage Reset and Media Blocks

### The Issue:
During final cloud deployments onto Render and Netlify, two severe post-production bottlenecks emerged. First, because Render's free tiers run on ephemeral virtual containers that spin down after 15 minutes of inactivity, the new H2 memory stack was completely wiped clean on hot-starts, rendering Recharts graph components completely flat and empty. Second, using external backup URLs like Google Drive resulted in broken thumbnail links inside dashboard rows due to secure HTML image wrappers and strict Cross-Origin Resource Sharing (CORS) blocks.

### The Fix:
Implemented a two-pronged solution to guarantee a production-ready presentation layout out of the box:
* **Time-Series Data Scaffolding**: Programmatically configured `DataSeeder.java` with a multi-layered `CommandLineRunner` that hooks into Java `Calendar` instances. Every time the server performs a cold-boot, it automatically seeds active complaints dynamically scattered across a mock 7-day timeline ("4 days ago", "Yesterday", "Today"), forcing Recharts area graphs to instantly display beautiful operational trends.
* **Native File Storage Handler**: Refactored the file pipeline away from external cloud dependencies entirely. Configured a dedicated physical storage directory (`/uploads/`) right on the server instance filesystem, whitelisting its security routes and deploying a custom Spring `WebMvcConfigurer` to stream binary data assets natively to the web browser without permission errors.

---

# 🔮 Future Enhancements

## 1. Persistent External Relational Clustering

Move from volatile in-memory storage to a production cloud configuration (such as Supabase or AWS RDS PostgreSQL) to secure historical analytical entries across deployment pipelines permanently.

---

## 2. Real-time Event Messaging Channels

Introduce Spring WebSockets to emit notifications (like administrative task reassignments) instantly to field users without relying on recurring REST polling routines.

---

## 3. Automated Spatial Clustering Analysis

Expand the Leaflet GIS framework to aggregate adjacent geographic problem points automatically into structural hot-zones, optimizing logistical scheduling loops for municipal maintenance workflows.


# Conclusion

CivicPulse Hub demonstrates a scalable and modern full-stack civic management platform by integrating React, Spring Boot, cloud deployment services, and automated monitoring tools into a unified ecosystem. The project successfully addresses real-world challenges related to deployment stability, asynchronous rendering, and secure media handling while maintaining a lightweight and developer-friendly architecture. With planned enhancements such as persistent cloud databases, real-time communication channels, and intelligent geographic clustering, the system has strong potential to evolve into a production-ready smart governance solution capable of improving municipal issue tracking and citizen engagement.