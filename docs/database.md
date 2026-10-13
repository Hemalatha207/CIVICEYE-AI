# CIVICEYE AI — Database Schema & Data Dictionary

CIVICEYE AI utilizes a relational schema implemented via SQLAlchemy 2.0 ORM with primary support for **MySQL 8.0** and automatic fallback to **SQLite** for standalone offline presentations.

## Primary Tables

### 1. `users`
- `id` (PK, Integer)
- `email` (Unique, VARCHAR 255)
- `hashed_password` (VARCHAR 255, bcrypt)
- `full_name` (VARCHAR 255)
- `phone_number` (VARCHAR 50)
- `is_active` (Boolean)
- `is_verified` (Boolean)
- `avatar_url` (VARCHAR 500)
- `created_at`, `updated_at` (Timestamps)

### 2. `roles` & `permissions`
- `roles`: `id`, `name` (CITIZEN, MANAGER, ADMIN), `description`
- `permissions`: `id`, `name` (e.g. `issue.verify`, `workorder.assign`), `description`
- `user_roles` & `role_permissions` join tables with cascading foreign keys.

### 3. `departments`
- `id` (PK, Integer)
- `name` (VARCHAR 100, Unique) — Road Maintenance, Water Supply, Sanitation, Electrical, Drainage
- `code` (VARCHAR 20, Unique) — ROAD, WATER, SANI, ELEC, DRAIN
- `head_name`, `contact_email`, `contact_phone`, `description`

### 4. `staff`
- `id` (PK, Integer)
- `employee_id` (Unique, VARCHAR 50, e.g. EMP-1001)
- `name`, `email`, `phone`, `designation`
- `department_id` (FK -> `departments.id`)
- `employment_status` (ACTIVE, ON_LEAVE, SUSPENDED, RESIGNED, TERMINATED, RETIRED, INACTIVE)
- `tasks_assigned`, `tasks_completed`, `tasks_pending`
- `avg_completion_hours` (Float), `attendance_rate` (Float), `citizen_rating` (Float)
- `joining_date`, `avatar_url`, `notes`

### 5. `issues`
- `id` (PK, Integer)
- `ticket_code` (Unique, VARCHAR 50, e.g. CV-1042)
- `citizen_id` (FK -> `users.id`)
- `category` (Reported category)
- `verified_category` (Manager-confirmed category)
- `description` (TEXT)
- `image_url` (VARCHAR 500)
- `latitude`, `longitude` (Float, GIS coordinates)
- `address`, `ward`, `city`
- `ai_classification`, `ai_confidence`, `ai_severity`
- `is_verified_by_manager` (Boolean), `verified_by_id` (FK -> `users.id`)
- `manager_notes` (TEXT)
- `priority` (LOW, MEDIUM, HIGH, CRITICAL)
- `department_id` (FK -> `departments.id`)
- `status` (REPORTED, AI_ANALYZED, PENDING_REVIEW, VERIFIED, ASSIGNED, IN_PROGRESS, COMPLETED, VERIFICATION, RESOLVED, CLOSED, REJECTED, DUPLICATE, REOPENED)
- `is_duplicate` (Boolean), `duplicate_of_id` (FK -> `issues.id`), `duplicate_count`
- `created_at`, `updated_at`, `resolved_at`

### 6. `work_orders`
- `id` (PK, Integer)
- `order_code` (Unique, VARCHAR 50, e.g. WO-4001)
- `issue_id` (FK -> `issues.id`)
- `department_id` (FK -> `departments.id`)
- `worker_id` (FK -> `staff.id`)
- `manager_id` (FK -> `users.id`)
- `priority`, `instructions`, `deadline`
- `status` (ASSIGNED, WORK_STARTED, WORK_COMPLETED, VERIFICATION, VERIFIED, REOPENED, CANCELLED)
- `started_at`, `completed_at`, `verified_at`

### 7. `work_evidence`
- `id` (PK, Integer)
- `issue_id` (FK -> `issues.id`), `work_order_id` (FK -> `work_orders.id`)
- `before_image_url`, `after_image_url`
- `description`, `uploaded_by_id`, `is_verified`, `verified_at`

### 8. `citizen_feedback`
- `id` (PK, Integer)
- `issue_id` (FK -> `issues.id`, Unique)
- `citizen_id` (FK -> `users.id`)
- `resolved_status` (YES, PARTIALLY, NO)
- `rating` (Integer 1-5)
- `comment` (TEXT), `feedback_image_url`

### 9. `audit_logs`
- `id` (PK, Integer)
- `user_id`, `user_email`, `action`, `entity`, `entity_id`
- `old_value` (JSON), `new_value` (JSON), `ip_address`, `timestamp`
