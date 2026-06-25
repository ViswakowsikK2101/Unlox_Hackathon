import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAutomations, getTasks, retryAutomation } from "../lib/api";
import { Student, AutomationLog, Task } from "../types";
import { 
  Smartphone, Calendar, RefreshCw, AlertTriangle, CheckCircle, 
  Clock, ArrowUpRight, ShieldCheck, HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AutomationsListProps {
  student: Student;
  globalDemoMode: boolean;
}

export default function AutomationsList({ student, globalDemoMode }: AutomationsListProps) {
  const queryClient = useQueryClient();

  // 1. Fetch automations list with automatic polling (3000ms refetchInterval for live simulation)
  const automationsQuery = useQuery<AutomationLog[]>({
    queryKey: ["automations"],
    queryFn: getAutomations,
    refetchInterval: 3000, // Dynamic polling interval as requested
  });

  // 2. Fetch tasks to correlate task_id with actual titles
  const tasksQuery = useQuery<Task[]>({
    queryKey: ["tasks", student.id],
    queryFn: () => getTasks(student.id),
  });

  // 3. Retry mutation
  const retryMutation = useMutation<{ success: boolean; task: Task }, Error, string>({
    mutationFn: (taskId) => retryAutomation(taskId, globalDemoMode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", student.id] });
    }
  });

  const getTaskTitle = (taskId: string) => {
    if (taskId === "broadcast") return "Global Circular Bulletin Broadcast";
    const task = tasksQuery.data?.find((t) => t.id === taskId);
    return task ? task.title : `Task Ref: ${taskId}`;
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const logs = automationsQuery.data || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ display: "block" }}
      className="space-y-8" 
      id="automations-screen"
    >
      {/* Header Info */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-black shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-black uppercase">My Automation Center</h2>
          <p className="text-sm text-neutral-600 font-sans">
            Real-time status monitor of WhatsApp pushes and Google Calendar sync pipelines (n8n hooks).
          </p>
        </div>

        {/* Polling Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-black rounded-lg text-xs font-mono font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
          <span>Syncing logs (3s poll)</span>
        </div>
      </motion.div>

      {/* Main Container */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-black shadow-sm overflow-hidden">
        
        {/* Banner info */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs text-neutral-500 font-mono">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-700">
            <ShieldCheck size={14} className="text-black" />
            Integrity Check: Connected
          </span>
          <span className="font-bold">
            {logs.length} logged pipeline processes
          </span>
        </div>

        {automationsQuery.isLoading ? (
          <div className="p-8 space-y-4" id="automations-skeletons">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-neutral-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-4">
            <Smartphone className="mx-auto text-neutral-300" size={48} />
            <div>
              <h4 className="font-bold text-black font-mono uppercase tracking-wider text-sm">No automation runs recorded</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Trigger an automation by creating a coursework task or sending a notice broadcast summary.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto" id="automations-desktop-table">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-widest font-mono border-b border-neutral-200">
                    <th className="py-4 px-6">Execution Log</th>
                    <th className="py-4 px-6">Trigger Workflow Name</th>
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Status Badge</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  <AnimatePresence initial={false}>
                    {logs.map((log) => (
                      <motion.tr 
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-neutral-50/60 transition-colors"
                      >
                        {/* Coursework mapping */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-black">
                            {getTaskTitle(log.task_id)}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-0.5 font-bold uppercase">
                            ID: {log.task_id}
                          </div>
                        </td>

                        {/* Workflow info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-black border border-black text-white rounded">
                              {log.workflow_name.includes("Calendar") ? <Calendar size={12} /> : <Smartphone size={12} />}
                            </span>
                            <span className="font-bold font-mono text-xs uppercase text-neutral-700">{log.workflow_name}</span>
                          </div>
                        </td>

                        {/* Log time */}
                        <td className="py-4 px-6 text-neutral-500 font-mono text-xs">
                          <div className="flex items-center gap-1.5 font-bold uppercase">
                            <Clock size={12} />
                            {formatTime(log.triggered_at)}
                          </div>
                        </td>

                        {/* State badge color coding */}
                        <td className="py-4 px-6">
                          {log.status === "sent" || log.status === "delivered" || log.status === "success" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded-full text-xs font-bold font-mono uppercase text-neutral-800">
                              <CheckCircle size={12} /> Delivered
                            </span>
                          ) : log.status === "failed" || log.status === "error" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 border border-red-300 rounded-full text-xs font-bold font-mono uppercase text-red-700">
                              <AlertTriangle size={12} /> Sync Error
                            </span>
                          ) : log.status === "skipped" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded-full text-xs font-bold font-mono uppercase text-neutral-500">
                              Skipped
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded-full text-xs font-bold font-mono uppercase text-neutral-600 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-black"></span>
                              Queueing
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          {log.status === "failed" && (
                            <motion.button
                              id={`retry-log-btn-${log.task_id}`}
                              onClick={() => retryMutation.mutate(log.task_id)}
                              disabled={retryMutation.isPending}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-black hover:bg-neutral-100 border border-black text-white hover:text-black text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer"
                            >
                              <RefreshCw size={10} className={retryMutation.isPending ? "animate-spin" : ""} />
                              Retry Run
                            </motion.button>
                          )}
                          {log.status === "sent" && (
                            <span className="text-neutral-400 font-bold uppercase font-mono text-[11px] select-none">Completed</span>
                          )}
                          {log.status === "pending" && (
                            <span className="text-neutral-500 text-[11px] select-none font-mono font-bold uppercase">Pending...</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Stack View - Matches perfectly at 375px width */}
            <div className="block md:hidden p-4 space-y-4" id="automations-mobile-cards">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -1, scale: 1.01 }}
                    className={`p-4 rounded-xl border ${
                      log.status === "pending" 
                        ? "bg-neutral-50 border-black/15" 
                        : log.status === "failed"
                        ? "bg-neutral-50 border-red-300"
                        : "bg-white border-black/10 hover:border-black"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono text-neutral-400 font-bold uppercase">Ref: {log.task_id}</p>
                        <h4 className="font-bold text-black text-sm leading-snug">
                          {getTaskTitle(log.task_id)}
                        </h4>
                      </div>

                      {/* Compact Badge */}
                      <div className="shrink-0">
                        {log.status === "sent" || log.status === "delivered" || log.status === "success" ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded-full text-[10px] font-bold font-mono uppercase text-neutral-800">
                            <CheckCircle size={10} /> Delivered
                          </span>
                        ) : log.status === "failed" || log.status === "error" ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-neutral-100 border border-red-300 rounded-full text-[10px] font-bold font-mono uppercase text-red-700">
                            Sync Error
                          </span>
                        ) : log.status === "skipped" ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded-full text-[10px] font-bold font-mono uppercase text-neutral-500">
                            Skipped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded-full text-[10px] font-bold font-mono uppercase text-neutral-600 animate-pulse">
                            Queueing
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body Specs */}
                    <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight size={12} className="text-neutral-400" />
                        <span className="font-bold font-mono uppercase text-[10px] text-neutral-700">{log.workflow_name}</span>
                      </div>

                      <span className="font-mono font-bold text-neutral-500">
                        {formatTime(log.triggered_at)}
                      </span>
                    </div>

                    {/* Actions for failed items on mobile */}
                    {log.status === "failed" && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <motion.button
                          id={`retry-mobile-btn-${log.task_id}`}
                          onClick={() => retryMutation.mutate(log.task_id)}
                          disabled={retryMutation.isPending}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-2 bg-black hover:bg-neutral-100 border border-black text-white hover:text-black transition-colors duration-200 font-mono font-bold uppercase text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={10} className={retryMutation.isPending ? "animate-spin" : ""} />
                          Retry Dispatcher Action
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
