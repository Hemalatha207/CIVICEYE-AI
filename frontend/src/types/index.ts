export interface UserRole {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  roles: UserRole[];
  created_at?: string;
}

export interface Issue {
  id: number;
  ticket_code: string;
  citizen_id?: number;
  category: string;
  verified_category?: string;
  description: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  address: string;
  ward?: string;
  ai_classification?: string;
  ai_confidence?: number;
  ai_severity?: string;
  ai_raw_data?: any;
  is_verified_by_manager: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  department_id?: number;
  department?: Department;
  status: 'REPORTED' | 'AI_ANALYZED' | 'PENDING_REVIEW' | 'VERIFIED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFICATION' | 'RESOLVED' | 'CLOSED' | 'REJECTED' | 'DUPLICATE' | 'REOPENED';
  is_duplicate: boolean;
  duplicate_count: number;
  manager_notes?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  status_history?: StatusHistoryItem[];
  ai_analyses?: AIAnalysisItem[];
  work_evidences?: WorkEvidenceItem[];
  possible_duplicates?: Issue[];
}

export interface StatusHistoryItem {
  id: number;
  from_status?: string;
  to_status: string;
  comment?: string;
  created_at: string;
}

export interface AIAnalysisItem {
  id: number;
  model_name: string;
  is_demo_mode: boolean;
  predicted_category: string;
  confidence: number;
  severity: string;
  detected_objects?: any;
  inference_time_ms: number;
  created_at: string;
}

export interface WorkEvidenceItem {
  id: number;
  before_image_url: string;
  after_image_url: string;
  description?: string;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  head_name?: string;
  contact_email?: string;
}

export interface Staff {
  id: number;
  employee_id: string;
  name: string;
  email?: string;
  phone?: string;
  department_id: number;
  department_name?: string;
  designation: string;
  employment_status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'RETIRED' | 'INACTIVE';
  joining_date: string;
  tasks_assigned: number;
  tasks_completed: number;
  tasks_pending: number;
  avg_completion_hours: number;
  attendance_rate: number;
  citizen_rating: number;
  avatar_url?: string;
  notes?: string;
  created_at: string;
}

export interface WorkOrder {
  id: number;
  order_code: string;
  issue_id: number;
  department_id: number;
  worker_id: number;
  manager_id?: number;
  priority: string;
  instructions: string;
  deadline?: string;
  status: 'ASSIGNED' | 'WORK_STARTED' | 'WORK_COMPLETED' | 'VERIFICATION' | 'VERIFIED' | 'REOPENED' | 'CANCELLED';
  started_at?: string;
  completed_at?: string;
  verified_at?: string;
  manager_notes?: string;
  created_at: string;
  worker_name?: string;
  department_name?: string;
  issue_ticket?: string;
  issue_category?: string;
  issue?: Issue;
}

export interface CitizenFeedback {
  id: number;
  issue_id: number;
  ticket_code?: string;
  citizen_name?: string;
  resolved_status: 'YES' | 'PARTIALLY' | 'NO';
  rating: number;
  comment?: string;
  feedback_image_url?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AnalyticsData {
  kpis: {
    total_issues: number;
    pending: number;
    in_progress: number;
    resolved: number;
    high_priority: number;
    reopened: number;
    resolution_rate_percent: number;
  };
  categories: { category: string; count: number; resolved: number }[];
  trends: { date: string; reported: number; resolved: number }[];
  priorities: { priority: string; count: number }[];
  departments: { department: string; assigned: number; completed: number; pending: number }[];
  satisfaction: {
    average_rating: number;
    total_reviews: number;
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  timestamp: string;
}

export interface ResignationItem {
  id: number;
  staff_id: number;
  staff_name?: string;
  request_date: string;
  requested_last_date: string;
  reason: string;
  comments?: string;
  status: string;
  reviewed_by?: number;
  review_comments?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AdminActionItem {
  id: number;
  staff_id: number;
  staff_name?: string;
  action_type: string;
  reason: string;
  evidence_url?: string;
  is_approved: boolean;
  final_status: string;
  timestamp: string;
}
