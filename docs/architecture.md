# CIVICEYE AI — System Architecture

## 1. Architectural Philosophy
CIVICEYE AI is engineered as a **Modular Monolith** designed for high throughput, maintainability, and clean separation of concerns without the distributed failure modes of premature microservices.

```
                    CIVICEYE AI 
                         | 
        +----------------+----------------+ 
        |                |                | 
     CITIZEN          MANAGER           ADMIN 
      PORTAL           PORTAL           PORTAL 
        |                |                | 
        +----------------+----------------+ 
                         | 
                    API LAYER 
                         | 
                   FASTAPI 
                         | 
        +----------------+----------------+ 
        |                |                | 
   AUTHENTICATION   AUTHORIZATION     AUDIT LOG 
        |                |                | 
        +----------------+----------------+ 
                         | 
        +--------------------------------+ 
        |         CORE MODULES           | 
        +--------------------------------+ 
        | Issue Management               | 
        | AI Analysis Service            | 
        | Location / GIS Engine          | 
        | Priority & SLA Engine          | 
        | Department & Staff Management  | 
        | Work Orders & Evidence         | 
        | Citizen Feedback & Reopenings  | 
        | Real-Time Notifications        | 
        | Smart City Analytics           | 
        | Audit Trail Logging            | 
        +--------------------------------+ 
                         | 
                    SQLAlchemy 2.0 
                         | 
                 MySQL / SQLite
```

## 2. Frontend Layer (Single Page Application)
- **Framework:** React 19 + TypeScript + Vite
- **Styling & Design System:** Tailwind CSS v4 with custom Brand Tokens (Coral `#FF6B6B`, Teal `#14B8A6`, Neutral Surfaces `#F8FAFC`)
- **Routing:** React Router v7 with RBAC navigation guards
- **State & Context:** React Context with JWT persistence and 1-click Expo role switcher
- **Visualizations:** Recharts for metrics and Leaflet + OpenStreetMap for spatial GIS
- **Animations:** Framer Motion for micro-interactions and modal transitions

## 3. API & Business Logic Layer
- **FastAPI:** Asynchronous REST endpoints with Pydantic v2 data validation
- **Authentication:** OAuth2 password flow with standard JWT access & refresh tokens and bcrypt password hashing
- **Authorization:** Granular RBAC enforcing roles (`CITIZEN`, `MANAGER`, `ADMIN`) at the API route dependency layer
- **Audit System:** Automatic event recording for logins, reports, triages, dispatches, and administrative decisions

## 4. AI & Computer Vision Service
- **Engine:** Ultralytics YOLOv8 + OpenCV headless image feature extractor
- **Detection Classes:** Pothole, Road Damage, Garbage, Streetlight Damage, Water Leakage, Drainage Issue, Fallen Tree
- **Fail-Safe Fallback:** Clearly marked `DEMO MODE` fallback ensuring uninterrupted Expo demonstration without requiring 500MB model weights on fresh judge laptops
