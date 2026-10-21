<div align="center">

<!-- ANIMATED HEADER BANNER -->
<img src="https://capsule-render.vercel.app/api?type=venom&amp;color=0:0f172a,50:1e3a8a,100:2563eb&amp;height=240&amp;section=header&amp;text=CampusOS&amp;fontSize=72&amp;fontColor=ffffff&amp;animation=fadeIn&amp;fontAlignY=38&amp;desc=Enterprise-Grade%20School%20%26%20Campus%20Management%20Operating%20System&amp;descAlignY=60&amp;descSize=18" width="100%" alt="CampusOS Banner" />

<!-- ANIMATED TYPING SUBTITLE -->
<a href="https://github.com/Adamnazeri/campusos">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;weight=600&amp;size=21&amp;duration=3000&amp;pause=1000&amp;color=60A5FA&amp;center=true&amp;vCenter=true&amp;width=900&amp;height=40&amp;lines=Full-Stack+React+%2B+TypeScript+%2B+Vite;Zero-Config+SQLite+%2B+Node.js+REST+API;Encrypted+Records+%26+Automated+Offsite+Backups;Production-Ready+Docker+Deployment" alt="Typing SVG" />
</a>

<br /><br />

<!-- BADGES -->
<img src="https://img.shields.io/github/repo-size/Adamnazeri/campusos?style=for-the-badge&amp;logo=github&amp;color=1e293b&amp;labelColor=0f172a" alt="Repo Size" />
<img src="https://img.shields.io/github/last-commit/Adamnazeri/campusos?style=for-the-badge&amp;logo=git&amp;logoColor=white&amp;color=2563eb&amp;labelColor=0f172a" alt="Last Commit" />
<img src="https://img.shields.io/github/stars/Adamnazeri/campusos?style=for-the-badge&amp;logo=github&amp;color=eab308&amp;labelColor=0f172a" alt="Stars" />
<img src="https://img.shields.io/github/forks/Adamnazeri/campusos?style=for-the-badge&amp;logo=github&amp;color=10b981&amp;labelColor=0f172a" alt="Forks" />
<img src="https://img.shields.io/badge/Version-v1.0.0_Stable-8b5cf6?style=for-the-badge&amp;labelColor=0f172a" alt="Version" />

<br /><br />

<!-- TECH ICONS -->
<a href="https://skillicons.dev">
  <img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind,nodejs,sqlite,docker,git,github,vscode&amp;perline=10" alt="Tech Stack Icons" />
</a>

<br /><br />

<!-- NAVIGATION -->
<kbd> <a href="#overview">📖 Overview</a> </kbd>
<kbd> <a href="#features">✨ Features</a> </kbd>
<kbd> <a href="#architecture">🏗️ Architecture</a> </kbd>
<kbd> <a href="#rbac">🛡️ RBAC</a> </kbd>
<kbd> <a href="#quickstart">🚀 Quick Start</a> </kbd>
<kbd> <a href="#api">📡 API</a> </kbd>
<kbd> <a href="#roadmap">🗺️ Roadmap</a> </kbd>

</div>

<br />

---

<a id="overview"></a>
## 📖 Executive Overview

**CampusOS** is a modern, self-contained school ERP and campus management platform built for reliability, speed, and full data ownership. It replaces bloated legacy software with a fast **React + TypeScript (Vite)** frontend and a lightweight **Node.js + SQLite** backend, complete with encryption, role-based access control, and one-command **Docker** deployment.

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>⚡ Modern Frontend</h3>
      <ul>
        <li><b>Strict Type Safety:</b> End-to-end TypeScript interfaces catch data mismatches before runtime.</li>
        <li><b>Instant HMR &amp; Builds:</b> Vite delivers near-instant dev feedback and fast production bundles.</li>
        <li><b>Responsive by Design:</b> Tailwind CSS adapts cleanly to desktop, tablet, and mobile.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🛡️ Resilient Backend</h3>
      <ul>
        <li><b>Embedded ACID Database:</b> SQLite gives fast local queries with no external DB server to manage.</li>
        <li><b>Encrypted Records:</b> Sensitive data is protected with environment-bound encryption keys.</li>
        <li><b>Disaster Recovery:</b> Scheduled snapshots support secure offsite backups.</li>
      </ul>
    </td>
  </tr>
</table>

---

<a id="features"></a>
## ✨ Features at a Glance

| | | |
| :---: | :---: | :---: |
| 📊 **Analytics Dashboard**<br/>Live campus KPIs & attendance metrics | 👨‍🎓 **Student Management**<br/>Enrollment, profiles & archiving | 👩‍🏫 **Staff & HR Directory**<br/>Department-aware staff records |
| 📅 **Timetable & Rooms**<br/>Schedules and room allocation | 📝 **Attendance & Grading**<br/>Mark, grade, audit & unlock | 🔐 **Encryption & Backups**<br/>Encrypted snapshots, one-click trigger |
| 🛡️ **Granular RBAC**<br/>Four roles, strict permissions | 🐳 **Docker Ready**<br/>`docker compose up` and go | 📱 **Fully Responsive**<br/>Works on any screen size |

---

