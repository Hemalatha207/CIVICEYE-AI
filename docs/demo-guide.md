# CIVICEYE AI — Science Expo Live Demonstration Guide

Follow this step-by-step showcase during the Science Expo presentation to impress judges with a complete, end-to-end civic cycle.

---

## Pre-Demo Checklist
1. Backend is running on port `8001` (or `8000`).
2. Frontend is running on port `5173` via Vite.
3. Database is loaded with the standard Expo dataset of **248 civic issues**.
   - If needed at any point, click the **"Reset Demo Data"** button in the top navigation bar to reset to a pristine state in 2 seconds.

---

## Step-by-Step Expo Walkthrough

### Part 1: Citizen Reports Problem
1. Open `http://localhost:5173/login`.
2. Click the quick button **"Citizen"** (auto-fills `citizen@civiceye.local` / `password123`) and click **Sign In**.
3. You will land on the **Citizen Dashboard** with 4 KPI cards and a prominent coral button: `+ REPORT AN ISSUE`.
4. Click `+ REPORT AN ISSUE` to launch the 5-step reporting wizard:
   - **Step 1 (Category):** Click **Pothole** (`🕳️`).
   - **Step 2 (Photo):** Click **Next** (or upload your own photo). Notice the live computer vision processing banner.
   - **Step 3 (Location):** Confirm coordinate coordinates and select **Ward 4 Civic Center**.
   - **Step 4 (Details):** Type *"Hazardous road depression near Ward 4 bus stop"*.
   - **Step 5 (AI Review):** Show the judges the dedicated **AI DETECTION CARD**:
     - Model: `YOLOv8-CivicVision-v2.1`
     - Category: `Pothole`
     - Confidence: `94%`
     - Severity: `HIGH`
   - Click **Submit Civic Issue Report**.
   - Confetti triggers! A ticket code (e.g. `CV-1042` or `CV-1249`) is issued!

---

### Part 2: Manager Triages & Dispatches Crew
1. In the top navbar, use the quick switcher: click **"Manager"** to instantaneously switch personas!
2. You will land on the **Manager Dashboard (Primary Expo Screen)**:
   - Total Issues: `248`
   - Pending: `61`
   - In Progress: `32`
   - Resolved: `155`
   - High Priority: `23`
   - Show judges the 7-day trend chart, priority donut, and **Metropolitan Smart City GIS Map** with interactive coral, teal, and amber markers.
3. Click **"Triage Civic Issues"** in the top right to open the issues directory.
4. Open the newly reported Pothole ticket.
5. In the two-column triage workspace:
   - Show the large image, AI detection confidence, and GIS location preview.
   - Click **"Verify Issue"** -> Set Priority to **HIGH**, Department to **Road Maintenance**, and click Confirm.
   - Click **"Dispatch Work Order"** -> Select **Kumar Thorne** (Senior Paving Specialist), confirm instructions *"Repair pothole near Ward 4 bus stop with asphalt compaction"*, and click **Create Work Order**.

---

### Part 3: Crew Executes & Manager Verifies
1. Navigate to **Work Orders** in the sidebar.
2. Find the newly created work order:
   - Click **Start Work** -> status changes to `WORK_STARTED`.
   - Click **Mark Completed** -> status changes to `WORK_COMPLETED`.
   - Click **Upload Evidence & Verify**:
     - Shows side-by-side **BEFORE** and **AFTER** visual evidence photos.
     - Click **Verify Completion & Close Issue**.
   - Work order is marked `VERIFIED`, and the underlying ticket is resolved!

---

### Part 4: Citizen Evaluates & Closes Cycle
1. Switch persona back to **"Citizen"** using the top navigation switcher.
2. In the navbar bell icon, show the notification: *"Issue Resolved! Please Rate Our Service"*.
3. Click into the ticket:
   - The status timeline shows 5 green checkmarks.
   - The **Before & After Work Evidence** is displayed side-by-side with a verified badge.
   - Under satisfaction evaluation, select **YES (Resolved)**, click the **5-Star Rating**, type *"Fast response and smooth asphalt paving!"*, and click **Submit Satisfaction Rating**.

---

### Part 5: Executive Analytics & Audit Trail
1. Switch back to **"Manager"**.
2. Click **Analytics** in the sidebar:
   - Point out how the 5-star rating dynamically updated the satisfaction distribution and resolution rates!
3. Click **Audit Logs** in the sidebar:
   - Demonstrate the complete immutable audit trail of logins, issue creation, priority changes, worker assignments, and manager evidence verifications.
4. Click **Reports Export** -> Click **Export CSV** to show instant data export for municipal leadership.
