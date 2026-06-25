import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { broadcastNotice, generateFlashcards, summarizeNotice } from "../lib/api";
import { Sparkles, Send, FileText, CheckCircle2, ChevronRight, GraduationCap, AlertCircle, RefreshCw, BookOpen, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Student, FlashcardsResponse } from "../types";

const SAMPLE_NOTICES = [
  {
    title: "OS Practical Lab Evaluation",
    text: "Attention 3rd Year CSE Students: The mid-term Operating Systems Practical Lab Evaluation will be held on Monday, June 29th, starting at 9:00 AM. Attendance is strictly compulsory. Please bring your completed lab records and prepare all algorithms relating to CPU scheduling and semaphore-based process synchronization. Retests will not be entertained under any conditions. Contact Prof. Mehta for queries."
  },
  {
    title: "ML Project Phase-1 Presentation",
    text: "Circular regarding Machine Learning (CS-302) Project Phase-1 progress reviews. All groups must submit their initial design architectures, pipeline diagrams, and dataset selection reports on the class portal before Wednesday at midnight. Online peer presentations are scheduled during regular class hours on Thursday. Failure to submit on time results in a 10% grade penalty."
  }
];

interface NoticeSummarizerProps {
  student: Student;
}

export default function NoticeSummarizer({ student }: NoticeSummarizerProps) {
  const queryClient = useQueryClient();
  const [noticeText, setNoticeText] = useState("");
  const [audience, setAudience] = useState("3rd Year CS Only");
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
  const [studySubject, setStudySubject] = useState("");
  const [flashcards, setFlashcards] = useState<{ question: string; answer: string }[] | null>(null);
  const [mcqs, setMcqs] = useState<{ question: string; options: string[]; answer: string }[] | null>(null);

  // New interactive states
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [selectedMcqAnswers, setSelectedMcqAnswers] = useState<Record<number, string>>({});
  const [revealedMcqAnswers, setRevealedMcqAnswers] = useState<Record<number, boolean>>({});

  // New state fields for Flashcard route inputs
  const [subject, setSubject] = useState(student?.subjects?.[0] || "Operating Systems");
  const [taskTitle, setTaskTitle] = useState("Notice Study Prep");
  const [deadline, setDeadline] = useState("2026-07-10T18:00:00Z");

  // 1. UPDATE FLASHCARDS MUTATION (COVERS STUDY BUDDY GENERATION)
  const flashcardMutation = useMutation<FlashcardsResponse, Error, any>({
    mutationFn: generateFlashcards,
    onSuccess: (data) => {
      setFlashcards(data.flashcards);
      setMcqs(data.mcqs);
      setNoticeSummary(null); // Clear text summary if flashcards generated
      setBroadcastResult(null); // Reset previous broadcast states
      setFlippedCards({}); // Clear previous flip states
      setSelectedMcqAnswers({}); // Clear previous MCQ answers
      setRevealedMcqAnswers({}); // Clear previous revealed answers
    }
  });

  // 3. NOTICE SUMMARIZATION MUTATION
  const [noticeSummary, setNoticeSummary] = useState<string[] | null>(null);

  const summarizeMutation = useMutation<string[], Error, string>({
    mutationFn: summarizeNotice,
    onSuccess: (data) => {
      setNoticeSummary(data);
      setFlashcards(null); // Clear flashcards when showing text summary
      setMcqs(null);
      setBroadcastResult(null);
    }
  });

  // 2. BROADCAST MUTATION
  const broadcastMutation = useMutation<{ success: boolean; message: string }, Error, { summary: string[]; audience: string }>({
    mutationFn: ({ summary, audience }) => broadcastNotice(summary, audience),
    onSuccess: (data) => {
      setBroadcastResult(data.message);
      queryClient.invalidateQueries({ queryKey: ["automations"] }); // Sync automations tab
    }
  });

  const handleSampleClick = (sample: typeof SAMPLE_NOTICES[0]) => {
    setNoticeText(sample.text);
    setTaskTitle(sample.title);
    setNoticeSummary(null);
    setFlashcards(null);
    setMcqs(null);
    setBroadcastResult(null);
  };

  const handleSummarizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Frontend Validations
    if (!student?.name) {
      alert("studentName is required");
      return;
    }
    if (!student?.phone) {
      alert("phone is required");
      return;
    }
    if (!subject) {
      alert("subject is required");
      return;
    }
    if (!taskTitle.trim()) {
      alert("taskTitle is required");
      return;
    }
    if (!deadline.trim()) {
      alert("deadline is required");
      return;
    }
    if (!noticeText.trim()) {
      alert("notes is required for flashcards route");
      return;
    }

    flashcardMutation.mutate({
      studentName: student.name,
      phone: student.phone,
      subject,
      taskTitle: taskTitle.trim(),
      deadline: new Date(deadline).toISOString(),
      notes: noticeText.trim()
    });
  };

  const handleSummarizeNoticeOnly = () => {
    if (!noticeText.trim()) {
      alert("Notice text is required to summarize");
      return;
    }
    summarizeMutation.mutate(noticeText.trim());
  };

  const handleBroadcastSubmit = () => {
    let summaryBullets: string[] = [];
    if (noticeSummary && noticeSummary.length > 0) {
      summaryBullets = noticeSummary;
    } else if (flashcards && flashcards.length > 0) {
      summaryBullets = [
        ...flashcards.map(f => `Flashcard Q: ${f.question} | A: ${f.answer}`),
        ...(mcqs ? mcqs.map(m => `Quiz Q: ${m.question} (Answer: ${m.answer})`) : [])
      ];
    } else {
      return;
    }

    broadcastMutation.mutate({
      summary: summaryBullets,
      audience
    });
  };

  const handleGenerateFlashcards = () => {
    if (!studySubject.trim()) return;
    
    // Strict validation for flashcard subject trigger
    if (!student?.name || !student?.phone) {
      alert("Student profile is required");
      return;
    }

    flashcardMutation.mutate({
      studentName: student.name,
      phone: student.phone,
      subject: studySubject.trim(),
      taskTitle: `Study guide for ${studySubject.trim()}`,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: `Focusing on core definitions and problems in ${studySubject.trim()}.`
    });
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
      id="notice-summarizer-screen"
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-black shadow-sm relative overflow-hidden">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-black uppercase">AI Study Guide Creator & Broadcaster</h2>
        <p className="text-sm text-neutral-600 mt-1 font-sans">
          Transform circular notices and study notes into high-quality study materials (Flashcards & MCQs) and broadcast them to classmates.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Notice Input Panel */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-black shadow-sm space-y-4">
            <h3 className="text-base font-bold font-mono text-black flex items-center gap-2 uppercase">
              <FileText className="text-black" size={18} />
              Study Guide Creator
            </h3>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                Click a preset notice to test:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_NOTICES.map((sample, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSampleClick(sample)}
                    className="px-3 py-1.5 bg-neutral-50 hover:bg-black hover:text-white border border-black rounded-lg text-xs font-mono font-bold text-black uppercase cursor-pointer text-left truncate max-w-[180px] sm:max-w-[240px] transition-all duration-200"
                  >
                    {sample.title}
                  </motion.button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSummarizeSubmit} className="space-y-4" id="summarize-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono mb-1">
                    Course Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-black rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                  >
                    {student?.subjects?.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="General Studies">General Studies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. OS Practical Lab Evaluation"
                    className="w-full px-3 py-2 border border-black rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono mb-1">
                  Due Deadline
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-black rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono mb-1">
                  Circular / Study Notes
                </label>
                <motion.textarea
                  id="notice-textarea"
                  rows={5}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="Paste the full, long circular/notice announcement text from your college portal here..."
                  whileFocus={{ scale: 1.005, borderColor: "#000000" }}
                  className="w-full p-4 rounded-xl border border-black text-sm focus:outline-none focus:ring-2 focus:ring-black/10 placeholder-neutral-400 font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  id="summarize-btn"
                  type="submit"
                  disabled={flashcardMutation.isPending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-black hover:bg-neutral-50 text-white hover:text-black border border-black rounded-xl font-mono font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300"
                >
                  {flashcardMutation.isPending ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      <span>Generating materials...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Generate Quiz (AI)</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  id="notice-summarizer-btn"
                  type="button"
                  disabled={summarizeMutation.isPending}
                  onClick={handleSummarizeNoticeOnly}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-neutral-50 border border-black hover:bg-black hover:text-white text-black rounded-xl font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer text-xs transition-colors duration-300"
                >
                  {summarizeMutation.isPending ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      <span>Summarizing...</span>
                    </>
                  ) : (
                    <>
                      <FileText size={14} />
                      <span>Summarize Notice</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* AI Output and Broadcast Options */}
        <motion.div variants={itemVariants} className="space-y-6">
          <AnimatePresence mode="wait">
            {flashcardMutation.isPending ? (
              <motion.div 
                key="loading-summary"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white p-6 rounded-2xl border border-black shadow-sm space-y-4 text-center py-12"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="animate-spin text-black w-8 h-8" />
                  <span className="text-sm font-bold font-mono uppercase text-black">Generating quiz...</span>
                  <p className="text-xs text-neutral-500 max-w-xs font-sans">
                    Please wait while CampusFlow AI constructs your custom Study Flashcards and MCQ Practice Quiz.
                  </p>
                </div>
                <div className="space-y-3 pt-4 max-w-sm mx-auto">
                  <div className="h-3 bg-neutral-100 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-neutral-100 rounded w-5/6 animate-pulse"></div>
                  <div className="h-3 bg-neutral-100 rounded w-2/3 animate-pulse"></div>
                </div>
              </motion.div>
            ) : summarizeMutation.isPending ? (
              <motion.div 
                key="loading-summarization"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white p-6 rounded-2xl border border-black shadow-sm space-y-4 text-center py-12"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="animate-spin text-black w-8 h-8" />
                  <span className="text-sm font-bold font-mono uppercase text-black">Summarizing notice...</span>
                  <p className="text-xs text-neutral-500 max-w-xs font-sans">
                    Please wait while CampusFlow AI analyzes the text to extract the high-priority action items.
                  </p>
                </div>
                <div className="space-y-3 pt-4 max-w-sm mx-auto">
                  <div className="h-3 bg-neutral-100 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-neutral-100 rounded w-5/6 animate-pulse"></div>
                  <div className="h-3 bg-neutral-100 rounded w-2/3 animate-pulse"></div>
                </div>
              </motion.div>
            ) : noticeSummary ? (
              <motion.div 
                key="result-summarization"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="bg-white p-6 rounded-2xl border border-black shadow-sm space-y-6" 
                id="summary-result-panel"
              >
                {summarizeMutation.isError && (
                  <div className="bg-neutral-50 border border-red-300 p-4 rounded-xl text-red-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="shrink-0 text-red-600 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <p className="font-bold uppercase font-mono">Summarization Failed</p>
                      <p className="leading-relaxed">{summarizeMutation.error?.message || "An error occurred during notice summarization."}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="px-2.5 py-1 bg-black text-white rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                    Synthesized by CampusFlow AI Summarizer
                  </span>
                  <h3 className="text-lg font-bold font-mono tracking-tight text-black flex items-center gap-2 uppercase">
                    <Sparkles size={18} className="text-black animate-pulse" />
                    AI Notice Bulletin
                  </h3>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono">
                    📋 High-Priority Action Items
                  </h4>
                  <div className="space-y-3">
                    {noticeSummary.map((bullet, idx) => (
                      <motion.div 
                        key={`bullet-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3.5 bg-neutral-50 border border-black/10 rounded-xl flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-medium text-neutral-800 leading-relaxed font-sans">{bullet}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-neutral-200"></div>
                </div>

                {/* Broadcasting Options */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono">
                    Configure Broadcast Options
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="audience-select" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
                        <GraduationCap size={14} />
                        Target Class Audience
                      </label>
                      <select
                        id="audience-select"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="w-full px-3 py-2 border border-black rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                      >
                        <option value="3rd Year CS Only">3rd Year CS Only</option>
                        <option value="All CSE Batches">All CSE Batches</option>
                        <option value="OS Lab Subgroup C">OS Lab Subgroup C</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2">
                        WhatsApp Dispatch Pipeline
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-50 border border-black text-black rounded-lg text-xs font-mono font-bold uppercase w-full">
                        <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                        n8n Webhook Active
                      </span>
                    </div>
                  </div>

                  <motion.button
                    id="broadcast-btn"
                    onClick={handleBroadcastSubmit}
                    disabled={broadcastMutation.isPending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-black hover:bg-neutral-50 text-white hover:text-black border border-black rounded-xl font-mono font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors duration-300"
                  >
                    {broadcastMutation.isPending ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    <span>Broadcast Notice Summary via WhatsApp</span>
                  </motion.button>
                </div>

                {/* Broadcast Response */}
                <AnimatePresence>
                  {broadcastResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="p-4 bg-neutral-50 border border-black rounded-xl flex items-start gap-3 text-black text-xs" 
                      id="broadcast-success-toast"
                    >
                      <CheckCircle2 className="shrink-0 mt-0.5 text-black" size={16} />
                      <div>
                        <p className="font-bold font-mono uppercase">Broadcast Successful!</p>
                        <p className="mt-0.5 text-neutral-600">The circular summary was pushed as a class WhatsApp bulletin.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : flashcards ? (
              <motion.div 
                key="result-summary"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="bg-white p-6 rounded-2xl border border-black shadow-sm space-y-6" 
                id="summary-result-panel"
              >
                {flashcardMutation.isError && (
                  <div className="bg-neutral-50 border border-red-300 p-4 rounded-xl text-red-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="shrink-0 text-red-600 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <p className="font-bold uppercase font-mono">Generation Failed</p>
                      <p className="leading-relaxed">{flashcardMutation.error?.message || "An error occurred during study guide generation."}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="px-2.5 py-1 bg-black text-white rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                    Structured by CampusFlow AI Study Buddy
                  </span>
                  <h3 className="text-lg font-bold font-mono tracking-tight text-black flex items-center gap-2 uppercase">
                    <Sparkles size={18} className="text-black animate-pulse" />
                    AI Study Buddy Material
                  </h3>
                </div>

                {/* Study Flashcards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono">
                    📚 Generated Flashcards (Click to flip)
                  </h4>
                  <motion.div 
                    variants={listContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3 max-h-[350px] overflow-y-auto pr-1"
                  >
                    {flashcards.map((card, idx) => {
                      const isFlipped = flippedCards[idx] || false;
                      return (
                        <motion.div 
                          key={`flashcard-${idx}`} 
                          variants={listItemVariants}
                          onClick={() => setFlippedCards(prev => ({ ...prev, [idx]: !isFlipped }))}
                          className="cursor-pointer p-4 bg-neutral-50 border border-black rounded-xl hover:border-black/50 transition-colors duration-200 space-y-2.5 select-none"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-black flex items-center gap-1 uppercase font-mono">
                              <HelpCircle size={13} /> Question {idx + 1}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">
                              {isFlipped ? "Show Question" : "Tap to reveal answer"}
                            </span>
                          </div>
                          
                          <AnimatePresence mode="wait">
                            {!isFlipped ? (
                              <motion.p 
                                key="question" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="text-sm font-bold text-black leading-snug font-sans"
                              >
                                {card.question}
                              </motion.p>
                            ) : (
                              <motion.div 
                                key="answer" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="text-xs text-neutral-800 pl-3 border-l-4 border-black bg-white p-2.5 rounded-lg shadow-2xs"
                              >
                                <p className="font-bold text-[9px] text-neutral-400 uppercase font-mono tracking-wider mb-1">Answer</p>
                                <p className="leading-relaxed font-bold font-sans">{card.answer}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* MCQ Questions */}
                {mcqs && mcqs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono">
                      📝 MCQ Practice Quiz
                    </h4>
                    <motion.div 
                      variants={listContainerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {mcqs.map((mcq, idx) => {
                        const selectedOpt = selectedMcqAnswers[idx];
                        const showAnswer = revealedMcqAnswers[idx] || !!selectedOpt;
                        
                        return (
                          <motion.div 
                            key={`mcq-practice-${idx}`} 
                            variants={listItemVariants}
                            className="p-4 bg-neutral-50 border border-black rounded-xl space-y-3"
                          >
                            <p className="font-bold text-black text-xs font-mono uppercase">Q{idx + 1}: {mcq.question}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {mcq.options.map((opt, oIdx) => {
                                const isCorrect = opt === mcq.answer;
                                const isSelected = opt === selectedOpt;
                                
                                let optionStyle = "bg-white border-black text-black hover:bg-black hover:text-white";
                                if (showAnswer) {
                                  if (isCorrect) {
                                    optionStyle = "bg-neutral-200 border-black text-black font-bold";
                                  } else if (isSelected) {
                                    optionStyle = "bg-neutral-100 border-red-500 text-red-700 font-bold";
                                  } else {
                                    optionStyle = "bg-white border-black/10 text-neutral-400 opacity-40";
                                  }
                                } else {
                                  optionStyle = "bg-white border-black text-black hover:bg-black hover:text-white cursor-pointer";
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    disabled={!!selectedOpt}
                                    onClick={() => setSelectedMcqAnswers(prev => ({ ...prev, [idx]: opt }))}
                                    className={`px-3 py-2 rounded-lg border text-[11px] font-mono font-bold transition-all text-left flex items-center justify-between uppercase tracking-tight ${optionStyle}`}
                                  >
                                    <span>{opt}</span>
                                    {showAnswer && isCorrect && <span className="text-black font-bold ml-1">✓</span>}
                                    {showAnswer && isSelected && !isCorrect && <span className="text-red-600 font-bold ml-1">✗</span>}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex justify-between items-center pt-1">
                              {!selectedOpt ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedMcqAnswers(prev => ({ ...prev, [idx]: mcq.answer }))}
                                  className="text-[10px] font-bold text-black hover:underline font-mono uppercase cursor-pointer"
                                >
                                  Reveal Answer
                                </button>
                              ) : (
                                <p className="text-[10px] font-bold font-mono flex items-center gap-1 uppercase">
                                  {selectedOpt === mcq.answer ? (
                                    <span className="text-black">🎉 Correct! Well done.</span>
                                  ) : (
                                    <span className="text-red-700">Incorrect. Correct answer is: <strong className="font-bold">{mcq.answer}</strong></span>
                                  )}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                )}

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-neutral-200"></div>
                </div>

                {/* Broadcasting Options */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono">
                    Configure Broadcast Options
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="audience-select" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
                        <GraduationCap size={14} />
                        Target Class Audience
                      </label>
                      <select
                        id="audience-select"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="w-full px-3 py-2 border border-black rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black bg-white"
                      >
                        <option value="3rd Year CS Only">3rd Year CS Only</option>
                        <option value="All CSE Batches">All CSE Batches</option>
                        <option value="OS Lab Subgroup C">OS Lab Subgroup C</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider font-mono mb-2">
                        WhatsApp Dispatch Pipeline
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-50 border border-black text-black rounded-lg text-xs font-mono font-bold uppercase w-full">
                        <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                        n8n Webhook Active
                      </span>
                    </div>
                  </div>

                  <motion.button
                    id="broadcast-btn"
                    onClick={handleBroadcastSubmit}
                    disabled={broadcastMutation.isPending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-black hover:bg-neutral-50 text-white hover:text-black border border-black rounded-xl font-mono font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors duration-300"
                  >
                    {broadcastMutation.isPending ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    <span>Broadcast Study Deck via WhatsApp</span>
                  </motion.button>
                </div>

                {/* Broadcast Response */}
                <AnimatePresence>
                  {broadcastResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="p-4 bg-neutral-50 border border-black rounded-xl flex items-start gap-3 text-black text-xs" 
                      id="broadcast-success-toast"
                    >
                      <CheckCircle2 className="shrink-0 mt-0.5 text-black" size={16} />
                      <div>
                        <p className="font-bold font-mono uppercase">Broadcast Successful!</p>
                        <p className="mt-0.5 text-neutral-600">The structured study deck was pushed as a class WhatsApp bulletin.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="space-y-4 w-full">
                {flashcardMutation.isError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-50 border border-red-300 p-4 rounded-xl text-red-800 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="shrink-0 text-red-600 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <p className="font-bold uppercase font-mono">Generation Failed</p>
                      <p className="leading-relaxed">{flashcardMutation.error?.message || "An error occurred."}</p>
                    </div>
                  </motion.div>
                )}

                <motion.div 
                  key="empty-summary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-black p-12 text-center text-neutral-500 space-y-4 shadow-sm flex flex-col items-center justify-center h-full min-h-[300px] w-full"
                >
                  <Sparkles className="text-neutral-300" size={48} />
                  <div>
                    <h4 className="font-bold text-black text-sm font-mono uppercase tracking-wider">Study materials appear here</h4>
                    <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto font-sans">
                      Configure your class circular notes, task details, and click Generate. Gemini AI will yield precise study flashcards & an MCQ quiz.
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
