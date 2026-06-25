export interface Student {
  id: string;
  name: string;
  branch: string;
  year: string;
  phone: string;
  google_email: string;
  subjects: string[];
}

export interface Task {
  id: string;
  student_id: string;
  title: string;
  taskTitle: string;
  subject: string;
  deadline: string;
  reminder_time: string;
  add_to_calendar: boolean;
  automation_status: "pending" | "sent" | "failed";
  topics?: string[];
  schedule?: Record<string, string>;
}

export interface AutomationLog {
  id: string;
  task_id: string;
  workflow_name: string;
  status: "pending" | "sent" | "failed" | "delivered" | "success" | "error" | "skipped";
  triggered_at: string;
}

export interface RegistrationPayload {
  name: string;
  branch: string;
  year: string;
  subjects: string[];
  phone: string;
  google_email: string;
}

export interface TaskPayload {
  student_id: string;
  title: string;
  subject: string;
  deadline: string;
  reminder_time: string;
  add_to_calendar: boolean;
  demoMode: boolean;
}

export interface FlashcardsRequest {
  studentName: string;
  phone: string;
  subject: string;
  taskTitle: string;
  deadline: string;
  notes: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface MCQ {
  question: string;
  options: string[];
  answer: string;
}

export interface FlashcardsResponse {
  success: boolean;
  flashcards: Flashcard[];
  mcqs: MCQ[];
}

export interface ScheduleRequest {
  studentName: string;
  phone: string;
  subject: string;
  taskTitle: string;
  deadline: string;
  topics: string[];
  reminderOffsetHours?: number;
}

export interface ScheduleResponse {
  success: boolean;
  schedule: Record<string, string>;
  task?: Task;
}
