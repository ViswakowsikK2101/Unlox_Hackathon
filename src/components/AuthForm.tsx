import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../lib/supabaseClient";
import { registerStudent, loginStudent } from "../lib/api";
import { Student } from "../types";
import { 
  User, 
  GraduationCap, 
  Phone, 
  Mail, 
  BookOpen, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Lock, 
  LogIn, 
  UserPlus 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const phoneRegex = /^\+?[1-9]\d{9,14}$/;

const loginSchema = z.object({
  email: z.string().email("Please enter a valid Google email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  branch: z.string().min(2, "Please specify your department or branch"),
  year: z.string().min(1, "Please select your academic year"),
  phone: z.string().regex(phoneRegex, "WhatsApp number must be a valid format with country code (e.g., +919876543210)"),
  email: z.string().email("Please enter a valid Google account email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface AuthFormProps {
  onAuthSuccess: (student: Student) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export default function AuthForm({ onAuthSuccess, isLoading, setIsLoading, setError }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Custom state for dynamic subjects input (for Registration only)
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<string[]>([
    "Operating Systems",
    "Machine Learning",
    "Software Engineering"
  ]);

  // Login form handler
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "aarav.sharma@campus.edu",
      password: "password123",
    }
  });

  // Register form handler
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignupForm
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      branch: "Computer Science",
      year: "3rd Year",
      phone: "+919876543210",
      email: "",
      password: "",
    }
  });

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectInput.trim() && !subjects.includes(subjectInput.trim())) {
      setSubjects([...subjects, subjectInput.trim()]);
      setSubjectInput("");
    }
  };

  const handleRemoveSubject = (sub: string) => {
    setSubjects(subjects.filter((s) => s !== sub));
  };

  // Submit Login
  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Supabase Auth Call
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError;
      }

      // 2. Fetch or sync profile with local Express backend
      try {
        const student = await loginStudent(data.email);
        onAuthSuccess(student);
      } catch (backendErr: any) {
        // If student does not exist in local back-end in-memory list (404),
        // we auto-onboard them gracefully to prevent user blockages.
        const meta = authData.user?.user_metadata || {};
        const autoOnboarded = await registerStudent({
          name: meta.name || data.email.split("@")[0],
          branch: meta.branch || "Computer Science",
          year: meta.year || "3rd Year",
          phone: meta.phone || "+919876543210",
          google_email: data.email,
          subjects: ["Operating Systems", "Machine Learning", "Software Engineering"],
        });
        onAuthSuccess(autoOnboarded);
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Registration
  const onSignup = async (data: z.infer<typeof registerSchema>) => {
    if (subjects.length === 0) {
      setError("Please add at least one subject to customize your schedule.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // 1. Supabase Auth Call
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            branch: data.branch,
            year: data.year,
            phone: data.phone,
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // 2. Register/sync profile with local Express backend
      const student = await registerStudent({
        name: data.name,
        branch: data.branch,
        year: data.year,
        phone: data.phone,
        google_email: data.email,
        subjects,
      });

      onAuthSuccess(student);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Tab Switcher Animation Variants
  const tabContentVariants = {
    hidden: (tab: "login" | "register") => ({
      opacity: 0,
      x: tab === "login" ? -30 : 30,
    }),
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 320, damping: 25 }
    },
    exit: (tab: "login" | "register") => ({
      opacity: 0,
      x: tab === "login" ? 30 : -30,
      transition: { duration: 0.18, ease: "easeInOut" }
    })
  };

  const registerFieldVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.04,
        type: "spring",
        stiffness: 120,
        damping: 14
      }
    })
  };

  return (
    <div className="space-y-6">
      {/* Toggle Tab Header */}
      <div className="flex bg-neutral-100 p-1.5 rounded-xl border border-neutral-200 relative">
        <button
          type="button"
          onClick={() => {
            setActiveTab("login");
            setError(null);
          }}
          className={`flex-1 py-2.5 text-xs font-bold font-mono rounded-lg transition-colors relative z-10 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
            activeTab === "login" ? "text-white" : "text-neutral-500 hover:text-black"
          }`}
        >
          <LogIn size={14} />
          Login (Returning User)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("register");
            setError(null);
          }}
          className={`flex-1 py-2.5 text-xs font-bold font-mono rounded-lg transition-colors relative z-10 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
            activeTab === "register" ? "text-white" : "text-neutral-500 hover:text-black"
          }`}
        >
          <UserPlus size={14} />
          Register (New User)
        </button>
        {/* Animated Highlight Underlay */}
        <motion.div
          layoutId="active-tab-indicator"
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-black rounded-lg"
          animate={{ x: activeTab === "login" ? "0%" : "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        />
      </div>

      {/* Form Area */}
      <AnimatePresence mode="wait">
        {activeTab === "login" ? (
          <motion.form
            key="login-form"
            custom={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onSubmit={handleLoginSubmit(onLogin)}
            className="space-y-5"
            id="login-form"
          >
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Mail size={14} className="text-neutral-500" />
                Google Account Email
              </label>
              <input
                id="login-email"
                type="email"
                className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm transition-all duration-300 hover:border-black focus:scale-[1.01] focus:shadow-md focus:shadow-black/5 focus:outline-none focus:ring-2 ${
                  loginErrors.email
                    ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                    : "border-neutral-300 focus:ring-black/10 focus:border-black"
                }`}
                placeholder="aarav.sharma@campus.edu"
                {...registerLogin("email")}
              />
              {loginErrors.email && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1" id="login-email-error">
                  <AlertCircle size={12} /> {loginErrors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Lock size={14} className="text-neutral-500" />
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm transition-all duration-300 hover:border-black focus:scale-[1.01] focus:shadow-md focus:shadow-black/5 focus:outline-none focus:ring-2 ${
                  loginErrors.password
                    ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                    : "border-neutral-300 focus:ring-black/10 focus:border-black"
                }`}
                placeholder="••••••••"
                {...registerLogin("password")}
              />
              {loginErrors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1" id="login-password-error">
                  <AlertCircle size={12} /> {loginErrors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 bg-black text-white hover:bg-neutral-50 hover:text-black border border-black rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer mt-4 transition-colors duration-300"
            >
              {isLoading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  Login to Dashboard
                </>
              )}
            </motion.button>
          </motion.form>
        ) : (
          <motion.form
            key="register-form"
            custom={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onSubmit={handleSignupSubmit(onSignup)}
            className="space-y-5"
            id="register-form"
          >
            {/* Full Name */}
            <motion.div custom={0} variants={registerFieldVariants} className="space-y-1.5">
              <label htmlFor="reg-name" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <User size={14} className="text-neutral-500" />
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm transition-all duration-300 hover:border-black focus:scale-[1.01] focus:shadow-md focus:shadow-black/5 focus:outline-none focus:ring-2 ${
                  signupErrors.name
                    ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                    : "border-neutral-300 focus:ring-black/10 focus:border-black"
                }`}
                placeholder="Rahul Kumar"
                {...registerSignup("name")}
              />
              {signupErrors.name && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1" id="reg-name-error">
                  <AlertCircle size={12} /> {signupErrors.name.message}
                </p>
              )}
            </motion.div>

            {/* Academic Row */}
            <motion.div custom={1} variants={registerFieldVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="reg-branch" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-neutral-500" />
                  Branch / Major
                </label>
                <input
                  id="reg-branch"
                  type="text"
                  className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm transition-all duration-300 hover:border-black focus:scale-[1.01] focus:shadow-md focus:shadow-black/5 focus:outline-none focus:ring-2 ${
                    signupErrors.branch
                      ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                      : "border-neutral-300 focus:ring-black/10 focus:border-black"
                  }`}
                  placeholder="Computer Science"
                  {...registerSignup("branch")}
                />
                {signupErrors.branch && (
                  <p className="mt-1 text-xs text-red-600" id="reg-branch-error">{signupErrors.branch.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-year" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-neutral-500" />
                  Academic Year
                </label>
                <select
                  id="reg-year"
                  className="w-full px-4 py-2.5 bg-white rounded-lg border border-neutral-300 text-sm transition-all duration-300 hover:border-black focus:scale-[1.01] focus:shadow-md focus:shadow-black/5 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                  {...registerSignup("year")}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
                {signupErrors.year && (
                  <p className="mt-1 text-xs text-red-600" id="reg-year-error">{signupErrors.year.message}</p>
                )}
              </div>
            </motion.div>

            {/* WhatsApp Phone */}
            <motion.div custom={2} variants={registerFieldVariants} className="space-y-1.5">
              <label htmlFor="reg-phone" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Phone size={14} className="text-neutral-500" />
                WhatsApp Phone Number
              </label>
              <input
                id="reg-phone"
                type="text"
                className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm transition-all duration-300 hover:border-black focus:scale-[1.01] focus:shadow-md focus:shadow-black/5 focus:outline-none focus:ring-2 ${
                  signupErrors.phone
                    ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                    : "border-neutral-300 focus:ring-black/10 focus:border-black"
                }`}
                placeholder="+919999999999"
                {...registerSignup("phone")}
              />
              <p className="text-[10px] text-neutral-400 leading-normal font-mono">
                Include country code for n8n WhatsApp messaging (e.g. +91 or +1)
              </p>
              {signupErrors.phone && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1" id="reg-phone-error">
                  <AlertCircle size={12} /> {signupErrors.phone.message}
                </p>
              )}
            </motion.div>

            {/* Google Email */}
            <motion.div custom={3} variants={registerFieldVariants} className="space-y-1.5">
              <label htmlFor="reg-email" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Mail size={14} className="text-neutral-500" />
                Google Account Email
              </label>
              <input
                id="reg-email"
                type="email"
                className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm transition-all duration-300 hover:border-black focus:scale-[1.01] focus:shadow-md focus:shadow-black/5 focus:outline-none focus:ring-2 ${
                  signupErrors.email
                    ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                    : "border-neutral-300 focus:ring-black/10 focus:border-black"
                }`}
                placeholder="rahul@gmail.com"
                {...registerSignup("email")}
              />
              {signupErrors.email && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1" id="reg-email-error">
                  <AlertCircle size={12} /> {signupErrors.email.message}
                </p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div custom={4} variants={registerFieldVariants} className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Lock size={14} className="text-neutral-500" />
                Password (min. 8 characters)
              </label>
              <input
                id="reg-password"
                type="password"
                className={`w-full px-4 py-2.5 bg-white rounded-lg border text-sm transition-all duration-300 hover:border-black focus:scale-[1.01] focus:shadow-md focus:shadow-black/5 focus:outline-none focus:ring-2 ${
                  signupErrors.password
                    ? "border-red-400 focus:ring-red-500/10 focus:border-red-500"
                    : "border-neutral-300 focus:ring-black/10 focus:border-black"
                }`}
                placeholder="••••••••"
                {...registerSignup("password")}
              />
              {signupErrors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1" id="reg-password-error">
                  <AlertCircle size={12} /> {signupErrors.password.message}
                </p>
              )}
            </motion.div>

            {/* Subjects Input */}
            <motion.div custom={5} variants={registerFieldVariants} className="space-y-1.5">
              <label htmlFor="reg-subject-input" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <BookOpen size={14} className="text-neutral-500" />
                Enrollment Subjects
              </label>
              <div className="flex gap-2">
                <input
                  id="reg-subject-input"
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  className="flex-grow px-4 py-2 bg-white rounded-lg border border-neutral-300 text-sm transition-all duration-300 hover:border-black focus:scale-[1.01] focus:shadow-md focus:shadow-black/5 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                  placeholder="e.g. Distributed Databases"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubject(e);
                    }
                  }}
                />
                <button
                  id="reg-add-subject-btn"
                  type="button"
                  onClick={handleAddSubject}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Subject Chips */}
              <div className="flex flex-wrap gap-2 mt-2" id="reg-subjects-chip-container">
                <AnimatePresence>
                  {subjects.map((sub) => (
                    <motion.span
                      key={sub}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-50 text-neutral-800 text-xs font-mono font-bold rounded-full border border-neutral-200"
                    >
                      {sub}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub)}
                        className="text-neutral-400 hover:text-black focus:outline-none text-xs leading-none cursor-pointer font-bold ml-1"
                      >
                        &times;
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
              {subjects.length === 0 && (
                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1 font-mono">
                  <AlertCircle size={12} /> Please enter at least one active college subject.
                </p>
              )}
            </motion.div>

            {/* Register button */}
            <motion.button
              id="reg-submit-btn"
              type="submit"
              disabled={isLoading}
              custom={6}
              variants={registerFieldVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 bg-black text-white hover:bg-neutral-50 hover:text-black border border-black rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer mt-4 transition-colors duration-300"
            >
              {isLoading ? (
                <span>Registering student profile...</span>
              ) : (
                <>
                  <Check size={18} />
                  Register New Account
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
