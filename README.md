# CIVICEYE AI — Intelligent Civic Issue Management Platform
> *"See the Problem. Understand It. Fix It."*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?style=flat&logo=mysql)](https://www.mysql.com)
[![YOLOv8](https://img.shields.io/badge/YOLO-v8_Computer_Vision-FF6B6B.svg?style=flat)](https://ultralytics.com)

---

## 1. Project Overview
**CIVICEYE AI** is a state-of-the-art smart city civic issue management platform. It modernizes the interaction between citizens, municipal managers, and field maintenance crews by augmenting urban issue reporting with high-precision computer vision, role-based workforce dispatch, Before & After evidence verification, and real-time public transparency.

---

## 2. Problem Statement & Objectives
- **The Problem:** Traditional civic complaint portals are slow, bureaucratic, lack automated triage, suffer from duplicate reports, and fail to provide citizens with verifiable proof of repair.
- **The Solution:** CIVICEYE AI provides an intelligent end-to-end command center:
  1. Citizens capture problems (potholes, garbage, broken streetlights, water main leaks, drainage clogs) with photographic and GIS geolocation evidence.
  2. The system executes immediate computer vision inference (YOLOv8 / OpenCV feature detection) predicting category, confidence percentage, and damage severity.
  3. City Operations Managers review AI findings, verify category and priority, dispatch work orders to specialized field workers with clear instructions, and track repair SLAs.
  4. Managers upload side-by-side **Before & After visual evidence** before closing tickets.
  5. Citizens verify repair quality, leave 1-5 star ratings, or reopen unsatisfactory jobs.
  6. All actions are logged into an immutable security audit trail.

---

## 3. Technology Stack

### Frontend
- **React 19 & TypeScript:** Strict type-safety and modular component architecture.
- **Vite:** Next-generation sub-second bundling.
- **Tailwind CSS v4:** Modern Command Center aesthetic.
- **Framer Motion:** Micro-interactions, transitions, and status progress animations.
- **Recharts:** Interactive trend areas, priority donuts, category bar charts.
- **Leaflet & OpenStreetMap:** Real-time GIS interactive mapping with custom colored issue markers.
- **Axios:** JWT token injection and unified REST client.

### Backend
- **Python 3.12 & FastAPI:** High-performance asynchronous REST API framework.
- **SQLAlchemy 2.0:** Modern ORM with cascading relationships and connection pooling.
- **Pydantic v2:** Request and response schema validation.
- **PyMySQL:** Direct MySQL 8.0 connectivity with automated SQLite fallback.
- **JWT & Bcrypt:** Secure password hashing and access/refresh token architecture.

### AI & Computer Vision
- **Ultralytics YOLOv8 & OpenCV:** Object and texture classification.
- **Graceful Fallback:** Rule-based fallback mode to guarantee uptime when model weights are unavailable.

---

## 4. Brand Design System

| Element | Hex Code | Visual Application |
|---|---|---|
| **Primary Teal** | `#14B8A6` | Brand actions, primary CTAs, resolved status badges |
| **Dark Teal** | `#0F766E` | Brand gradient headers, active nav states |
| **Primary Coral** | `#FF6B6B` | High-priority warnings, urgent alerts, attention cues |
| **Dark Coral** | `#E85D5D` | Hover states for urgent actions |
| **Surface** | `#FFFFFF` | Elevated cards and data tables |
| **Background** | `#F8FAFC` | Command center backdrop |
| **Typography** | `Inter`, `sans-serif` | Clean, high-legibility municipal command hierarchy |

---

## 5. System Roles

| Role | Responsibilities |
|---|---|
| **ADMIN** | Global system administration, audit log oversight, user management, security policy |
| **MANAGER** | Issue triage, AI verification, priority assignment, staff work orders, evidence verification |
| **CITIZEN** | Issue submission, live ticket tracking, Before/After review, satisfaction ratings |

---

## 6. Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- MySQL 8.0 (optional — will automatically fall back to SQLite)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-repo/civiceye-ai.git
cd civiceye-ai
```

### Step 2: Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your actual database credentials and secrets
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
*Backend Swagger Docs: `http://127.0.0.1:8001/docs`*

### Step 3: Production Database Initialization
On first run, the backend auto-initializes roles, departments, and the administrator account from `.env` settings.

To manually re-initialize a clean production database:
```bash
cd backend
python -m app.init_production
```

### Step 4: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend Application: `http://localhost:5173`*

---

## 7. Environment Configuration

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description |
|---|---|
| `SECRET_KEY` | Strong random JWT signing secret (min 32 chars) |
| `DATABASE_URL` | MySQL connection string |
| `INITIAL_ADMIN_EMAIL` | Email for the first administrator account |
| `INITIAL_ADMIN_PASSWORD` | Initial admin password (change after first login) |
| `INITIAL_ADMIN_NAME` | Display name for the administrator |

---

## 8. Automated Testing
Run the backend test suite:
```bash
cd backend
python -m pytest tests/test_civiceye.py -v
```

---

## 9. Future Scope
Hardware components (IoT sensors, drones, CCTV feeds) are documented for Phase 2 implementation, along with a blueprint for creating technology-enabled municipal careers.