<a id="architecture"></a>
## 🏗️ System Architecture

### 1. High-Level Topology

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
    end

    subgraph ServerLayer ["⚙️ Application & Security Layer (Node.js)"]
        GATEWAY["🌐 REST API Gateway"]:::api
        AUTH["🔐 Auth & RBAC Guard"]:::sec
        CRYPTO["🔑 Encryption Engine"]:::sec
    end

    subgraph DataLayer ["🗄️ Persistence & Disaster Recovery"]
        SQLITE[("🪶 SQLite Database")]:::db
        LFS["📦 Git LFS Asset Store"]:::db
        BACKUP["☁️ Encrypted Offsite Backup"]:::db
    end

    UI --- TW
    UI --> STATE
    STATE <==>|"JSON / HTTP"| GATEWAY
    GATEWAY --> AUTH
    AUTH --> CRYPTO
    CRYPTO <==>|"Parameterized SQL"| SQLITE
    SQLITE -.->|"Scheduled Snapshot"| BACKUP
```

### 2. Request & Data Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as 👨‍💼 Admin / Staff
    participant SPA as ⚛️ React Frontend
    participant API as 🟢 Node.js API
    participant DB as 🪶 SQLite
    participant Vault as ☁️ Offsite Backup

    User->>SPA: Trigger action (e.g. enroll student)
    SPA->>API: POST /api/students (Bearer token + payload)
    API->>API: Verify role (RBAC) & sanitize input
    API->>DB: Execute encrypted transaction (ACID)
    DB-->>API: Commit confirmation + row ID
    API-->>SPA: 200 OK (updated JSON)
    SPA-->>User: Toast notification & table refresh
    Note over DB,Vault: Scheduled background cron
    DB->>Vault: Push encrypted snapshot (.sqlite.enc)
```

---

<a id="rbac"></a>
## 🛡️ RBAC Permission Matrix

CampusOS enforces strict Role-Based Access Control across every core module:

