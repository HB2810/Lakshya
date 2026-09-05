# STAVYA ONE (LAKSHYA) — Production Deployment & Staff Launch Guide

This guide provides complete instructions for launching, deploying, and distributing **Stavya One** to hospital staff at Stavya Spine Hospital.

---

## 1. Quick Architecture Overview

Stavya One operates on a dual-lane architecture:
1. **Hospital Workspace (Hospital-Governed):**
   - Strategic priorities, milestones, meetings, commitments, execution queues, and RACI governance.
   - Managed via FastAPI backend (`apps/api`) and PostgreSQL.
2. **Personal Vault (Employee-Owned & Device-Local):**
   - Ask One AI companion, Health Journal (sleep, steps, hydration), Money Clarity, Life Rhythm.
   - Zero-cloud storage: Stored directly in employee device local storage for 100% privacy.

---

## 2. Launch Options

### Option A: Local Run on Mac / Developer Machine (Zero Docker Needed)

If you want to run Stavya One directly on your machine and share your local IP with staff on the same Wi-Fi network:

#### Step 1: Start Backend (`apps/api`)
```bash
cd apps/api
# The backend automatically uses an in-memory SQLite bootstrap if local PostgreSQL is not running!
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Step 2: Start Frontend (`apps/web`)
In a separate terminal window:
```bash
cd apps/web
npm install
npm run dev
```
- Open browser at `http://localhost:3001`
- To share on hospital local network: `http://<YOUR_MAC_IP>:3001`

---

### Option B: One-Command Docker Compose (Hospital Server / Intranet)

This is the recommended deployment for Stavya Spine Hospital's local server or intranet VM.

#### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/HB2810/Lakshya.git
cd Lakshya
cp .env.example .env
```

#### Step 2: Launch the Entire Stack
```bash
docker compose up -d --build
```

This single command automatically:
1. Spins up a secured **PostgreSQL 16** database container with health checks.
2. Applies all 8 **Alembic database migrations** (`0001` to `0008`).
3. Seeds default administrative and leadership accounts.
4. Starts the **FastAPI backend** on port `8000`.
5. Starts the **Next.js production web server** on port `3001`.

#### Step 3: Verify Status
```bash
docker compose ps
docker compose logs -f api
```

Visit `http://<SERVER_IP>:3001` in any browser on the hospital network.

---

### Option C: Production Deployment on Cloud VPS (DigitalOcean, AWS, GCP)

For a publicly accessible cloud deployment protected by SSL / HTTPS:

1. **Provision a Linux VPS** (Ubuntu 22.04 LTS or 24.04 LTS with 2+ vCPU, 4GB RAM).
2. **Install Docker & Docker Compose Plugin**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. **Configure Domain & Nginx Reverse Proxy**:
   Point your domain (e.g. `one.stavyaspine.com`) to the server IP and configure SSL using Certbot / Let's Encrypt:
   ```nginx
   server {
       server_name one.stavyaspine.com;

       location / {
           proxy_pass http://127.0.0.1:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
4. **Update `.env` on VPS**:
   ```bash
   LAKSHYA_ENVIRONMENT=production
   LAKSHYA_SESSION_COOKIE_SECURE=true
   LAKSHYA_CORS_ALLOWED_ORIGINS=https://one.stavyaspine.com
   LAKSHYA_TRUSTED_ORIGINS=https://one.stavyaspine.com
   NEXT_PUBLIC_API_URL=https://one.stavyaspine.com
   ```
5. **Start Services**:
   ```bash
   docker compose up -d
   ```

---

## 3. Staff Accounts & Login Credentials

Stavya One comes pre-loaded with the complete **214-member Stavya Spine Hospital staff database**.

### Default Password
All pre-registered staff accounts have the initial default password:
```text
Stavya@2026
```
*(Staff will be prompted to customize their password after initial access, or can use instant PIN access)*.

### Key Governance & Role Tiers

| Tier | Key Personnel | Role / Persona | Primary Scope & Access |
| :--- | :--- | :--- | :--- |
| **Governance** | Dr. Mirant Bharat Dave | `MANAGING_DIRECTOR` | Executive Cockpit, Strategic Milestones, Org Privileges, MD Attention items |
| **Governance** | Dr. Bharat Rajendraprasad Dave | `MASTER` | System Security, Full Hospital Governance |
| **Governance** | Dr. Akruti Mirant Dave | `DIRECTOR_QUALITY` | NABH 6th Edition Command Centre, Quality Audits, RCA/FMEA |
| **Governance** | Het Bhatt | `MD_OFFICE` | Strategic Follow-up, Meeting Decisions, Executive Actions |
| **Leaders** | Department Heads, Medical Supdt., Nurse Supdt. | `LEADER` | Department Workload, Team Org Tree, Task Assignment, Blocker Resolution |
| **Incharges** | OT Incharge, ICU Incharge, OPD Incharge | `LEADER` / `INCHARGE` | Daily Shift Operations, Handover Checklists, Milestone Steps |
| **Employees** | Clinical Nurses, Technicians, Ward Staff | `STAVYAN` | "My Day" Queue, Personal Wellbeing Vault, Habit & Rhythm Tracker |

### Fast Onboarding via Login Directory Selector
On the login screen (`/login`):
1. Staff can click **"Browse Staff Directory (214 Members)"**.
2. Search by **Name**, **Department**, or **Employee Code** (e.g. `STAVYA-001`, `STAVYA-048`, `STAVYA-071`).
3. Click on their card to automatically autofill their credentials and log straight into their tailored persona view.

---

## 4. Maintenance & Operations

### Database Backup
```bash
docker compose exec db pg_dump -U lakshya lakshya_prod > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
cat backup_YYYYMMDD.sql | docker compose exec -T db psql -U lakshya lakshya_prod
```

### Re-seeding Default Accounts
```bash
docker compose exec api python -m app.scripts.seed_v1_demo_users
```

### Checking Application Logs
```bash
docker compose logs -f api   # Backend logs
docker compose logs -f web   # Frontend logs
docker compose logs -f db    # Database logs
```
