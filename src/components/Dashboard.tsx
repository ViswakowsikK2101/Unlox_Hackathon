import { useQuery } from "@tanstack/react-query";
import { getTasks, getAITip, getIntegrationStatus, triggerN8NWorkflow, syncToSupabase, getGrokInsights } from "../lib/api";
import { Student, Task } from "../types";
import { Calendar, Clock, AlertCircle, Sparkles, CheckCircle2, RefreshCw, Smartphone, ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  student: Student;
  onNavigateToTasks: () => void;
  onNavigateToAutomations: () => void;
}

export default function Dashboard({ student, onNavigateToTasks, onNavigateToAutomations }: DashboardProps) {
  // Parallel fetches to prevent waterfalls
  const tasksQuery = useQuery<Task[]>({
    queryKey: ["tasks", student.id],
    queryFn: () => getTasks(student.id),
  });

  const tipQuery = useQuery<string>({
    queryKey: ["ai-tip", student.id],
    queryFn: () => getAITip(student.id),
    staleTime: 60 * 60 * 1000, // Tip remains fresh for 1 hour
  });

  // Derived states from task list
  const allTasks = tasksQuery.data || [];
  
  // Sort tasks by nearest deadline
  const sortedTasks = [...allTasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Today's schedule: due within 24 hours
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const todaysSchedule = sortedTasks.filter((task) => {
    const d = new Date(task.deadline);
    return d >= now && d <= oneDayFromNow;
  });

  // Pending tasks: status === "pending"
  const pendingTasks = sortedTasks.filter((task) => task.automation_status === "pending");

  const formatDeadline = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (isoString: string) => {
    return new Date(isoString) < now;
  };

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
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 110, 
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
      id="dashboard-screen"
    >
      {/* Welcome Hero Banner */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 sm:p-8 text-black relative overflow-hidden border border-black shadow-sm"
      >
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-black text-white rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              {student.year}
            </span>
            <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              {student.branch}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-black">
            Welcome back, {student.name}
          </h2>
          <p className="text-neutral-600 text-sm max-w-xl font-sans">
            CampusFlow is actively synchronizing your {student.subjects.length} course subjects with Google Calendar. Immediate alert routes are loaded via WhatsApp.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Today's Schedule Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4" id="dashboard-schedule-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-mono tracking-tight text-black flex items-center gap-2 uppercase">
              <Calendar className="text-black" size={18} />
              Today's Flow (Next 24 Hours)
            </h3>
            <span className="text-xs text-black bg-neutral-100 border border-neutral-300 px-2 py-1 rounded-md font-mono font-bold uppercase">
              {todaysSchedule.length} active
            </span>
          </div>

          {/* Schedule Skeleton Loader */}
          {tasksQuery.isLoading ? (
            <div className="space-y-3" id="schedule-skeletons">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between animate-pulse">
                  <div className="space-y-2 flex-grow">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                  <div className="w-16 h-6 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : tasksQuery.isError ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <div>
                <p className="font-semibold">Failed to fetch schedule</p>
                <motion.button 
                  onClick={() => tasksQuery.refetch()} 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs underline text-red-800 font-semibold mt-1 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} /> Retry Loading
                </motion.button>
              </div>
            </div>
          ) : todaysSchedule.length === 0 ? (
            <div className="bg-white rounded-xl border border-black p-8 text-center text-neutral-500 space-y-3 shadow-sm">
              <Calendar className="mx-auto text-neutral-300" size={40} />
              <div>
                <h4 className="font-bold text-black font-mono uppercase tracking-wider text-sm">Clear academic skies today!</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  No tasks or reminders are scheduled within the next 24 hours. Enjoy the breather or prepare ahead!
                </p>
              </div>
              <motion.button
                onClick={onNavigateToTasks}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-2 px-4 py-2 bg-black hover:bg-neutral-100 border border-black text-white hover:text-black text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors duration-300"
              >
                Create Study Task
              </motion.button>
            </div>
          ) : (
            <div className="space-y-3" id="dashboard-schedule-list">
              {todaysSchedule.map((task) => (
                <motion.div 
                  key={task.id}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="bg-white p-4 rounded-xl border border-black hover:bg-neutral-50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-[10px] font-mono text-neutral-700 font-bold uppercase">
                        {task.subject}
                      </span>
                      {isOverdue(task.deadline) && (
                        <span className="px-2 py-0.5 bg-black text-white border border-black rounded text-[10px] font-mono font-bold uppercase flex items-center gap-0.5 animate-pulse">
                          <AlertCircle size={8} /> Overdue
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-black text-sm">{task.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDeadline(task.deadline)}
                      </span>
                      <span>•</span>
                      <span>Remind {task.reminder_time}</span>
                    </div>
                  </div>

                  {/* WhatsApp/Calendar Integration status */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                      task.automation_status === "sent"
                        ? "bg-neutral-100 text-neutral-800 border-black"
                        : task.automation_status === "failed"
                        ? "bg-neutral-100 text-red-700 border-red-300"
                        : "bg-neutral-100 text-neutral-500 border-neutral-300 animate-pulse"
                    }`}>
                      <Smartphone size={12} />
                      {task.automation_status === "sent" 
                        ? "Alert Sent" 
                        : task.automation_status === "failed" 
                        ? "Sync Error" 
                        : "Syncing..."}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* AI Tip of the Day - Nested beautifully as part of the primary schedule feedback */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-xl p-5 text-black shadow-sm relative overflow-hidden border border-black" 
            id="dashboard-ai-tip"
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 bg-black rounded-lg text-white">
                <Sparkles size={18} />
              </div>
              <div className="space-y-1.5 flex-grow">
                <h4 className="text-xs font-bold font-mono tracking-wider text-neutral-500 flex items-center gap-1 uppercase">
                  AI COACH TIP OF THE DAY
                </h4>
                {tipQuery.isLoading ? (
                  <div className="space-y-2 py-1">
                    <div className="h-3.5 bg-neutral-100 rounded w-full animate-pulse"></div>
                    <div className="h-3.5 bg-neutral-100 rounded w-5/6 animate-pulse"></div>
                  </div>
                ) : tipQuery.isError ? (
                  <p className="text-xs text-neutral-600 font-sans">
                    Stay diligent, block your distraction routes, and keep syncing schedules to conquer your syllabus!
                  </p>
                ) : (
                  <p className="text-sm font-medium leading-relaxed text-black font-sans">
                    {tipQuery.data}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Sidebar Pending Tasks & Flow Progress */}
        <motion.div variants={itemVariants} className="space-y-6" id="dashboard-sidebar">
          
          {/* Pending Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-mono tracking-tight text-black flex items-center gap-2 uppercase">
                <ListTodo className="text-black" size={16} />
                Pending Sync Actions
              </h3>
              <span className="text-[11px] font-mono bg-neutral-100 border border-neutral-300 text-neutral-800 px-2 py-0.5 rounded-full font-bold uppercase">
                {pendingTasks.length} queued
              </span>
            </div>

            {tasksQuery.isLoading ? (
              <div className="space-y-3" id="pending-skeletons">
                <div className="h-16 bg-white rounded-xl border border-black/10 animate-pulse"></div>
                <div className="h-16 bg-white rounded-xl border border-black/10 animate-pulse"></div>
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-black p-5 text-center text-neutral-500 shadow-sm">
                <CheckCircle2 className="mx-auto text-black" size={30} />
                <h4 className="font-bold text-black text-xs font-mono uppercase mt-2">All triggers synchronized!</h4>
                <p className="text-[10px] text-neutral-500 mt-1 font-sans">
                  All active tasks have dispatched successfully to Google Calendar and WhatsApp.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5" id="dashboard-pending-list">
                {pendingTasks.slice(0, 3).map((task) => (
                  <motion.div 
                    key={task.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 bg-white rounded-xl border border-black hover:border-black/50 shadow-xs flex items-center justify-between gap-3 transition-colors duration-200"
                  >
                    <div className="min-w-0 flex-grow">
                      <p className="text-xs font-mono text-neutral-400 font-bold uppercase">{task.subject}</p>
                      <h4 className="font-bold text-black text-xs truncate">{task.title}</h4>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                      <span className="text-[10px] font-mono text-black font-bold uppercase">Pending n8n</span>
                    </div>
                  </motion.div>
                ))}
                {pendingTasks.length > 3 && (
                  <motion.button
                    onClick={onNavigateToAutomations}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full text-center py-1.5 text-xs font-mono font-bold text-neutral-500 hover:text-black hover:underline cursor-pointer uppercase"
                  >
                    View +{pendingTasks.length - 3} remaining queue
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Quick n8n Automation Summary Stats */}
          <div className="bg-white p-5 rounded-xl border border-black shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono">
              Automation Dispatcher Log
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-2xl font-bold font-mono text-black">
                  {allTasks.filter((t) => t.automation_status === "sent").length}
                </span>
                <p className="text-[11px] text-neutral-500 font-mono font-semibold uppercase">Alerts Broadcasted</p>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-bold font-mono text-black">
                  {allTasks.filter((t) => t.automation_status === "failed").length}
                </span>
                <p className="text-[11px] text-neutral-500 font-mono font-semibold uppercase">Sync Failures</p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100">
              <motion.button
                onClick={onNavigateToAutomations}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-2 bg-black hover:bg-neutral-50 text-white hover:text-black border border-black rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-300"
              >
                Open Real-time Logs
              </motion.button>
            </div>
          </div>

          {/* V1.3 PRODUCTION INTEGRATION CONTROL CENTER */}
          <IntegrationControlCenter student={student} />

        </motion.div>
      </div>
    </motion.div>
  );
}

// Sub-component to manage stable integration testing elegantly
import { useState } from "react";
import { Database, Activity, Check, AlertTriangle, Play, HelpCircle } from "lucide-react";

function IntegrationControlCenter({ student }: { student: Student }) {
  const [testLog, setTestLog] = useState<{ type: "success" | "error" | "info" | null; msg: string }>({ type: null, msg: "" });
  const [testing, setTesting] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["integration-status"],
    queryFn: () => getIntegrationStatus(),
    refetchInterval: 15000, // Periodically check configuration state
  });

  const runTestWebhook = async () => {
    setTesting("n8n");
    setTestLog({ type: "info", msg: "Dispatching n8n pipeline webhook..." });
    try {
      const sampleTask: Task = {
        id: "test-task-id",
        student_id: student.id,
        title: "Test Integration Verification Run",
        taskTitle: "Test Integration Verification Run",
        subject: student.subjects[0] || "General Studies",
        deadline: new Date(Date.now() + 4 * 3600000).toISOString(),
        reminder_time: "5 minutes before",
        add_to_calendar: true,
        automation_status: "pending"
      };
      const res = await triggerN8NWorkflow("test_webhook", sampleTask, student);
      if (res.mode === "production") {
        setTestLog({ type: "success", msg: "Production: n8n webhook triggered successfully!" });
      } else if (res.mode === "fallback") {
        setTestLog({ type: "success", msg: "Fallback: n8n pipeline simulated via gateway fallback." });
      } else {
        setTestLog({ type: "success", msg: "Mock: n8n trigger simulation resolved successfully." });
      }
    } catch (err: any) {
      setTestLog({ type: "error", msg: `Webhook call failed: ${err.message || err}` });
    } finally {
      setTesting(null);
    }
  };

  const runTestDBSync = async () => {
    setTesting("supabase");
    setTestLog({ type: "info", msg: "Syncing sample record with Supabase..." });
    try {
      const payload = {
        id: student.id,
        name: student.name,
        branch: student.branch,
        year: student.year,
        phone: student.phone,
        google_email: student.google_email,
        updated_at: new Date().toISOString()
      };
      const res = await syncToSupabase("student", payload);
      if (res.mode === "production") {
        setTestLog({ type: "success", msg: "Production: Supabase student record synced!" });
      } else if (res.mode === "fallback") {
        setTestLog({ type: "success", msg: "Fallback: Supabase transient offline. Backed up locally." });
      } else {
        setTestLog({ type: "success", msg: "Mock: Student record cached in local developer state." });
      }
    } catch (err: any) {
      setTestLog({ type: "error", msg: `DB Sync failed: ${err.message || err}` });
    } finally {
      setTesting(null);
    }
  };

  const runTestGrok = async () => {
    setTesting("grok");
    setTestLog({ type: "info", msg: "Analyzing context via Grok Llama API..." });
    try {
      const samplePerformance = {
        gpa: "3.91",
        completed_tasks: 12,
        upcoming_deadlines: 4
      };
      const res = await getGrokInsights(student, samplePerformance);
      setTestLog({
        type: "success",
        msg: `Grok Insight: Student performance analyzed with graded target: ${res.gradingInsight || "A"}`
      });
    } catch (err: any) {
      setTestLog({ type: "error", msg: `Grok analysis failed: ${err.message || err}` });
    } finally {
      setTesting(null);
    }
  };

  const status = statusQuery.data;

  return (
    <div className="bg-white p-5 rounded-xl border border-black shadow-sm space-y-4" id="integration-diagnostics-panel">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-black uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Activity size={14} className="text-black animate-pulse" />
          Integration Hub (v1.3)
        </h4>
        <span className="text-[9px] bg-black text-white font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Live Gateway
        </span>
      </div>

      {/* Integration checklist */}
      <div className="space-y-2.5 text-xs font-mono bg-neutral-50 p-3 rounded-lg border border-black/10">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 font-bold uppercase">Supabase DB</span>
          {status?.services.supabase.configured ? (
            <span className="text-black font-bold flex items-center gap-0.5 uppercase">
              <Check size={12} /> Configured
            </span>
          ) : (
            <span className="text-neutral-500 flex items-center gap-0.5 uppercase font-bold" title="Fallback is active">
              <AlertTriangle size={12} /> Sandbox
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-neutral-500 font-bold uppercase">n8n Webhooks</span>
          {status?.services.n8n.configured ? (
            <span className="text-black font-bold flex items-center gap-0.5 uppercase">
              <Check size={12} /> Active
            </span>
          ) : (
            <span className="text-neutral-500 flex items-center gap-0.5 uppercase font-bold">
              <AlertTriangle size={12} /> Simulation
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-neutral-500 font-bold uppercase">Grok Llama</span>
          {status?.services.grok.configured ? (
            <span className="text-black font-bold flex items-center gap-0.5 uppercase">
              <Check size={12} /> Configured
            </span>
          ) : (
            <span className="text-neutral-500 flex items-center gap-0.5 uppercase font-bold">
              <AlertTriangle size={12} /> Standard
            </span>
          )}
        </div>
      </div>

      {/* Connection verification buttons */}
      <div className="space-y-2 pt-1">
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">Verify system connections:</p>
        <div className="grid grid-cols-3 gap-2">
          <motion.button
            id="test-db-btn"
            onClick={runTestDBSync}
            disabled={!!testing}
            whileHover={{ scale: 1.04, translateY: -2 }}
            whileTap={{ scale: 0.96 }}
            className="py-1.5 bg-white hover:bg-black text-black hover:text-white border border-black rounded-md text-[10px] font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-all duration-300"
            title="Sync model to Supabase"
          >
            <Database size={12} />
            <span>DB Sync</span>
          </motion.button>

          <motion.button
            id="test-n8n-btn"
            onClick={runTestWebhook}
            disabled={!!testing}
            whileHover={{ scale: 1.04, translateY: -2 }}
            whileTap={{ scale: 0.96 }}
            className="py-1.5 bg-white hover:bg-black text-black hover:text-white border border-black rounded-md text-[10px] font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-all duration-300"
            title="Test n8n pipeline webhook"
          >
            <Play size={12} />
            <span>Webhook</span>
          </motion.button>

          <motion.button
            id="test-grok-btn"
            onClick={runTestGrok}
            disabled={!!testing}
            whileHover={{ scale: 1.04, translateY: -2 }}
            whileTap={{ scale: 0.96 }}
            className="py-1.5 bg-white hover:bg-black text-black hover:text-white border border-black rounded-md text-[10px] font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-all duration-300"
            title="Analyze performance with Grok"
          >
            <HelpCircle size={12} />
            <span>Grok AI</span>
          </motion.button>
        </div>
      </div>

      {/* Real-time Diagnostics Output */}
      <AnimatePresence>
        {testLog.type && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`p-2.5 rounded-lg border text-[10px] font-mono leading-normal ${
              testLog.type === "success"
                ? "bg-neutral-50 text-neutral-950 border-black"
                : testLog.type === "error"
                ? "bg-neutral-50 text-red-700 border-red-300"
                : "bg-neutral-50 text-black border-black animate-pulse"
            }`}
          >
            <div className="flex items-start gap-1">
              <span className="font-bold uppercase tracking-wider shrink-0">[{testLog.type}]:</span>
              <span className="break-words">{testLog.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

