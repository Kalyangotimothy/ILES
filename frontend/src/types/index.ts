export type UserRole = 'student' | 'workplace_supervisor' | 'academic_supervisor' | 'admin';

export interface User {
  id: number;
  student_number: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  organization?: string;
  is_active: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  student_number: string;
  password: string;
}

export interface RegisterCredentials {
  student_number: string;
  full_name: string;
  email: string;
  password: string;
  password_confirm: string;
  role?: UserRole;
  organization?: string;
}

export type PlacementStatus = 'pending' | 'active' | 'completed' | 'cancelled';

// Document types for placements
export type PlacementDocumentType = 'placement_letter' | 'student_id' | 'agreement' | 'insurance' | 'other';

export interface PlacementDocument {
  id: number;
  placement: number;
  document_type: PlacementDocumentType;
  document_type_display: string;
  file_url: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  description?: string;
  uploaded_at: string;
  uploaded_by: number;
  uploaded_by_name: string;
}

export interface PlacementDocumentCreate {
  placement: number;
  document_type: PlacementDocumentType;
  file: File;
  description?: string;
}

export interface Placement {
  id: number;
  student: number;
  student_name: string;
  workplace_supervisor: number | null;
  workplace_supervisor_name: string;
  academic_supervisor: number | null;
  academic_supervisor_name: string;
  organization: string;
  department?: string;
  position?: string;
  start_date: string;
  end_date: string;
  status: PlacementStatus;
  created_at: string;
  updated_at: string;
  documents?: PlacementDocument[];
  documents_count?: number;
}

export interface PlacementCreate {
  organization: string;
  department?: string;
  position?: string;
  start_date: string;
  end_date: string;
}

export type LogStatus = 'draft' | 'submitted' | 'returned' | 'reviewed' | 'approved';

// Log attachment types
export interface LogAttachment {
  id: number;
  log: number;
  file_url: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  caption?: string;
  uploaded_at: string;
}

export interface LogAttachmentCreate {
  log: number;
  file: File;
  caption?: string;
}

// Log template types
export interface LogTemplate {
  id: number;
  name: string;
  description?: string;
  activities_prompts: string[];
  challenges_prompts: string[];
  skills_prompts: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

// File upload progress tracking
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export interface WeeklyLog {
  id: number;
  placement: number;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  activities: string;
  challenges?: string;
  skills_learned?: string;
  hours_worked: number;
  status: LogStatus;
  submitted_at?: string;
  is_late: boolean;
  created_at: string;
  updated_at: string;
  student_name?: string;
  organization?: string;
  attachments?: LogAttachment[];
  attachments_count?: number;
}

export interface WeeklyLogCreate {
  placement: number;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  activities: string;
  challenges?: string;
  skills_learned?: string;
  hours_worked: number;
}

export type ReviewDecision = 'approved' | 'returned';
export type ReviewerType = 'workplace' | 'academic';

export interface SupervisorReview {
  id: number;
  log: number;
  reviewer: number;
  reviewer_name: string;
  reviewer_type: ReviewerType;
  reviewer_type_display: string;
  decision: ReviewDecision;
  comments: string;
  rating?: number;
  reviewed_at: string;
  log_week_number: number;
  student_name: string;
}

export interface PendingLogForReview {
  id: number;
  placement: number;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  activities: string;
  challenges?: string;
  skills_learned?: string;
  hours_worked: number;
  status: LogStatus;
  submitted_at?: string;
  is_late: boolean;
  student_name: string;
  student_number: string;
  organization: string;
  reviews_count: number;
  workplace_reviewed: boolean;
  academic_reviewed: boolean;
  reviews: SupervisorReview[];
}

export interface ReviewStats {
  pending_reviews: number;
  total_reviews: number;
  approved_count: number;
  returned_count: number;
  assigned_students: number;
}

export interface ReviewCreate {
  log: number;
  decision: ReviewDecision;
  comments: string;
  rating?: number;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface EvaluationCriteria {
  id: number;
  name: string;
  description?: string;
  max_score: number;
  weight_percent: number;
  is_active: boolean;
  created_at?: string;
}

export interface EvaluationScore {
  id: number;
  criteria: number;
  criteria_name: string;
  criteria_max_score: number;
  criteria_weight: number;
  score_awarded: number;
}

export interface Evaluation {
  id: number;
  placement: number;
  evaluator: number;
  evaluator_name: string;
  student_name: string;
  student_number: string;
  organization: string;
  supervisor_score: number;
  academic_score: number;
  logbook_score: number;
  total_score: number;
  grade: Grade;
  grade_display: string;
  comments?: string;
  is_locked: boolean;
  submitted_at: string;
  updated_at: string;
  criterion_scores: EvaluationScore[];
}

export interface EvaluationCreate {
  placement: number;
  supervisor_score: number;
  academic_score: number;
  logbook_score: number;
  comments?: string;
}

export interface PlacementForEvaluation {
  id: number;
  student_name: string;
  student_number: string;
  organization: string;
  department?: string;
  position?: string;
  start_date: string;
  end_date: string;
  status: PlacementStatus;
  workplace_supervisor_name: string;
  logs_count: number;
  approved_logs_count: number;
  average_supervisor_rating?: number;
}

export interface EvaluationStats {
  pending_evaluations: number;
  completed_evaluations: number;
  average_score?: number;
  grade_distribution: Record<Grade, number>;
}