| System Module | 🛡️ Super Admin | 👩‍💼 Office Staff | 👨‍🏫 Faculty | 👨‍🎓 Student / Parent | Readiness |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **📊 Analytics Dashboard** | ✅ Full Access | ✅ View & Export | 👀 View Assigned | ❌ Restricted | ![100%](https://img.shields.io/badge/100%25-10b981?style=flat-square) |
| **👨‍🎓 Student Enrollment & Profiles** | ✅ CRUD + Archive | ✅ Create & Edit | 👀 View Roster | 👀 Own Profile | ![100%](https://img.shields.io/badge/100%25-10b981?style=flat-square) |
| **👩‍🏫 Staff & HR Directory** | ✅ Full Access | 👀 View Directory | 👀 Department Only | ❌ Restricted | ![100%](https://img.shields.io/badge/100%25-10b981?style=flat-square) |
| **📅 Timetable & Room Allocation** | ✅ Full Override | ✅ Manage Schedules | ✅ View & Request | 👀 View Schedule | ![95%](https://img.shields.io/badge/95%25-eab308?style=flat-square) |
| **📝 Attendance & Grading** | ✅ Audit & Unlock | 👀 Generate Reports | ✅ Mark & Grade | 👀 View Summary | ![95%](https://img.shields.io/badge/95%25-eab308?style=flat-square) |
| **🔐 Encryption & Offsite Backups** | ✅ Full Control | ❌ Restricted | ❌ Restricted | ❌ Restricted | ![100%](https://img.shields.io/badge/100%25-10b981?style=flat-square) |

> **Legend:** ✅ can act •  👀 read-only  •  ❌ no access

---

## 🛠️ Technology Stack

| Domain | Technology | Version | Role |
| :--- | :--- | :---: | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) | `18.x` | Component-based declarative UI |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | `5.x` | Static typing & contract enforcement |
| **Build Tool** | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | `5.x` | Fast bundler & HMR dev server |
| **Styling** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | `3.x` | Utility-first design tokens |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | `18+ LTS` | REST API, business logic, file I/O |
| **Database** | ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) | `3.x` | Embedded relational SQL engine |
| **Container** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) | `24+` | Reproducible, isolated deployment |

---

<a id="quickstart"></a>
## 🚀 Quick Start & Deployment

> [!IMPORTANT]
> **Prerequisites:** **Node.js `>= 18`**, **Git**, and **Git LFS** must be installed before cloning.

### ⚡ Step 1: Clone & Initialize

```bash
# Clone the repository
git clone https://github.com/Adamnazeri/campusos.git
cd campusos

# Pull binary/media assets tracked by Git LFS
git lfs install
git lfs pull
```

### ⚙️ Step 2: Configure Environment

Copy the sample file, then edit the values:

```bash
cp .env.example .env
```

<details open>
<summary><b>🔑 <code>.env</code> configuration template</b></summary>
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

# Security & Cryptography (use strong 256-bit keys in production)
ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here
JWT_SECRET=your_super_secret_jwt_signing_key_here

# Offsite Backup
BACKUP_ENABLED=true
BACKUP_INTERVAL_CRON=0 2 * * *
```

> 💡 **Generate secure keys:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

</details>

### 🖥️ Step 3: Choose Your Launch Mode

<details open>
<summary><b>💻 Option A: Local Development (Hot Reload)</b></summary>
<br />

```bash
npm install
npm run dev
```

🌐 Open **http://localhost:5173**

</details>

<details>
<summary><b>🐳 Option B: Docker Deployment (Recommended for Production)</b></summary>
<br />

```bash
# Build and start containers in the background
docker compose up -d --build

# Check health and follow logs
docker compose ps
docker compose logs -f
```

</details>

<details>
<summary><b>📦 Option C: Standalone Production Build</b></summary>
<br />

```bash
# Type-check and bundle static assets into /dist
npm run build

# Preview the production bundle locally
npm run preview
```

</details>

---

<a id="api"></a>
## 📡 API & Database Specs

<details>
<summary><b>🔌 Core REST API Endpoints</b></summary>
<br />

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | 🌍 Public | Authenticate credentials and issue a session token |
| `GET` | `/api/dashboard/stats` | 🔑 Bearer | Aggregated campus KPIs and attendance metrics |
| `GET` | `/api/students` | 🔑 Bearer | Paginated student list with search & filters |
| `POST` | `/api/students` | 🛡️ Admin / Staff | Register a new student record |
| `PUT` | `/api/students/:id` | 🛡️ Admin / Staff | Update a student profile or academic status |
| `POST` | `/api/system/backup` | 👑 Super Admin | Trigger an immediate encrypted snapshot |

</details>

<details>
<summary><b>📂 Repository Structure</b></summary>
<br />

```text
campusos/
├── 📁 public/              # Static assets, favicons & manifest
├── 📁 server/              # Node.js backend
│   ├── 📁 controllers/     # Request handlers & business logic
│   ├── 📁 data/            # SQLite database & encrypted snapshots
│   ├── 📁 middleware/      # Auth, RBAC & encryption guards
│   └── 📄 index.ts         # Backend entry point
├── 📁 src/                 # React + TypeScript frontend
│   ├── 📁 assets/          # Illustrations & media (Git LFS)
│   ├── 📁 components/      # Reusable UI (Tables, Modals, Cards)
│   ├── 📁 context/         # Auth & Theme providers
│   ├── 📁 pages/           # Route views (Dashboard, Students, Settings)
│   ├── 📁 services/        # API wrappers
│   ├── 📁 types/           # Shared TypeScript interfaces
│   ├── 📄 App.tsx          # Router & shell layout
│   └── 📄 main.tsx         # React DOM entry
├── 📄 .env.example         # Environment template
├── 📄 .gitattributes       # Git LFS rules
├── 📄 docker-compose.yml   # Container orchestration
├── 📄 Dockerfile           # Production image build
├── 📄 package.json         # Dependencies & scripts
├── 📄 tailwind.config.js   # Design tokens
├── 📄 tsconfig.json        # TypeScript config
├── 📄 vite.config.ts       # Vite & proxy config
└── 📄 README.md
```

</details>

---

<a id="roadmap"></a>
## 🗺️ Project Roadmap

- [x] **Phase 1:** Core SPA with React, TypeScript & Tailwind CSS
- [x] **Phase 2:** Embedded SQLite & Node.js REST API
- [x] **Phase 3:** Role-Based Access Control & encrypted storage
- [x] **Phase 4:** Docker containerization & automated offsite backups
- [ ] **Phase 5:** Real-time parent/student notification portal (WebSockets / Push)
- [ ] **Phase 6:** AI-assisted timetable conflict resolver & attendance analytics

---

## 🔒 Security Policy & Best Practices

> [!WARNING]
> **Never commit `.env` files, production `.sqlite` databases, or private encryption keys.** Double-check your `.gitignore` before every push.

- 🔄 **Key Rotation:** Rotate `ENCRYPTION_KEY` and `JWT_SECRET` periodically.
- ♻️ **Backup Verification:** Restore offsite snapshots in a staging container every quarter to confirm zero data loss.
- 🔑 **Least Privilege:** Assign users the lowest role that lets them do their job.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "feat: add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

## 👨‍💻 Author & Maintainer

<a href="https://github.com/Adamnazeri">
  <img src="https://github.com/Adamnazeri.png?size=180" width="90" height="90" alt="Adam Nazeri" />
</a>

### **Adam Nazeri**
*Software Developer & System Integrator*

<a href="https://github.com/Adamnazeri"><img src="https://img.shields.io/badge/GitHub-@Adamnazeri-181717?style=for-the-badge&amp;logo=github" alt="GitHub" /></a>
<a href="https://github.com/Adamnazeri/campusos"><img src="https://img.shields.io/badge/Repository-CampusOS-2563eb?style=for-the-badge&amp;logo=git&amp;logoColor=white" alt="Repo" /></a>

<br /><br />

**⭐ If CampusOS helps your institution or inspires your workflow, give it a star! ⭐**

<!-- ANIMATED FOOTER -->
<img src="https://capsule-render.vercel.app/api?type=venom&amp;color=0:0f172a,50:1e3a8a,100:2563eb&amp;height=110&amp;section=footer" width="100%" alt="Footer Wave" />

</div>
