import axios from "axios";
import { 
  Student, 
  Task, 
  AutomationLog, 
  RegistrationPayload, 
  TaskPayload,
  FlashcardsRequest,
  FlashcardsResponse,
  ScheduleRequest,
  ScheduleResponse
} from "../types";

const getApiBaseUrl = (): string => {
  let base = "";
  if (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_BASE_URL) {
    base = process.env.NEXT_PUBLIC_API_BASE_URL;
  } else {
    base = (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL || "";
  }
  if (base) {
    return base.endsWith("/api") ? base : `${base}/api`;
  }
  return "/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      throw new Error(response.data.error || "AI request failed");
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.data) {
      const backendError = error.response.data.error || error.response.data.message;
      if (backendError) {
        return Promise.reject(new Error(backendError));
      }
    }
    return Promise.reject(error);
  }
);

export const registerStudent = async (payload: RegistrationPayload): Promise<Student> => {
  const response = await api.post<{ success: boolean; student: Student }>("/register", payload);
  return response.data.student;
};

export const loginStudent = async (googleEmail: string): Promise<Student> => {
  const response = await api.post<{ success: boolean; student: Student }>("/login", { google_email: googleEmail });
  return response.data.student;
};

export const getTasks = async (studentId: string): Promise<Task[]> => {
  const response = await api.get<Task[]>(`/tasks?student_id=${studentId}`);
  return response.data;
};

export const createTask = async (payload: TaskPayload): Promise<Task> => {
  const response = await api.post<Task>("/tasks", payload);
  return response.data;
};

export const updateTask = async (id: string, payload: Partial<TaskPayload>): Promise<Task> => {
  const response = await api.put<Task>(`/tasks/${id}`, payload);
  return response.data;
};

export const deleteTask = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/tasks/${id}`);
  return response.data;
};

export const retryAutomation = async (taskId: string, demoMode: boolean): Promise<{ success: boolean; task: Task }> => {
  const response = await api.post<{ success: boolean; task: Task }>(`/automations/${taskId}/retry`, { demoMode });
  return response.data;
};

export const getAutomations = async (): Promise<AutomationLog[]> => {
  const response = await api.get<AutomationLog[]>("/automations");
  return response.data;
};

export const generateFlashcards = async (payload: FlashcardsRequest): Promise<FlashcardsResponse> => {
  const response = await api.post<FlashcardsResponse>("/ai/flashcards", payload);
  return response.data;
};

export const generateSchedule = async (payload: ScheduleRequest): Promise<ScheduleResponse> => {
  const response = await api.post<ScheduleResponse>("/ai/schedule", payload);
  return response.data;
};

export const summarizeNotice = async (noticeText: string): Promise<string[]> => {
  const response = await api.post<{ success: boolean; summary: string[] }>("/ai/summarize", { noticeText });
  return response.data.summary;
};

export const broadcastNotice = async (summary: string[], audience: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>("/notices/broadcast", { summary, audience });
  return response.data;
};

export const getAITip = async (studentId: string): Promise<string> => {
  const response = await api.get<{ tip: string }>(`/ai/tip?student_id=${studentId}`);
  return response.data.tip;
};

// ==========================================
// STABLE INTEGRATION LAYER V1.3
// ==========================================

export interface IntegrationStatus {
  timestamp: string;
  services: {
    supabase: { configured: boolean; url: string | null };
    n8n: { configured: boolean; webhook: string | null };
    grok: { configured: boolean; api_key_status: string };
    gemini: { configured: boolean; model: string };
  };
}

export const getIntegrationStatus = async (): Promise<IntegrationStatus> => {
  const response = await api.get<IntegrationStatus>("/v1/status");
  return response.data;
};

export const syncToSupabase = async (type: "student" | "task", payload: any): Promise<any> => {
  const response = await api.post("/v1/supabase/sync", { type, payload });
  return response.data;
};

export const triggerN8NWorkflow = async (event: string, task: Task, student?: Student): Promise<any> => {
  const response = await api.post("/v1/n8n/trigger", { event, task, student });
  return response.data;
};

export const getGrokInsights = async (studentData: any, performanceLogs?: any): Promise<any> => {
  const response = await api.post("/v1/grok/insights", { studentData, performanceLogs });
  return response.data;
};
