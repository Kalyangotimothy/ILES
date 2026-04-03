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
}

export type PlacementStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Placement {
  id: number;
  student: User;
  workplace_supervisor: User;
  academic_supervisor: User;
  organization: string;
  department?: string;
  position?: string;
  start_date: string;
  end_date: string;
  status: PlacementStatus;
  created_at: string;
  updated_at: string;
}

export type LogStatus = 'draft' | 'submitted' | 'returned' | 'reviewed' | 'approved';

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
}

export type ReviewDecision = 'approved' | 'returned';

export interface SupervisorReview {
  id: number;
  log: number;
  reviewer: User;
  decision: ReviewDecision;
  comments: string;
  rating?: number;
  reviewed_at: string;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface Evaluation {
  id: number;
  placement: Placement;
  evaluator: User;
  supervisor_score: number;
  academic_score: number;
  logbook_score: number;
  total_score: number;
  grade: Grade;
  comments?: string;
  is_locked: boolean;
  submitted_at: string;
}

export interface EvaluationCriteria {
  id: number;
  name: string;
  description?: string;
  max_score: number;
  weight_percent: number;
  is_active: boolean;
}
