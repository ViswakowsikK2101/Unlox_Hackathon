import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Student } from "./types";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import TaskManager from "./components/TaskManager";
import NoticeSummarizer from "./components/NoticeSummarizer";
import AutomationsList from "./components/AutomationsList";
import ParticleBackground from "./components/ParticleBackground";
import { 
  GraduationCap, LogOut, LayoutDashboard, CalendarRange, 
  Sparkles, Smartphone, Settings, Menu, X, Landmark 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Initialize a robust QueryClient for server-state caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive background fetches on refocus
      retry: 1,
    },
  },
});

export default function App() {
  const [student, setStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "notice" | "automations">("dashboard");
  const [globalDemoMode, setGlobalDemoMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setStudent(null);
    setActiveTab("dashboard");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence mode="wait">
        <motion.div 
          layout 
          key={student ? `app-${student.id}-${activeTab}` : "app-onboarding"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ display: "flex" }}
          className="min-h-screen bg-ambient-motion flex flex-col font-sans selection:bg-rose-100 selection:text-rose-950 relative overflow-hidden"
        >
        {/* Global Antigravity-inspired Particle Background Canvas */}
        <ParticleBackground />

        {/* Soft floating background ambient glow effects */}
        <div className="soft-glow-backdrop" />
        <div className="soft-glow-backdrop-secondary" />
        
        {/* Global Application Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              
              {/* App Identity */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm border border-slate-800">
                  <Landmark size={18} className="text-rose-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold font-display tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">
                    CampusFlow
                    <span className="text-[9px] bg-rose-50 border border-rose-100 text-rose-600 font-mono px-1.5 py-0.5 rounded-full font-bold">
                      v1.2
                    </span>
                  </h1>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono font-medium">WhatsApp + Calendar AI</p>
                </div>
              </div>

              {/* Desktop Actions and Navigation */}
              {student ? (
                <>
                  <nav className="hidden md:flex space-x-1" aria-label="Main Navigation">
                    <motion.button
                      id="nav-dashboard-btn"
                      onClick={() => setActiveTab("dashboard")}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer ${
                        activeTab === "dashboard"
                          ? "bg-rose-50/80 text-rose-600 border border-rose-100/80"
                          : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent"
                      }`}
                    >
                      <LayoutDashboard size={14} />
                      Dashboard
                    </motion.button>
                    <motion.button
                      id="nav-tasks-btn"
                      onClick={() => setActiveTab("tasks")}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer ${
                        activeTab === "tasks"
                          ? "bg-rose-50/80 text-rose-600 border border-rose-100/80"
                          : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent"
                      }`}
                    >
                      <CalendarRange size={14} />
                      Course Tasks
                    </motion.button>
                    <motion.button
                      id="nav-notice-btn"
                      onClick={() => setActiveTab("notice")}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer ${
                        activeTab === "notice"
                          ? "bg-rose-50/80 text-rose-600 border border-rose-100/80"
                          : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent"
                      }`}
                    >
                      <Sparkles size={14} />
                      Study Guide Creator
                    </motion.button>
                    <motion.button
                      id="nav-automations-btn"
                      onClick={() => setActiveTab("automations")}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer ${
                        activeTab === "automations"
                          ? "bg-rose-50/80 text-rose-600 border border-rose-100/80"
                          : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent"
                      }`}
                    >
                      <Smartphone size={14} />
                      Automations
                    </motion.button>
                  </nav>

                  {/* Student Profile Block */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800 leading-none">{student.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1 justify-end">
                        <GraduationCap size={10} />
                        {student.branch}
                      </p>
                    </div>

                    <motion.button
                      id="logout-btn"
                      onClick={handleLogout}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-150 cursor-pointer"
                      title="Log Out Student Profile"
                    >
                      <LogOut size={16} />
                    </motion.button>
                  </div>

                  {/* Mobile Menu Toggle */}
                  <button
                    id="mobile-menu-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 md:hidden text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    aria-label="Toggle Mobile Menu"
                  >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </>
              ) : (
                <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Settings size={12} className="animate-spin text-slate-300" />
                  Waiting for student credentials...
                </div>
              )}
            </div>
          </div>

          {/* Mobile Dropdown Navigation */}
          <AnimatePresence>
            {student && mobileMenuOpen && (
              <motion.div
                key="mobile-navigation-dropdown"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="md:hidden bg-white border-t border-slate-200 py-3 px-4 space-y-1 overflow-hidden"
                id="mobile-navigation-dropdown"
              >
                <motion.button
                  id="mob-nav-dashboard-btn"
                  onClick={() => {
                    setActiveTab("dashboard");
                    setMobileMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition-colors text-left cursor-pointer ${
                    activeTab === "dashboard" ? "bg-rose-50 text-rose-600 font-bold" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  }`}
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </motion.button>
                <motion.button
                  id="mob-nav-tasks-btn"
                  onClick={() => {
                    setActiveTab("tasks");
                    setMobileMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition-colors text-left cursor-pointer ${
                    activeTab === "tasks" ? "bg-rose-50 text-rose-600 font-bold" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  }`}
                >
                  <CalendarRange size={14} />
                  Course Tasks
                </motion.button>
                <motion.button
                  id="mob-nav-notice-btn"
                  onClick={() => {
                    setActiveTab("notice");
                    setMobileMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition-colors text-left cursor-pointer ${
                    activeTab === "notice" ? "bg-rose-50 text-rose-600 font-bold" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  }`}
                >
                  <Sparkles size={14} />
                  Study Guide Creator
                </motion.button>
                <motion.button
                  id="mob-nav-automations-btn"
                  onClick={() => {
                    setActiveTab("automations");
                    setMobileMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-xs font-bold transition-colors text-left cursor-pointer ${
                    activeTab === "automations" ? "bg-rose-50 text-rose-600 font-bold" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  }`}
                >
                  <Smartphone size={14} />
                  Automations
                </motion.button>
 
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-none">{student.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{student.branch}</p>
                  </div>
                  <motion.button
                    id="mob-logout-btn"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut size={12} />
                    Log Out
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Primary Screen Area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {student ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                id="active-screen-panel"
              >
                {activeTab === "dashboard" && (
                  <Dashboard 
                    student={student} 
                    onNavigateToTasks={() => setActiveTab("tasks")} 
                    onNavigateToAutomations={() => setActiveTab("automations")} 
                  />
                )}
                {activeTab === "tasks" && (
                  <TaskManager 
                    student={student} 
                    globalDemoMode={globalDemoMode} 
                    setGlobalDemoMode={setGlobalDemoMode} 
                  />
                )}
                {activeTab === "notice" && (
                  <NoticeSummarizer student={student} />
                )}
                {activeTab === "automations" && (
                  <AutomationsList 
                    student={student} 
                    globalDemoMode={globalDemoMode} 
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="onboarding"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Onboarding onSuccess={(std) => setStudent(std)} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-150 py-6 text-center text-xs text-slate-400 mt-auto">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-mono">CampusFlow Sync Platform © 2026</p>
            <p className="mt-1 text-[11px] text-slate-300">
              Designed for Hackathon Evaluations • Built via Google AI Studio Build Node Platform
            </p>
          </div>
        </footer>

      </motion.div>
    </AnimatePresence>
    </QueryClientProvider>
  );
}
