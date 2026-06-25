import React, { useState } from "react";
import { loginStudent } from "../lib/api";
import { Student } from "../types";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AuthForm from "./AuthForm";

interface OnboardingProps {
  onSuccess: (student: Student) => void;
}

export default function Onboarding({ onSuccess }: OnboardingProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // One-click quick login for judges to instantly jump to the pre-seeded state
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const student = await loginStudent("aarav.sharma@campus.edu");
      onSuccess(student);
    } catch (err: any) {
      setError(err.response?.data?.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={containerVariants}
      style={{ display: "block" }}
      className="max-w-xl mx-auto my-8" 
      id="onboarding-container"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-neutral-50 border-b border-neutral-200 px-8 py-10 text-black text-center relative">
          <div className="absolute top-4 right-4 bg-black/5 text-black text-[10px] px-2.5 py-1 rounded-full font-mono flex items-center gap-1 border border-black/5 uppercase tracking-wider font-semibold">
            <Sparkles size={12} className="text-black" />
            Hackathon Build
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-black uppercase">CampusFlow</h1>
          <p className="mt-2 text-neutral-500 text-xs max-w-sm mx-auto font-mono">
            Connect your WhatsApp and Google Calendar for seamless, AI-driven study orchestration.
          </p>
        </div>

        <div className="p-8">
          <AnimatePresence>
            {error && (
              <motion.div 
                id="onboarding-error"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm overflow-hidden"
              >
                <AlertCircle className="shrink-0 mt-0.5 text-red-600" size={18} />
                <div>
                  <p className="font-semibold">Onboarding Error</p>
                  <p className="text-xs">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
 
          {/* Quick Start for Judges */}
          <motion.div variants={itemVariants} className="mb-8 p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-black flex items-center gap-1.5 uppercase font-mono tracking-tight">
                <Sparkles className="text-black" size={16} />
                Evaluator Quick Pass
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Bypass the form to log in instantly with seeded academic data.
              </p>
            </div>
            <motion.button
              id="quick-demo-login-btn"
              type="button"
              whileHover={{ scale: 1.02, backgroundColor: "#ffffff", color: "#000000" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 bg-black border border-black text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200"
            >
              <Check size={14} />
              Instant Demo Login
            </motion.button>
          </motion.div>
 
          <motion.div variants={itemVariants} className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="flex-shrink mx-4 text-[10px] font-mono uppercase tracking-widest text-neutral-400">Or credentials validation</span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </motion.div>

          {/* New AuthForm containing Login & Register toggle */}
          <AuthForm 
            onAuthSuccess={onSuccess} 
            isLoading={loading} 
            setIsLoading={setLoading} 
            setError={setError} 
          />
        </div>
      </div>
    </motion.div>
  );
}
