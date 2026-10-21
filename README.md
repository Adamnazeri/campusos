<div align="center">

<!-- ANIMATED HEADER BANNER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:1e3a8a,100:2563eb&height=220&section=header&text=🎓%20CampusOS&fontSize=65&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Enterprise-Grade%20School%20%26%20Campus%20Management%20Operating%20System&descAlignY=58&descSize=18" width="100%" alt="CampusOS Banner" />

<!-- ANIMATED TYPING SUBTITLE -->
<a href="https://github.com/Adamnazeri/campusos">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=21&duration=3000&pause=1000&color=3B82F6&center=true&vCenter=true&width=750&lines=⚡+Full-Stack+React+%2B+TypeScript+%2B+Vite+Architecture;🗄️+Zero-Config+SQLite+Engine+with+Node.js+REST+API;🔐+Encrypted+Records+%26+Automated+Offsite+Backups;🐳+Production-Ready+Docker+Container+Deployment" alt="Typing SVG" />
</a>

<br />

<!-- DYNAMIC GITHUB REPO BADGES -->
![GitHub Repo Size](https://img.shields.io/github/repo-size/Adamnazeri/campusos?style=for-the-badge&logo=github&color=1e293b&labelColor=0f172a)
![GitHub Last Commit](https://img.shields.io/github/last-commit/Adamnazeri/campusos?style=for-the-badge&logo=git&color=2563eb&labelColor=0f172a)
![GitHub Stars](https://img.shields.io/github/stars/Adamnazeri/campusos?style=for-the-badge&logo=apachespark&color=eab308&labelColor=0f172a)
![GitHub Forks](https://img.shields.io/github/forks/Adamnazeri/campusos?style=for-the-badge&logo=git&color=10b981&labelColor=0f172a)
![Release](https://img.shields.io/badge/Version-v1.0.0_Stable-8b5cf6?style=for-the-badge&labelColor=0f172a)

<br />

<!-- MODERN SKILL ICONS SHOWCASE -->
<a href="https://skillicons.dev">
  <img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind,nodejs,sqlite,docker,git,github,vscode&perline=10" alt="Tech Stack Icons" />
</a>

<br /><br />

<!-- NAVIGATION PILLS -->
<kbd> <a href="#-executive-overview">📖 Overview</a> </kbd>
<kbd> <a href="#-system-architecture">🏗️ Architecture</a> </kbd>
<kbd> <a href="#-rbac-permission-matrix">🛡️ RBAC Matrix</a> </kbd>
<kbd> <a href="#-quick-start--deployment">🚀 Quick Start</a> </kbd>
<kbd> <a href="#-api--database-specs">📡 API & DB</a> </kbd>
<kbd> <a href="#-project-roadmap">🗺️ Roadmap</a> </kbd>

</div>

<br />

---

## 📖 Executive Overview

**CampusOS** is a modern, self-contained educational ERP and campus management platform engineered for high reliability, instant responsiveness, and strict data sovereignty. Designed to eliminate bloated legacy software, it pairs a lightning-fast **React + TypeScript (Vite)** frontend with a resilient **Node.js + SQLite** backend—complete with cryptographic data protection, role-based access control, and one-click **Docker** deployment.

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>⚡ Next-Gen Frontend Engineering</h3>
      <ul>
        <li><b>Strict Type Safety:</b> End-to-end TypeScript interfaces prevent runtime data mismatches.</li>
        <li><b>Instant HMR & Bundling:</b> Powered by Vite for sub-second builds and zero-lag navigation.</li>
        <li><b>Adaptive UI System:</b> Crafted with Tailwind CSS for seamless desktop, tablet, and mobile responsiveness.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🛡️ Resilient Backend & Storage</h3>
      <ul>
        <li><b>Embedded ACID Database:</b> SQLite relational storage delivers high-speed local queries with zero external DB server overhead.</li>
        <li><b>Cryptographic Security:</b> Sensitive institutional records are protected via environment-bound encryption keys.</li>
        <li><b>Disaster Recovery:</b> Automated snapshot pipelines support secure offsite backups.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏗️ System Architecture

### 1. High-Level Infrastructure Topology
GitHub natively renders the color-coded topology below, illustrating how client requests traverse the application layers:

```mermaid
flowchart TB
    classDef client fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff
    classDef api fill:#065f46,stroke:#34d399,stroke-width:2px,color:#ffffff
    classDef db fill:#581c87,stroke:#c084fc,stroke-width:2px,color:#ffffff
    classDef sec fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#ffffff

    subgraph ClientLayer ["💻 Presentation Layer (Vite SPA)"]
        UI["⚛️ React 18 + TypeScript UI"]:::client
        TW["🎨 Tailwind CSS Design System"]:::client
        STATE["🔄 Client State & API Services"]:::client
        UI --- TW
        UI --> STATE
    end

    subgraph ServerLayer ["⚙️ Application & Security Layer (Node.js)"]
        GATEWAY["🌐 RESTful API Gateway"]:::api
        AUTH["🔐 Auth & RBAC Guard"]:::sec
        CRYPTO["🔑 Encryption Engine"]:::sec
        STATE <==>|"JSON / HTTP"| GATEWAY
        GATEWAY --> AUTH
        AUTH --> CRYPTO
    end

    subgraph DataLayer ["🗄️ Persistence & Disaster Recovery"]
        SQLITE[("🪶 SQLite Relational DB")]:::db
        LFS["📦 Git LFS Asset Store"]:::db
        BACKUP["☁️ Encrypted Offsite Backup"]:::db
        CRYPTO <==>|"Parameterized SQL"| SQLITE
        SQLITE -.->|"Automated Snapshot"| BACKUP
    end
```

### 2. Request & Data Lifecycle (Sequence Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👨‍💼 Admin / Staff
    participant SPA as ⚛️ React Frontend
    participant API as 🟢 Node.js API
    participant DB as 🪶 SQLite Engine
    participant Vault as ☁️ Offsite Backup

    User->>SPA: Triggers Action (e.g., Enroll Student / Update Record)
    SPA->>API: POST /api/records (Bearer Token + Payload)
    API->>API: Validate Role Permissions (RBAC) & Sanitize Input
    API->>DB: Execute Encrypted Transaction (ACID)
    DB-->>API: Commit Confirmation & Row ID
    API-->>SPA: 200 OK (Updated State JSON)
    SPA-->>User: Instant UI Toast & Table Refresh
    Note over DB,Vault: Scheduled Background Cron
    DB->>Vault: Push Encrypted Database Snapshot (.sqlite.enc)
```

---

## 🛡️ RBAC Permission Matrix

**CampusOS** enforces strict Role-Based Access Control across all core modules to protect institutional integrity:

| System Module | 🛡️ Super Admin | 👩‍💼 Office Staff | 👨‍🏫 Faculty / Teacher | 👨‍🎓 Student / Parent | Module Readiness |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **📊 Executive Analytics Dashboard** | ✅ Full Access | ✅ View & Export | 👀 View Assigned | ❌ Restricted | ![100%](https://geps.dev/progress/100) |
| **👨‍🎓 Student Enrollment & Profiles** | ✅ CRUD + Archive | ✅ Create & Edit | 👀 View Roster | 👀 Own Profile | ![100%](https://geps.dev/progress/100) |
| **👩‍🏫 Staff & HR Directory** | ✅ Full Access | 👀 View Directory | 👀 Department Only | ❌ Restricted | ![100%](https://geps.dev/progress/100) |
| **📅 Timetable & Room Allocation** | ✅ Full Override | ✅ Manage Schedules | ✅ View & Request | 👀 View Schedule | ![95%](https://geps.dev/progress/95) |
| **📝 Attendance & Grading Ledger** | ✅ Audit & Unlock | 👀 Generate Reports | ✅ Mark & Grade | 👀 View Summary | ![95%](https://geps.dev/progress/95) |
| **🔐 Encryption & Offsite Backups** | ✅ Full Control | ❌ Restricted | ❌ Restricted | ❌ Restricted | ![100%](https://geps.dev/progress/100) |

---

## 🛠️ Technology Stack Specification

| Domain | Technology | Version | Architectural Role |
| :--- | :--- | :---: | :--- |
| **Frontend Core** | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) | `18.x` | Component-based declarative UI rendering |
| **Type System** | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | `5.x` | Compile-time type checking and contract enforcement |
| **Build Tooling** | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | `5.x` | ESBuild-powered bundler and instant HMR dev server |
| **Styling Engine** | ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white) | `3.x` | Utility-first CSS framework for consistent design tokens |
| **Backend Server** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | `18+ LTS` | Asynchronous REST API, business logic, and file I/O |
| **Database** | ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) | `3.x` | Embedded, zero-latency relational SQL engine |
| **Containerization** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) | `24+` | Reproducible client packaging and isolated deployment |

---

## 🚀 Quick Start & Deployment

> [!IMPORTANT]
> **Prerequisites:** Ensure **Node.js (`>= 18.x`)**, **Git**, and **Git LFS** are installed on your host machine before cloning.

### ⚡ Step 1: Clone & Initialize
```bash
# Clone both repositories (Main or v1.0 Release)
git clone [https://github.com/Adamnazeri/campusos.git](https://github.com/Adamnazeri/campusos.git)
cd campusos

# Pull any binary/media assets tracked by Git LFS
git lfs pull
```

### ⚙️ Step 2: Environment Variables Setup
Create a `.env` file in the root directory before launching the server:

<details open>
<summary><b>🔑 Click to view <code>.env</code> Configuration Template</b></summary>
<br />

```ini
# ==========================================
# CAMPUSOS ENVIRONMENT CONFIGURATION
# ==========================================
NODE_ENV=development
PORT=5173
API_PORT=3001

# Database & Storage
DB_PATH=./server/data/campusos.sqlite

# Security & Cryptography (Generate strong 256-bit keys in production)
ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here
JWT_SECRET=your_super_secret_jwt_signing_key_here

# Offsite Backup Configuration
BACKUP_ENABLED=true
BACKUP_INTERVAL_CRON=0 2 * * *
```
</details>

### 🖥️ Step 3: Choose Your Launch Mode

<details open>
<summary><b>💻 Option A: Local Development Mode (Hot-Reload)</b></summary>
<br />

```bash
# 1. Install all dependencies
npm install

# 2. Start Vite + Node development server
npm run dev
```
> 🌐 **Access App:** Open your browser and navigate to **`http://localhost:5173`**
</details>

<details>
<summary><b>🐳 Option B: Production Docker Deployment (Recommended for Clients)</b></summary>
<br />

```bash
# 1. Build and spin up isolated containers in detached mode
docker-compose up -d --build

# 2. Verify container health and live logs
docker-compose ps
docker-compose logs -f
```
</details>

<details>
<summary><b>📦 Option C: Standalone Production Build</b></summary>
<br />

```bash
# Compile TypeScript and minify static assets into /dist
npm run build

# Preview production bundle locally
npm run preview
```
</details>

---

## 📡 API & Database Specs

<details>
<summary><b>🔌 Core REST API Endpoints Overview (Click to Expand)</b></summary>
<br />

| Method | Endpoint | Auth Required | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | ❌ Public | Authenticates user credentials and issues session token |
| `GET` | `/api/dashboard/stats` | ✅ Bearer | Retrieves aggregated campus KPIs and attendance metrics |
| `GET` | `/api/students` | ✅ Bearer | Lists paginated student records with search & filter query params |
| `POST` | `/api/students` | ✅ Admin/Staff | Registers a new student record into SQLite |
| `PUT` | `/api/students/:id` | ✅ Admin/Staff | Updates existing student profile or academic status |
| `POST` | `/api/system/backup` | ✅ Super Admin | Triggers an immediate encrypted SQLite snapshot |

</details>

<details>
<summary><b>📂 Complete Repository Directory Tree (Click to Expand)</b></summary>
<br />

```text
campusos/
├── 📁 public/                  # Static branding assets, favicons & manifest
├── 📁 server/                  # Node.js backend service
│   ├── 📁 controllers/         # Request handlers & business logic
│   ├── 📁 data/                # SQLite database file & encrypted snapshots
│   ├── 📁 middleware/          # Auth, RBAC & payload encryption guards
│   └── 📄 index.ts             # Backend entry point
├── 📁 src/                     # React + TypeScript frontend source
│   ├── 📁 assets/              # UI illustrations & media (Git LFS tracked)
│   ├── 📁 components/          # Reusable UI primitives (Tables, Modals, Cards)
│   ├── 📁 context/             # Global Auth & Theme state providers
│   ├── 📁 pages/               # Route-level views (Dashboard, Students, Settings)
│   ├── 📁 services/            # Axios/Fetch API wrappers
│   ├── 📁 types/               # Shared TypeScript interfaces & schemas
│   ├── 📄 App.tsx              # Application router & shell layout
│   └── 📄 main.tsx             # React DOM mount point
├── 📄 .env.example             # Sample environment variables template
├── 📄 .gitattributes           # Git LFS tracking rules
├── 📄 docker-compose.yml       # Multi-container orchestration config
├── 📄 Dockerfile               # Production container build instructions
├── 📄 package.json             # Dependencies & scripts manifest
├── 📄 tailwind.config.js       # Custom design tokens & utility config
├── 📄 tsconfig.json            # Strict TypeScript compiler rules
├── 📄 vite.config.ts           # Vite bundler & proxy configuration
└── 📄 README.md                # Documentation hub
```
</details>

---

## 🗺️ Project Roadmap

- [x] **Phase 1:** Core SPA Architecture with React, TypeScript & Tailwind CSS
- [x] **Phase 2:** Embedded SQLite Database & Node.js REST API Integration
- [x] **Phase 3:** Role-Based Access Control (RBAC) & Encrypted Data Storage
- [x] **Phase 4:** Docker Containerization & Automated Offsite Backup Pipeline
- [ ] **Phase 5:** Real-time Parent/Student Notification Portal (WebSockets / Push)
- [ ] **Phase 6:** AI-Assisted Timetable Conflict Resolver & Attendance Analytics

---

## 🛡️ Security Policy & Best Practices

> [!WARNING]
> **Never commit `.env` files, raw `.sqlite` production databases, or private encryption keys to version control.** Always verify `.gitignore` rules before pushing client updates.

* **Key Rotation:** Rotate `ENCRYPTION_KEY` and `JWT_SECRET` periodically using the built-in re-encryption utility.
* **Backup Verification:** Test restoring offsite `.sqlite` snapshots in a staging container quarterly to guarantee zero data loss (RPO/RTO compliance).

---

<div align="center">

## 👨‍💻 Author & Maintainer

<img src="https://github.com/Adamnazeri.png" width="90" height="90" style="border-radius: 50%;" alt="Adam Nazeri" />

### **Adam Nazeri**
*Software Developer & System Integrator*

[![GitHub](https://img.shields.io/badge/GitHub-@Adamnazeri-181717?style=for-the-badge&logo=github)](https://github.com/Adamnazeri)
[![Repo](https://img.shields.io/badge/Repository-CampusOS-2563eb?style=for-the-badge&logo=git&logoColor=white)](https://github.com/Adamnazeri/campusos)

<br />

**⭐ If CampusOS inspires your workflow or helps your institution, give this repository a Star! ⭐**

<!-- ANIMATED FOOTER WAVE -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:1e3a8a,100:2563eb&height=110&section=footer" width="100%" alt="Footer Wave" />

</div>
