import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, updateTask, deleteTask, retryAutomation, generateSchedule } from "../lib/api";
import { Student, Task } from "../types";
import { 
  Plus, Calendar, Clock, Trash2, Edit3, CheckCircle, AlertTriangle, 
  Smartphone, ToggleLeft, ToggleRight, Sparkles, RefreshCw, Undo, Save, BookOpen 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TaskManagerProps {
  student: Student;
  globalDemoMode: boolean;
  setGlobalDemoMode: (val: boolean) => void;
}

export default function TaskManager({ student, globalDemoMode, setGlobalDemoMode }: TaskManagerProps) {
  const queryClient = useQueryClient();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(student.subjects[0] || "");
  const [customSubject, setCustomSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [reminderTime, setReminderTime] = useState("1 hour before");
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [generateSchedule, setGenerateSchedule] = useState(false);
  const [topicsText, setTopicsText] = useState("");

  // Load active task list
  const tasksQuery = useQuery<Task[]>({
    queryKey: ["tasks", student.id],
    queryFn: () => getTasks(student.id),
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. CREATE MUTATION WITH OPTIMISTIC UPDATE & ROLLBACK
  const createMutation = useMutation<Task, Error, any>({
    mutationFn: createTask,
    onMutate: async (newTaskPayload) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks", student.id] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", student.id]) || [];

      // Create a temporary optimistic task object
      const optimisticTask: Task = {
        id: `optimistic-${Date.now()}`,
        student_id: student.id,
        title: newTaskPayload.title,
        taskTitle: newTaskPayload.title,
        subject: newTaskPayload.subject,
        deadline: newTaskPayload.deadline,
        reminder_time: newTaskPayload.reminder_time,
        add_to_calendar: newTaskPayload.add_to_calendar,
        automation_status: "pending", // always starts pending
      };

      // Optimistically update the cache
      queryClient.setQueryData<Task[]>(
        ["tasks", student.id],
        [optimisticTask, ...previousTasks]
      );

      // Return context containing previous tasks for rollback
      return { previousTasks };
    },
    onError: (err, newTodo, context: any) => {
      // Rollback to previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", student.id], context.previousTasks);
      }
      showToast("error", `Failed to create task optimistically. Reverted view! Reason: ${err.message}`);
    },
    onSuccess: (data) => {
      showToast("success", `Task "${data.title}" queued successfully! n8n pipeline triggered.`);
    },
    onSettled: () => {
      // Refetch after success/error to synchronize state
      queryClient.invalidateQueries({ queryKey: ["tasks", student.id] });
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  // 2. UPDATE MUTATION WITH OPTIMISTIC UPDATE & ROLLBACK
  const updateMutation = useMutation<Task, Error, { id: string; payload: any }>({
    mutationFn: ({ id, payload }) => updateTask(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", student.id] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", student.id]) || [];

      // Optimistically map over cache
      queryClient.setQueryData<Task[]>(
        ["tasks", student.id],
        previousTasks.map((task) =>
          task.id === id ? { ...task, ...payload, automation_status: "pending" } : task
        )
      );

      return { previousTasks };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", student.id], context.previousTasks);
      }
      showToast("error", `Failed to update task. Reverted view! Reason: ${err.message}`);
    },
    onSuccess: (data) => {
      showToast("success", `Task "${data.title}" updated and re-queued in n8n.`);
      setEditingTask(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", student.id] });
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  // 3. DELETE MUTATION WITH OPTIMISTIC UPDATE & ROLLBACK
  const deleteMutation = useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", student.id] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", student.id]) || [];

      // Optimistically remove from cache
      queryClient.setQueryData<Task[]>(
        ["tasks", student.id],
        previousTasks.filter((task) => task.id !== id)
      );

      return { previousTasks };
    },
    onError: (err, id, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", student.id], context.previousTasks);
      }
      showToast("error", `Failed to delete task. Reverted view! Reason: ${err.message}`);
    },
    onSuccess: () => {
      showToast("success", "Task deleted successfully.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", student.id] });
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  // 4. RETRY AUTOMATION MUTATION
  const retryMutationFn = useMutation<{ success: boolean; task: Task }, Error, string>({
    mutationFn: (taskId) => retryAutomation(taskId, globalDemoMode),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", student.id] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", student.id]) || [];

      // Optimistically set status to pending
      queryClient.setQueryData<Task[]>(
        ["tasks", student.id],
        previousTasks.map((t) => (t.id === taskId ? { ...t, automation_status: "pending" } : t))
      );

      return { previousTasks };
    },
    onError: (err, taskId, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", student.id], context.previousTasks);
      }
      showToast("error", `Retry request failed: ${err.message}`);
    },
    onSuccess: (data) => {
      showToast("success", `Automation retry triggered for "${data.task.title}".`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", student.id] });
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  // 5. AI SCHEDULE GENERATION MUTATION
  const scheduleMutation = useMutation<any, Error, any>({
    mutationFn: generateSchedule,
    onSuccess: (data) => {
      showToast("success", `AI study schedule generated for "${data.task?.title || title}"!`);
      // Reset fields
      setTitle("");
      setSubject(student.subjects[0] || "");
      setCustomSubject("");
      setDeadline("");
      setReminderTime("1 hour before");
      setAddToCalendar(true);
      setGenerateSchedule(false);
      setTopicsText("");
    },
    onError: (err) => {
      showToast("error", `Failed to generate AI schedule: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", student.id] });
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });

  // Handle Form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      showToast("error", "Task title and due deadline are required!");
      return;
    }

    const selectedSubject = subject === "Other" ? customSubject : subject;
    if (!selectedSubject.trim()) {
      showToast("error", "Please specify a subject!");
      return;
    }

    const isoDeadline = new Date(deadline).toISOString();

    // Strict validation for AI schedule generation
    if (!editingTask && generateSchedule) {
      if (!student.name) {
        showToast("error", "studentName is required");
        return;
      }
      if (!student.phone) {
        showToast("error", "phone is required");
        return;
      }
      if (!selectedSubject.trim()) {
        showToast("error", "subject is required");
        return;
      }
      if (!title.trim()) {
        showToast("error", "taskTitle is required");
        return;
      }
      if (!deadline.trim()) {
        showToast("error", "deadline is required");
        return;
      }

      const topics = topicsText.split(",")
        .map(t => t.trim())
        .filter(Boolean);

      if (topics.length === 0) {
        showToast("error", "topics must be a non-empty array");
        return;
      }

      const getReminderOffsetHours = (val: string): number => {
        switch (val) {
          case "1 hour before":
            return 1;
          case "2 hours before":
            return 2;
          case "1 day before":
            return 24;
          case "5 minutes before":
          default:
            return 1;
        }
      };

      scheduleMutation.mutate({
        studentName: student.name || "",
        phone: student.phone || "",
        subject: selectedSubject.trim(),
        taskTitle: title.trim(),
        deadline: isoDeadline,
        topics,
        reminderOffsetHours: getReminderOffsetHours(reminderTime)
      });
      return;
    }

    const payload = {
      student_id: student.id,
      title: title.trim(),
      taskTitle: title.trim(),
      subject: selectedSubject.trim(),
      deadline: isoDeadline,
      reminder_time: reminderTime,
      add_to_calendar: addToCalendar,
      demoMode: globalDemoMode,
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, payload });
    } else {
      createMutation.mutate(payload);
    }

    // Reset fields
    setTitle("");
    setSubject(student.subjects[0] || "");
    setCustomSubject("");
    setDeadline("");
    setReminderTime("1 hour before");
    setAddToCalendar(true);
    setGenerateSchedule(false);
    setTopicsText("");
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    
    // Check if task subject is in student's subject list
    if (student.subjects.includes(task.subject)) {
      setSubject(task.subject);
    } else {
      setSubject("Other");
      setCustomSubject(task.subject);
    }

    // Format ISO string to datetime-local compliant format
    const dateObj = new Date(task.deadline);
    const tzOffset = dateObj.getTimezoneOffset() * 60000; // in ms
    const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
    setDeadline(localISOTime);

    setReminderTime(task.reminder_time);
    setAddToCalendar(task.add_to_calendar);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setTitle("");
    setSubject(student.subjects[0] || "");
    setCustomSubject("");
    setDeadline("");
    setReminderTime("1 hour before");
    setAddToCalendar(true);
  };

  const formatDeadline = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const allTasks = tasksQuery.data || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ display: "block" }}
      className="space-y-8" 
      id="task-manager-screen"
    >
      {/* Toast Alert System */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            id="task-manager-toast"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-md border border-black text-sm flex items-center gap-3 bg-white text-black font-mono uppercase font-bold"
          >
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle className="text-red-600" size={18} />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Title Banner */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-black shadow-sm">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-black uppercase">Study Task Manager</h2>
          <p className="text-sm text-neutral-600 mt-1 font-sans">Plan academic obligations and configure instant n8n WhatsApp notification pathways.</p>
        </div>

        {/* Global Demo Mode Toggle */}
        <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 border border-black rounded-xl">
          <div className="text-left">
            <p className="text-xs font-bold text-black flex items-center gap-1.5 font-mono uppercase">
              <Sparkles size={12} className="animate-pulse text-black" />
              Demo Fast-Trigger
            </p>
            <p className="text-[10px] text-neutral-500 font-mono">Resolves automations in 4s</p>
          </div>
          <motion.button
            id="demo-mode-toggle-btn"
            onClick={() => setGlobalDemoMode(!globalDemoMode)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-black hover:opacity-85 focus:outline-none cursor-pointer"
            aria-label="Toggle Demo Mode"
          >
            {globalDemoMode ? (
              <ToggleRight className="w-10 h-10 text-black" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-neutral-300" />
            )}
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Task Form Column */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-black shadow-sm sticky top-6">
            <h3 className="text-lg font-bold font-mono tracking-tight text-black mb-6 flex items-center gap-2 uppercase">
              {editingTask ? (
                <>
                  <Edit3 size={18} className="text-black" />
                  Edit Course Task
                </>
              ) : (
                <>
                  <Plus size={18} className="text-black" />
                  Schedule New Task
                </>
              )}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-5" id="task-form">
              {/* Task Title */}
              <div>
                <label htmlFor="task-title" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2">
                  Task Title
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Code Lab 4 Priority Schedulers"
                  className="w-full px-4 py-2.5 rounded-lg border border-black text-sm font-sans focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                  required
                />
              </div>

              {/* Subject Selector */}
              <div>
                <label htmlFor="task-subject" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2">
                  Course Subject
                </label>
                <select
                  id="task-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-black text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                >
                  {student.subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Other">Other (Type custom)...</option>
                </select>
              </div>

              {/* Custom Subject field */}
              {subject === "Other" && (
                <div>
                  <label htmlFor="custom-subject" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2">
                    Specify Custom Course Subject
                  </label>
                  <input
                    id="custom-subject"
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g. Distributed Computing"
                    className="w-full px-4 py-2.5 rounded-lg border border-black text-sm font-sans focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                    required
                  />
                </div>
              )}

              {/* Deadline (Datetime Picker) */}
              <div>
                <label htmlFor="task-deadline" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2">
                  Syllabus Due Deadline
                </label>
                <input
                  id="task-deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-black text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                  required
                />
              </div>

              {/* Reminder Threshold Selector */}
              <div>
                <label htmlFor="task-reminder" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2">
                  WhatsApp Alert Reminder Time
                </label>
                <select
                  id="task-reminder"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-black text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                >
                  <option value="5 minutes before">5 minutes before</option>
                  <option value="1 hour before">1 hour before</option>
                  <option value="2 hours before">2 hours before</option>
                  <option value="1 day before">1 day before</option>
                </select>
              </div>

              {/* Add To Calendar Toggle */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-black/10">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-black flex items-center gap-1.5 font-mono uppercase">
                    <Calendar size={14} className="text-black" />
                    Auto-add to Calendar
                  </p>
                  <p className="text-[10px] text-neutral-500 font-sans">Creates .ics invite via n8n integration</p>
                </div>
                <motion.button
                  id="add-to-calendar-toggle-btn"
                  type="button"
                  onClick={() => setAddToCalendar(!addToCalendar)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-black focus:outline-none cursor-pointer"
                  aria-label="Toggle Calendar Integration"
                >
                  {addToCalendar ? (
                    <ToggleRight className="w-10 h-10 text-black" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-neutral-300" />
                  )}
                </motion.button>
              </div>

              {/* AI Study Schedule Planner Toggle */}
              {!editingTask && (
                <div className="flex flex-col gap-3 p-3 bg-neutral-50 rounded-xl border border-black/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-black flex items-center gap-1.5 font-mono uppercase">
                        <Sparkles size={14} className="text-black animate-pulse" />
                        Generate AI Study Schedule
                      </p>
                      <p className="text-[10px] text-neutral-500 font-sans">Pushes a customized study plan</p>
                    </div>
                    <motion.button
                      id="ai-schedule-toggle-btn"
                      type="button"
                      onClick={() => setGenerateSchedule(!generateSchedule)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-black focus:outline-none cursor-pointer"
                      aria-label="Toggle AI Study Planner"
                    >
                      {generateSchedule ? (
                        <ToggleRight className="w-10 h-10 text-black" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-neutral-300" />
                      )}
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {generateSchedule && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 pt-1 border-t border-black/10 overflow-hidden"
                      >
                        <label htmlFor="topics-input" className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                          Syllabus Topics (comma separated)
                        </label>
                        <input
                          id="topics-input"
                          type="text"
                          value={topicsText}
                          onChange={(e) => setTopicsText(e.target.value)}
                          placeholder="e.g. CPU Schedulers, Threading, Semaphores"
                          className="w-full px-3 py-1.5 border border-black rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-black/10 bg-white"
                          required={generateSchedule}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                {editingTask && (
                  <motion.button
                    id="cancel-edit-btn"
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelEdit}
                    className="flex-1 py-2.5 border border-black text-black text-xs font-mono font-bold uppercase rounded-lg hover:bg-neutral-50 cursor-pointer flex items-center justify-center gap-1 transition-colors duration-200"
                  >
                    <Undo size={14} /> Cancel
                  </motion.button>
                )}
                <motion.button
                  id="task-submit-btn"
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-grow py-2.5 bg-black hover:bg-neutral-50 border border-black text-white hover:text-black text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-300"
                >
                  <Save size={14} />
                  {editingTask ? "Save Edits" : "Queue Task"}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Task List Column */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-4" id="task-list-panel">
          <h3 className="text-base font-bold font-mono text-black flex items-center gap-2 uppercase">
            <BookOpen className="text-black" size={16} />
            Study Backlog ({allTasks.length} Scheduled)
          </h3>

          {tasksQuery.isLoading ? (
            <div className="space-y-3" id="task-list-skeletons">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl border border-black animate-pulse"></div>
              ))}
            </div>
          ) : allTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black p-12 text-center text-neutral-500 space-y-4 shadow-sm">
              <Calendar className="mx-auto text-neutral-300" size={48} />
              <div>
                <h4 className="font-bold text-black text-sm font-mono uppercase tracking-wider">No scheduled coursework yet</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto font-sans">
                  Create a task using the scheduler card. The system will auto-dispatch n8n calendar payloads instantly.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3" id="course-task-list">
              <AnimatePresence initial={false}>
                {allTasks.map((task) => (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                    className="bg-white p-4 rounded-xl border border-black shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] font-mono text-neutral-800 rounded font-bold uppercase">
                          {task.subject}
                        </span>
                        {task.add_to_calendar && (
                          <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-bold font-mono uppercase rounded flex items-center gap-0.5">
                            <Calendar size={10} /> Calendar
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-black text-sm font-sans break-words">{task.title}</h4>
                      
                      <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono uppercase font-bold">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDeadline(task.deadline)}
                        </span>
                        <span>•</span>
                        <span>Remind {task.reminder_time}</span>
                      </div>

                      {task.schedule && Object.keys(task.schedule).length > 0 && (
                        <div className="mt-3 p-3 bg-neutral-50 border border-black/10 rounded-xl space-y-2">
                          <p className="text-[10px] font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1">
                            <Sparkles size={11} className="animate-pulse text-black" />
                            AI Daily Study Plan
                          </p>
                          <motion.div 
                            variants={listContainerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 gap-1.5 text-xs"
                          >
                            {Object.entries(task.schedule).map(([day, plan]) => (
                              <motion.div key={`schedule-${task.id}-${day}`} variants={listItemVariants} className="flex gap-2">
                                <span className="font-bold text-black shrink-0 min-w-[55px] font-mono uppercase">{day}:</span>
                                <span className="text-neutral-600 leading-relaxed font-sans">{plan}</span>
                              </motion.div>
                            ))}
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {/* Right Side Status and Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                      {/* Status Badge */}
                      <div>
                        {task.automation_status === "sent" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white rounded-full text-xs font-bold font-mono uppercase">
                            <Smartphone size={10} /> Synced
                          </span>
                        ) : task.automation_status === "failed" ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 border border-red-300 rounded-full text-xs font-bold font-mono text-red-700 uppercase">
                              Failed
                            </span>
                            <motion.button
                              id={`retry-btn-${task.id}`}
                              onClick={() => retryMutationFn.mutate(task.id)}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              className="p-1 hover:bg-neutral-50 rounded text-neutral-500 hover:text-black cursor-pointer"
                              title="Retry n8n Sync Action"
                            >
                              <RefreshCw size={12} className={retryMutationFn.isPending ? "animate-spin" : ""} />
                            </motion.button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded-full text-xs font-bold font-mono text-neutral-500 uppercase animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                            Queueing...
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          id={`edit-btn-${task.id}`}
                          onClick={() => handleEditClick(task)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 border border-black rounded-md hover:bg-neutral-50 text-black cursor-pointer transition-colors duration-150"
                          title="Edit Course Task"
                        >
                          <Edit3 size={14} />
                        </motion.button>
                        <motion.button
                          id={`delete-btn-${task.id}`}
                          onClick={() => deleteMutation.mutate(task.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 border border-black rounded-md hover:bg-black hover:text-white text-black cursor-pointer transition-colors duration-150"
                          title="Delete Course Task"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
