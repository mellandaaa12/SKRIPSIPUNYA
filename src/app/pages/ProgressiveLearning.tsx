"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { ProfileHeader } from "../components/ProfileHeader";
import { ChevronLeft, ChevronRight, BookOpen, FileText, Lock, CheckCircle, Loader, Code, Flame, Sparkles, Menu, LayoutDashboard, Activity as ActivityIcon, Star, ChevronDown, Lightbulb, XCircle, Play, RotateCcw, Eye, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getPembelajaran, getProgress, userAPI, updateProgress, checkRefleksi } from "../utils/api";
import { supabase } from "../utils/supabase";
import { RefleksiModal } from "../components/RefleksiModal";
import { customPopup } from "../context/PopupContext";
import { highlightCode } from "../utils/highlighter";

export default function ProgressiveLearning() {
  const navigate = useNavigate();
  const { pembelajaranId } = useParams();
  const { user, refreshUser } = useAuth();
  const [pembelajaran, setPembelajaran] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [showMateriModal, setShowMateriModal] = useState(false);
  const [hasReadMateri, setHasReadMateri] = useState<{ [key: string]: boolean }>({});
  
  // Reflection modal states
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [hasReflection, setHasReflection] = useState(false);
  
  // Quiz modal states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizStep, setQuizStep] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [hintPoints, setHintPoints] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>([]);
  const [filledBlanks, setFilledBlanks] = useState<string[]>([]);
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<any[]>([]);

  // Quiz preview mode state
  const [isQuizPreviewMode, setIsQuizPreviewMode] = useState(false);
  const [quizSubmittedAnswers, setQuizSubmittedAnswers] = useState<{ [key: number]: any }>({});

  // Code Editor modal states
  const [showCodeEditorModal, setShowCodeEditorModal] = useState(false);
  const [codeEditorStep, setCodeEditorStep] = useState<any>(null);
  const [studentCode, setStudentCode] = useState("");
  const [showCodePreview, setShowCodePreview] = useState(true);
  const [savingCode, setSavingCode] = useState(false);
  const [codeSubmitted, setCodeSubmitted] = useState(false);
  const [isCodePreviewMode, setIsCodePreviewMode] = useState(false);

  const codeIframeRef = useRef<HTMLIFrameElement>(null);

  // Force black color on materi content when modal opens
  useEffect(() => {
    if (showMateriModal) {
      setTimeout(() => {
        const wrapper = document.getElementById('materi-content-wrapper');
        if (wrapper) {
          const allElements = wrapper.querySelectorAll('*');
          allElements.forEach((el) => {
            (el as HTMLElement).style.color = '#000000';
          });
        }
      }, 100);
    }
  }, [showMateriModal]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "pembelajaran", label: "Pembelajaran", icon: ActivityIcon, path: "/pembelajaran" },
  ];

  useEffect(() => {
    if (pembelajaranId && user) {
      loadData();
    }
  }, [pembelajaranId, user?.id]);

  // Real-time synchronization for Progressive Learning
  useEffect(() => {
    if (!pembelajaranId || !user?.id) return;

    const channel = supabase
      .channel(`learning-sync-${pembelajaranId}-${user.id}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "pembelajaran", 
          filter: `id=eq.${pembelajaranId}` 
        },
        () => {
          console.log("🔄 Realtime: Pembelajaran updated, reloading...");
          void loadData();
        }
      )
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "progress", 
          filter: `user_id=eq.${user.id}` 
        },
        () => {
          // Hanya reload jika progress yang berubah adalah untuk pembelajaran ini
          // Kita filter di sisi client karena Supabase filter terbatas untuk join
          console.log("🔄 Realtime: Progress updated, reloading...");
          void loadData();
        }
      )
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "profiles", 
          filter: `id=eq.${user.id}` 
        },
        (payload: any) => {
          console.log("🔄 Realtime: Profile updated (EXP/Hint), updating state...");
          const updated = payload.new;
          setUserProfile((prev: any) => ({ ...prev, ...updated }));
          if (updated.hint_points !== undefined) setHintPoints(updated.hint_points);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pembelajaranId, user?.id]);

  const loadData = async () => {
    if (!pembelajaranId || !user) return;
    
    setLoading(true);
    try {
      const [pembelajaranData, progressData, profileData, reflectionData] = await Promise.all([
        getPembelajaran(pembelajaranId),
        getProgress(user.id),
        userAPI.getProfile(user.id),
        checkRefleksi(pembelajaranId)
      ]);
      
      // Check if pembelajaran exists
      if (!pembelajaranData) {
        setPembelajaran(null);
        setLoading(false);
        return;
      }
      
      // Check if pembelajaran is published (only filter if status exists)
      if (pembelajaranData.status && pembelajaranData.status !== "published") {
        setPembelajaran(null);
        setLoading(false);
        return;
      }
      
      setPembelajaran(pembelajaranData);
      setUserProfile(profileData?.user || null);
      
      // Find progress for this pembelajaran
      const thisProgress = progressData.find((p: any) => p.pembelajaranId === pembelajaranId);
      setProgress(thisProgress || { steps: {} });
      setHasReflection(reflectionData.hasRefleksi);
    } catch (error) {
      console.error("Failed to load data:", error);
      // Set pembelajaran to null on error
      setPembelajaran(null);
    } finally {
      setLoading(false);
    }
  };

  const isStepUnlocked = (stepIndex: number) => {
    if (stepIndex === 0) return true; // First step always unlocked
    
    if (!pembelajaran?.steps || !progress) return false;
    
    const prevStep = pembelajaran.steps[stepIndex - 1];
    if (!prevStep) return false;
    
    const prevStepProgress = progress.steps?.[prevStep.id];
    return prevStepProgress?.completed || false;
  };

  const isStepCompleted = (stepId: string) => {
    return progress?.steps?.[stepId]?.completed || false;
  };

  const handleOpenMateri = (step: any) => {
    setSelectedStep(step);
    setShowMateriModal(true);
  };

  const handleCloseMateriModal = () => {
    setShowMateriModal(false);
    setSelectedStep(null);
  };

  const handleMarkMateriAsRead = async (stepId: string) => {
    if (!pembelajaranId || !user) return;
    
    try {
      await updateProgress({
        pembelajaranId,
        stepId,
        answers: { read_materi: true }
      });
      
      setHasReadMateri(prev => ({ ...prev, [stepId]: true }));
      
      // Reload progress
      const progressData = await getProgress(user.id);
      const thisProgress = progressData.find((p: any) => p.pembelajaranId === pembelajaranId);
      setProgress(thisProgress || { steps: {} });
    } catch (error) {
      console.error("Failed to mark materi as read:", error);
    }
  };

  // Quiz modal handlers
  const handleOpenQuiz = async (step: any, isPreview = false, pastSubmittedAnswers?: any) => {
    if (!user) return;

    // Check if student has already passed this quiz
    const { data: progData } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('pembelajaran_id', pembelajaranId)
      .eq('step_id', step.id)
      .maybeSingle();

    const activePreview = isPreview || (progData && progData.completed && progData.score >= (step.content?.quiz?.nilaiMinimal || 75));
    setIsQuizPreviewMode(!!activePreview);
    
    const activeAnswers = pastSubmittedAnswers || progData?.answers?.submitted_answers || {};
    setQuizSubmittedAnswers(activeAnswers);
    
    setAttemptCount(progData?.answers?.attempts || 0);

    const { data: profile } = await supabase.from('profiles').select('hint_points').eq('id', user.id).single();
    setHintPoints(profile?.hint_points ?? 3);
    
    // Load quiz data
    const rawSoal = step.content?.quiz?.soalList || [];
    const adaptedQuestions = rawSoal.map((q: any) => {
      if (!q) return null;
      
      let questionText = "";
      let choices: string[] = [];
      let correctAnswerText = "";
      let helpText = q.bantuan || q.hint || "";
      let codeSnippet = q.code || "";
      let codeCommand = q.perintahCode || "";
      let type = q.quizType;

      if (q.pertanyaan) {
        questionText = q.pertanyaan;
        const choicesRaw = q.pilihan || [];
        choices = choicesRaw.map((p: any) => p.text || p);
        const correctVal = q.jawabanBenar; // "A", "B", "C", "D", "E"
        const correctIdx = (q.pilihan || []).findIndex((p: any, idx: number) => {
          const label = p.label || String.fromCharCode(65 + idx);
          return label === correctVal;
        });
        correctAnswerText = choices[correctIdx] || "";
      } else {
        questionText = q.question || "";
        choices = q.options || [];
        correctAnswerText = choices[q.correctAnswer] || "";
      }

      // Shuffle options (skip shuffling if in preview mode so choices align perfectly)
      const shuffled = choices.map(text => ({ text, isCorrect: text === correctAnswerText }));
      if (!activePreview) {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
      }

      // Heuristic for quizType if missing
      if (!type) {
        type = questionText.includes(".......") ? "melengkapi_code" : "pilihan_ganda";
      }

      return {
        question: questionText,
        options: shuffled.map(s => s.text),
        correctAnswer: shuffled.findIndex(s => s.isCorrect),
        hint: helpText,
        code: codeSnippet,
        perintahCode: codeCommand,
        quizType: type,
      };
    }).filter(Boolean);

    setQuizStep(step);
    setQuestions(adaptedQuestions);
    setCurrentQIdx(0);
    setFeedback(null);
    setCorrectCount(0);
    setShowResult(false);
    setScore(0);
    setShowHint(false);
    setWrongQuestions([]);
    
    // Initialize blanks/choices for the first question based on past answers or default
    const firstQ = adaptedQuestions[0];
    const pastAns = activeAnswers[0];
    
    if (activePreview && pastAns !== undefined) {
      if (firstQ.quizType === 'melengkapi_code') {
        setFilledBlanks(Array.isArray(pastAns) ? pastAns : []);
        setSelectedOptionIndices([]);
      } else {
        setSelectedOptionIndices(typeof pastAns === 'number' ? [pastAns] : []);
        setFilledBlanks([]);
      }
    } else {
      setSelectedOptionIndices([]);
      if (firstQ.quizType === 'melengkapi_code') {
        const blankCount = (firstQ.question.match(/\.\.\.\.\.\.\./g) || []).length;
        setFilledBlanks(Array(blankCount).fill(''));
      } else {
        setFilledBlanks([]);
      }
    }

    setShowHintConfirm(false);
    setShowQuizModal(true);
  };

  const handleNextQuestionPreview = (direction: 'next' | 'prev') => {
    const nextIdx = direction === 'next' ? currentQIdx + 1 : currentQIdx - 1;
    if (nextIdx >= 0 && nextIdx < questions.length) {
      setCurrentQIdx(nextIdx);
      const nextQ = questions[nextIdx];
      const pastAns = quizSubmittedAnswers[nextIdx];
      if (nextQ.quizType === 'melengkapi_code') {
        setFilledBlanks(Array.isArray(pastAns) ? pastAns : []);
        setSelectedOptionIndices([]);
      } else {
        setSelectedOptionIndices(typeof pastAns === 'number' ? [pastAns] : []);
        setFilledBlanks([]);
      }
    }
  };

  const handleOptionClick = (optionIndex: number) => {
    if (feedback !== null) return;
    
    const currentQ = questions[currentQIdx];
    const option = currentQ.options[optionIndex];
    
    if (currentQ.quizType === 'melengkapi_code') {
      if (selectedOptionIndices.includes(optionIndex)) {
        // Deselect
        const newSelected = selectedOptionIndices.filter(idx => idx !== optionIndex);
        const newFilled = [...filledBlanks];
        const filledIdx = newFilled.indexOf(option);
        if (filledIdx !== -1) newFilled[filledIdx] = '';
        setSelectedOptionIndices(newSelected);
        setFilledBlanks(newFilled);
      } else {
        // Select (fill the next empty blank)
        const blankIndex = filledBlanks.findIndex(blank => blank === '');
        if (blankIndex !== -1) {
          const newFilled = [...filledBlanks];
          newFilled[blankIndex] = option;
          setFilledBlanks(newFilled);
          setSelectedOptionIndices([...selectedOptionIndices, optionIndex]);
        }
      }
    } else {
      // Pilihan Ganda: just select the one clicked
      setSelectedOptionIndices([optionIndex]);
      setFilledBlanks([option]);
    }
  };

  const handleBlankClick = (blankIndex: number) => {
    if (feedback !== null) return;
    const optionToRemove = filledBlanks[blankIndex];
    if (!optionToRemove) return;

    const newFilled = [...filledBlanks];
    newFilled[blankIndex] = '';
    setFilledBlanks(newFilled);

    const currentQ = questions[currentQIdx];
    const optionIdx = currentQ.options.indexOf(optionToRemove);
    if (optionIdx !== -1) {
      setSelectedOptionIndices(prev => prev.filter(idx => idx !== optionIdx));
    }
  };

  const handleCheckAnswer = async () => {
    const currentQ = questions[currentQIdx];
    
    let isCorrect = false;
    let userAnswer = "";
    let correctAnswer = "";

    if (currentQ.quizType === 'melengkapi_code') {
      if (filledBlanks.length === 0 || filledBlanks.some(blank => blank === '')) return;
      correctAnswer = currentQ.options[currentQ.correctAnswer];
      userAnswer = filledBlanks.join(' ');
      
      if (userAnswer === correctAnswer) {
        isCorrect = true;
      }
    } else {
      // Pilihan Ganda
      if (selectedOptionIndices.length === 0) return;
      const selectedIdx = selectedOptionIndices[0];
      userAnswer = currentQ.options[selectedIdx];
      correctAnswer = currentQ.options[currentQ.correctAnswer];
      if (selectedIdx === currentQ.correctAnswer) {
        isCorrect = true;
      }
    }

    const nextCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    const nextWrongQuestions = isCorrect 
      ? wrongQuestions 
      : [...wrongQuestions, { question: currentQ.question, selected: userAnswer, correct: correctAnswer }];

    setCorrectCount(nextCorrectCount);
    setWrongQuestions(nextWrongQuestions);

    const currentQAns = currentQ.quizType === 'melengkapi_code' ? [...filledBlanks] : (selectedOptionIndices.length > 0 ? selectedOptionIndices[0] : null);
    const nextSubmittedAnswers = {
      ...quizSubmittedAnswers,
      [currentQIdx]: currentQAns
    };
    setQuizSubmittedAnswers(nextSubmittedAnswers);

    // Immediately go to next question or submit
    if (currentQIdx < questions.length - 1) {
      const nextIdx = currentQIdx + 1;
      const nextQ = questions[nextIdx];
      setCurrentQIdx(nextIdx);
      setFeedback(null);
      setShowHint(false);
      setShowHintConfirm(false);
      setSelectedOptionIndices([]);
      
      // Initialize blanks correctly for the next question
      if (nextQ.quizType === 'melengkapi_code') {
        const blankCount = (nextQ.question.match(/\.\.\.\.\.\.\./g) || []).length;
        setFilledBlanks(Array(blankCount).fill(''));
      } else {
        setFilledBlanks([]);
      }
    } else {
      await handleSubmitQuiz(nextCorrectCount, nextWrongQuestions, nextSubmittedAnswers);
    }
  };

  const handleUseHint = async () => {
    if (!user || hintPoints <= 0 || showHint) return;
    
    try {
      const newHintPoints = hintPoints - 1;
      setHintPoints(newHintPoints);
      setShowHint(true);
      
      await supabase.from('profiles').update({ hint_points: newHintPoints }).eq('id', user.id);
    } catch (error) {
      console.error("Failed to use hint:", error);
    }
  };

  const handleNextOrSubmit = async () => {
    // Deprecated in favor of direct handleCheckAnswer flow
  };

  const handleSubmitQuiz = async (finalCorrectCount?: number, finalWrongQuestions?: any[], finalSubmittedAnswers?: any) => {
    if (!quizStep || !pembelajaranId || !user) return;
    try {
      const actualCorrectCount = typeof finalCorrectCount === 'number' ? finalCorrectCount : correctCount;
      const actualWrongQuestions = finalWrongQuestions || wrongQuestions;
      const actualSubmittedAnswers = finalSubmittedAnswers || quizSubmittedAnswers;

      const total = questions.length || 1;
      const finalScore = Math.round((actualCorrectCount / total) * 100);
      setScore(finalScore);
      setShowResult(true);

      const passingScore = quizStep.content?.quiz?.nilaiMinimal || 75;
      const passed = finalScore >= passingScore;

      const nextAttempts = attemptCount + 1;

      await updateProgress({
        pembelajaranId,
        stepId: quizStep.id,
        score: finalScore,
        completed: passed,
        answers: {
          quiz_done: true,
          read_materi: true,
          attempts: nextAttempts,
          wrong_questions: actualWrongQuestions,
          submitted_answers: actualSubmittedAnswers,
        },
      });

      setAttemptCount(nextAttempts);
      
      // Show warning pop-up if failed to meet target score
      if (!passed) {
        customPopup.alert("Ulangi sekali lagi ya, kamu belum memenuhi nilai nya.", "error");
      }
      
      // Gamification: Update EXP & Streak only if passed
      if (passed) {
        const { data: profile } = await supabase.from('profiles').select('hint_points, exp, streak, last_streak_date').eq('id', user.id).single();
        if (profile) {
          const newExp = (profile.exp || 0) + Math.round((finalScore / 100) * 50);
          const today = new Date().toISOString().split('T')[0];
          const wasStreakToday = profile.last_streak_date === today;
          const newStreak = wasStreakToday ? (profile.streak || 0) : (profile.streak || 0) + 1;
          
          // Bonus hint point only on first try
          const firstTryBonus = nextAttempts === 1 ? 1 : 0;
          const newHints = Math.min((profile.hint_points || 0) + firstTryBonus, 10);
          
          await supabase.from('profiles').update({
            exp: newExp,
            streak: newStreak,
            hint_points: newHints,
            last_streak_date: today
          }).eq('id', user.id);
          
          if (setUserProfile) setUserProfile({ ...profile, exp: newExp, streak: newStreak, hint_points: newHints, last_streak_date: today });
          if (refreshUser) await refreshUser();
        }
      }

      // Reload progress
      const progressData = await getProgress(user.id);
      const thisProgress = progressData.find((p: any) => p.pembelajaranId === pembelajaranId);
      setProgress(thisProgress || { steps: {} });
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    }
  };

  const handleCloseQuizModal = () => {
    // Only allow closing after quiz is completed
    if (showResult) {
      setShowQuizModal(false);
      setQuizStep(null);
      setQuestions([]);
      setCurrentQIdx(0);
      setFeedback(null);
      setCorrectCount(0);
      setShowResult(false);
      setScore(0);
      setSelectedOptionIndices([]);
      setFilledBlanks([]);
      setShowHintConfirm(false);
    }
  };

  // Code Editor Modal handlers
  const handleOpenCodeEditor = async (step: any) => {
    if (!user || !pembelajaranId) return;
    
    // Load existing progress to get previously submitted code
    const { data: existingProgress } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('pembelajaran_id', pembelajaranId)
      .eq('step_id', step.id)
      .maybeSingle();
    
    const passingScore = step.content?.nilaiMinimalTugas || 75;
    const hasPassed = existingProgress && existingProgress.completed && (existingProgress.score >= passingScore);
    
    setIsCodePreviewMode(!!hasPassed);
    setCodeEditorStep(step);
    setStudentCode(existingProgress?.answers?.submitted_code || "");
    setCodeSubmitted(!!existingProgress?.answers?.code_submitted);
    setShowCodeEditorModal(true);
  };

  const handleCloseCodeEditorModal = () => {
    setShowCodeEditorModal(false);
    setCodeEditorStep(null);
    setStudentCode("");
    setCodeSubmitted(false);
    setIsCodePreviewMode(false);
  };

  const handleSubmitCode = async () => {
    if (!codeEditorStep || !pembelajaranId || !user) return;
    setSavingCode(true);
    try {
      const score = studentCode.trim().length > 30 ? 80 : 40;
      const requiredChecks: string[] = codeEditorStep.content?.requiredChecks || [];
      let finalScore = score;
      if (requiredChecks.length > 0) {
        const passedChecks = requiredChecks.filter((needle: string) => studentCode.includes(needle)).length;
        finalScore = Math.round((passedChecks / requiredChecks.length) * 100);
      }
      
      const passed = finalScore >= (codeEditorStep.content?.nilaiMinimalTugas || 75);
      
      await updateProgress({
        pembelajaranId,
        stepId: codeEditorStep.id,
        completed: passed,
        score: finalScore,
        answers: {
          code_submitted: true,
          submitted_code: studentCode,
          read_materi: true,
        }
      });
      
      setCodeSubmitted(true);

      if (!passed) {
        customPopup.alert("Ulangi sekali lagi ya, kamu belum memenuhi nilai nya.", "error");
      }
      
      // Gamification: Update EXP only if passed
      if (passed) {
        const { data: profile } = await supabase.from('profiles').select('exp, streak, last_streak_date').eq('id', user.id).single();
        if (profile) {
          const newExp = (profile.exp || 0) + 50; // Flat 50 EXP for code submission
          const today = new Date().toISOString().split('T')[0];
          const wasStreakToday = profile.last_streak_date === today;
          const newStreak = wasStreakToday ? (profile.streak || 0) : (profile.streak || 0) + 1;
          
          await supabase.from('profiles').update({
            exp: newExp,
            streak: newStreak,
            last_streak_date: today
          }).eq('id', user.id);
          
          if (setUserProfile) setUserProfile({ ...profile, exp: newExp, streak: newStreak, last_streak_date: today });
          if (refreshUser) await refreshUser();
        }
      }

      // Reload progress
      const progressData = await getProgress(user.id);
      const thisProgress = progressData.find((p: any) => p.pembelajaranId === pembelajaranId);
      setProgress(thisProgress || { steps: {} });
      
      if (passed) {
        setTimeout(() => handleCloseCodeEditorModal(), 1500);
      }
    } catch (error) {
      console.error("Failed to submit code:", error);
    } finally {
      setSavingCode(false);
    }
  };

  // VS Code-style HTML syntax highlighting (token-based to avoid cascading regex issues)
  const highlightHTML = (code: string): string => {
    return highlightCode(code);
  };

  const completedSteps = pembelajaran?.steps?.filter((s: any) => isStepCompleted(s.id)).length || 0;
  const totalSteps = pembelajaran?.steps?.length || 0;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Trigger reflection modal automatically if completed and has not reflected
  useEffect(() => {
    if (
      pembelajaran &&
      progressPercentage === 100 &&
      pembelajaran.enableReflection &&
      !hasReflection &&
      !showReflectionModal &&
      !showMateriModal &&
      !showCodeEditorModal &&
      !showQuizModal &&
      !showHintConfirm
    ) {
      // Small delay to allow any success animations to finish
      const timer = setTimeout(() => {
        setShowReflectionModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    progressPercentage, 
    pembelajaran,
    hasReflection, 
    showReflectionModal,
    showMateriModal,
    showCodeEditorModal,
    showQuizModal,
    showHintConfirm
  ]);

  if (loading) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        {/* Decorative background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#0077B6]/40 blur-3xl" />
          <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#0077B6]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
        </div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-[#0077B6] animate-spin" />
            <p className="text-sm text-[#64748B]">Memuat pembelajaran...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pembelajaran) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
        {/* Decorative background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#0077B6]/40 blur-3xl" />
          <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#0077B6]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
        </div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)] flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-[#94A3B8] mb-1">Pembelajaran tidak ditemukan</p>
            <button
              onClick={() => navigate('/pembelajaran')}
              className="text-sm text-[#0077B6] hover:underline"
            >
              Kembali ke Pembelajaran
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent", backgroundAttachment: "fixed" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
        .materi-content {
          color: #000000 !important;
          font-size: 14px;
          line-height: 1.75;
        }
        .materi-content * {
          color: #000000 !important;
        }
        .materi-content *[style] {
          color: #000000 !important;
        }
        .materi-content p,
        .materi-content span,
        .materi-content div:not([class*="bg-"]),
        .materi-content li,
        .materi-content td,
        .materi-content th,
        .materi-content h1,
        .materi-content h2,
        .materi-content h3,
        .materi-content h4,
        .materi-content h5,
        .materi-content h6 {
          color: #000000 !important;
        }
        .materi-content strong,
        .materi-content b {
          color: #000000 !important;
        }
        .materi-content em,
        .materi-content i {
          color: #000000 !important;
        }
        .materi-content a {
          color: #0077B6 !important;
        }
        .materi-content code {
          color: #000000 !important;
          background-color: #F1F5F9;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .materi-content pre {
          color: #000000 !important;
          background-color: #F8FAFC;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
        }
        .materi-content pre code {
          background-color: transparent;
          padding: 0;
        }
        .materi-content blockquote {
          color: #000000 !important;
          border-left: 4px solid #E2E8F0;
          padding-left: 16px;
          margin-left: 0;
        }
        .materi-content ul,
        .materi-content ol {
          color: #000000 !important;
        }
        .materi-content li {
          color: #000000 !important;
        }
        .materi-content table {
          color: #000000 !important;
        }
        .materi-content td,
        .materi-content th {
          color: #000000 !important;
          border-color: #E2E8F0;
        }
      `}</style>
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-[#0077B6]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 rounded-full bg-[#0077B6]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-[#90E0EF]/30 blur-3xl" />
      </div>

      {/* Mobile: floating menu button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#90E0EF] px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md bg-white/70 text-[#0077B6] hover:bg-white transition-all duration-200 lg:hidden"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed left-4 top-4 h-[calc(100%-2rem)] w-[min(20rem,88vw)] overflow-y-auto rounded-[2rem] border border-[#90E0EF]/30 bg-white/75 backdrop-blur-16 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl p-3 text-left text-sm font-medium text-[#0077B6] hover:bg-white/60"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <SideBarMurid />

      {/* Main Content */}
      <main className="ml-0 lg:ml-80 min-h-screen relative">
        <div className="px-4 py-6 max-w-7xl mx-auto lg:px-8 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
            {/* Left - Detail Pembelajaran Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
              <Sparkles className="h-4 w-4 text-[#0077B6]" />
              <span className="text-sm font-semibold text-[#0077B6]">Detail Pembelajaran</span>
            </div>

            {/* Right - EXP, Streak & User Profile */}
            <div className="flex items-center gap-3">
              {/* EXP Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
                <Star className="h-4 w-4 text-[#F59E0B]" />
                <span className="text-sm font-semibold text-[#0077B6]">{userProfile?.exp || user?.exp || 0} EXP</span>
              </div>

              {/* Streak Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-[2rem] bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.1)]">
                <Flame className="h-4 w-4 text-[#EF4444]" />
                <span className="text-sm font-semibold text-[#0077B6]">{userProfile?.streak || user?.streak || 0} Streak</span>
              </div>

              <ProfileHeader />
            </div>
          </div>

          {/* Back Button */}
          <div className="mb-6 animate-slideIn">
            <button
              onClick={() => navigate("/pembelajaran")}
              className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0077B6] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Kembali ke Pembelajaran
            </button>
          </div>

          {/* Title Card */}
          <div className="mb-8 animate-slideIn">
            <div className="bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[2.5rem] p-10 shadow-[0_8px_32px_-4px_rgba(0,119,182,0.15)] text-white">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div 
                  className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 bg-white/20 backdrop-blur-md"
                >
                  <BookOpen className="w-8 h-8 text-white" />
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-3">
                    {pembelajaran.title}
                  </h1>
                  <p className="text-base text-blue-100 mb-6">
                    {pembelajaran.description}
                  </p>

                  {/* Progress */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-[400px]">
                      <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-white"
                        />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {completedSteps} / {totalSteps} Selesai ({progressPercentage}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="animate-scaleIn">
            {pembelajaran.steps?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-[#CBD5E1]" />
                </div>
                <p className="text-sm font-medium text-[#94A3B8]">Belum ada materi</p>
              </div>
            ) : (
              <div className="space-y-5">
                {(pembelajaran.steps || []).map((step: any, index: number) => {
                  const unlocked = isStepUnlocked(index);
                  const completed = isStepCompleted(step.id);
                  const hasMateri = !!step.content?.bacaMateri;
                  const hasQuiz = !!(step.content?.quiz?.aktif);
                  const hasCode = !!(step.content?.initialCode || step.content?.taskInstructions);
                  const materiRead = hasReadMateri[step.id] || progress?.steps?.[step.id]?.answers?.read_materi;
                  const stepProgress = progress?.steps?.[step.id];
                  const isQuizPassed = stepProgress?.completed && stepProgress.score >= (step.content?.quiz?.nilaiMinimal || 75);
                  const stepThemes = [
                    { name: "Ocean", main: "#0077B6", light: "#CAF0F8", border: "#90E0EF", text: "#0077B6", shadow: "rgba(0, 119, 182, 0.15)" },
                    { name: "Sky", main: "#00B4D8", light: "#E0F2FE", border: "#7DD3FC", text: "#0369A1", shadow: "rgba(0, 180, 216, 0.15)" },
                    { name: "Cyan", main: "#0891B2", light: "#ECFEFF", border: "#67E8F9", text: "#0E7490", shadow: "rgba(8, 145, 178, 0.15)" },
                    { name: "Azure", main: "#0284C7", light: "#F0F9FF", border: "#7DD3FC", text: "#0369A1", shadow: "rgba(2, 132, 199, 0.15)" },
                    { name: "Indigo", main: "#4F46E5", light: "#EEF2FF", border: "#A5B4FC", text: "#4338CA", shadow: "rgba(79, 70, 229, 0.15)" },
                  ];
                  const theme = stepThemes[index % stepThemes.length];

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`group relative overflow-hidden rounded-[2rem] p-6 transition-all duration-300 border-2 ${
                        unlocked 
                          ? "bg-white border-white/60 shadow-sm hover:border-dashed hover:shadow-xl" 
                          : "bg-white/50 border-transparent opacity-50 cursor-not-allowed"
                      }`}
                      onMouseEnter={(e) => {
                        if (unlocked) {
                          e.currentTarget.style.borderColor = theme.main;
                          e.currentTarget.style.boxShadow = `0 12px 32px -4px ${theme.shadow}`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (unlocked) {
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                          e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                        }
                      }}
                    >


                      <div className="flex items-center gap-5 relative z-10">
                        {/* Number & Icon */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 shadow-sm"
                            style={{ 
                              background: completed 
                                ? "linear-gradient(135deg, #10B981 0%, #34D399 100%)" 
                                : unlocked 
                                  ? `linear-gradient(135deg, ${theme.main} 0%, ${theme.border} 100%)`
                                  : "#E2E8F0"
                            }}
                          >
                            {completed ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : unlocked ? (
                              <span className="text-white font-bold text-lg">{index + 1}</span>
                            ) : (
                              <Lock className="w-6 h-6 text-[#94A3B8]" />
                            )}
                          </div>

                          <div className={`p-2.5 rounded-2xl transition-colors duration-300 ${unlocked ? "bg-white/70" : "bg-[#F1F5F9]"} group-hover:bg-white shadow-sm`}
                            style={unlocked ? { color: theme.main } : { color: "#94A3B8" }}
                          >
                            {step.content?.bacaMateri ? (
                              <BookOpen className="w-6 h-6" />
                            ) : step.content?.initialCode ? (
                              <Code className="w-6 h-6" />
                            ) : (
                              <FileText className="w-6 h-6" />
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg mb-0.5 transition-colors duration-300 ${
                            unlocked ? "text-[#0077B6]" : "text-[#94A3B8]"
                          }`}
                          style={unlocked ? { "--hover-color": theme.text } : {} as any}
                          >
                            <span className="group-hover:text-[var(--hover-color)] transition-colors duration-300">
                              {step.judul || step.title}
                            </span>
                          </h3>
                          
                          <p className={`text-sm line-clamp-1 transition-colors duration-300 ${
                            unlocked ? "text-[#64748B]" : "text-[#94A3B8]"
                          }`}>
                            {step.deskripsi || step.description}
                          </p>
                        </div>

                        {/* Chevron Down Toggle */}
                        {unlocked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedStep(expandedStep === step.id ? null : step.id);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-[#686868] hover:bg-[#F8FAFC] rounded-full"
                          >
                            <ChevronDown className={`w-5 h-5 transition-transform ${expandedStep === step.id ? "rotate-180" : ""}`} />
                          </button>
                        )}

                        {/* Status */}
                        {!unlocked && (
                          <div className="flex items-center gap-2 text-[#94A3B8]">
                            <Lock className="w-4 h-4" />
                            <span className="text-xs">Terkunci</span>
                          </div>
                        )}
                      </div>

                      {/* Dropdown Content */}
                      {expandedStep === step.id && unlocked && (
                        <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                          <div className="flex gap-3">
                            {/* Materi Button */}
                            {hasMateri ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenMateri(step);
                                }}
                                className="flex-1 bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-[2rem] p-4 flex items-center gap-3 hover:opacity-90 transition-all"
                              >
                                <span className="text-lg">📖</span>
                                <div className="flex-1 text-left">
                                  <p className="font-semibold text-sm text-white">Baca Materi</p>
                                  <p className="text-xs text-white/80">{materiRead ? "Sudah dibaca" : "Belum dibaca"}</p>
                                </div>
                              </button>
                            ) : (
                              <button
                                disabled
                                className="flex-1 bg-[#E2E8F0] rounded-[2rem] p-4 flex items-center gap-3 opacity-50"
                              >
                                <span className="text-lg">📖</span>
                                <div className="flex-1 text-left">
                                  <p className="font-semibold text-sm text-[#94A3B8]">Materi tidak tersedia</p>
                                </div>
                              </button>
                            )}

                            {/* Code Editor Button */}
                            {hasCode ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCodeEditor(step);
                                }}
                                className="flex-1 bg-gradient-to-r from-[#4A3B69] to-[#6C5B8B] rounded-[2rem] p-4 flex items-center gap-3 hover:opacity-90 transition-all"
                              >
                                <span className="text-lg">💻</span>
                                <div className="flex-1 text-left">
                                  <p className="font-semibold text-sm text-white">Code Editor</p>
                                  <p className="text-xs text-white/80">Tugas coding</p>
                                </div>
                              </button>
                            ) : null}

                            {/* Quiz Button */}
                            {hasQuiz ? (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!materiRead) {
                                    customPopup.alert("Baca materi terlebih dahulu sebelum mengerjakan quiz!", "warning");
                                    return;
                                  }

                                  // Check if student has already passed this quiz
                                  if (user) {
                                    const { data: existingProgress } = await supabase
                                      .from('progress')
                                      .select('*')
                                      .eq('user_id', user.id)
                                      .eq('pembelajaran_id', pembelajaranId)
                                      .eq('step_id', step.id)
                                      .maybeSingle();

                                    if (existingProgress && existingProgress.completed) {
                                      const passingScore = step.content?.quiz?.nilaiMinimal || 75;
                                      if (existingProgress.score >= passingScore) {
                                        handleOpenQuiz(step, true, existingProgress.answers?.submitted_answers);
                                        return;
                                      }
                                    }
                                  }

                                  handleOpenQuiz(step);
                                }}
                                disabled={!materiRead}
                                className={`flex-1 rounded-[2rem] p-4 flex items-center gap-3 transition-all ${
                                  isQuizPassed
                                    ? "bg-gradient-to-r from-[#10B981] to-[#34D399] hover:opacity-90"
                                    : materiRead
                                      ? "bg-gradient-to-r from-[#10B981] to-[#34D399] hover:opacity-90"
                                      : "bg-[#E2E8F0] opacity-50 cursor-not-allowed"
                                }`}
                              >
                                <span className="text-lg">{isQuizPassed ? "✅" : "📝"}</span>
                                <div className="flex-1 text-left">
                                  <p className="font-semibold text-sm text-white">
                                    {isQuizPassed ? "Quiz Selesai" : "Quiz"}
                                  </p>
                                  <p className="text-xs text-white/80">
                                    {isQuizPassed 
                                      ? `Nilai: ${stepProgress.score} (Lulus)`
                                      : `${step.content?.quiz?.soalList?.length || 0} soal`
                                    }
                                  </p>
                                </div>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Materi Modal */}
      {showMateriModal && selectedStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6">
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md" onClick={handleCloseMateriModal} />
          <div className="relative bg-white rounded-[2rem] w-[95vw] md:w-[95vw] max-w-[1600px] h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center gap-3 p-6 border-b border-[#CAF0F8]">
              <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#0077B6] to-[#00B4D8] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0077B6]">{selectedStep.judul || selectedStep.title}</h2>
                <p className="text-sm text-[#64748B]">Baca materi untuk membuka quiz</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
              <div 
                id="materi-content-wrapper"
                className="materi-content prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedStep.content?.bacaMateri || "<p>Konten tidak tersedia</p>" }}
              />
              <style>{`
                .materi-content table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 1rem 0;
                  border: 1px solid #e2e8f0;
                }
                .materi-content th, .materi-content td {
                  border: 1px solid #e2e8f0;
                  padding: 8px 12px;
                  text-align: left;
                }
                .materi-content th {
                  background-color: #f8fafc;
                  font-weight: bold;
                }
                .materi-content pre {
                  background: #1e293b;
                  color: #e2e8f0;
                  padding: 1rem;
                  border-radius: 0.5rem;
                  overflow-x: auto;
                }
                .materi-content code {
                  background: #f1f5f9;
                  padding: 0.2rem 0.4rem;
                  border-radius: 0.25rem;
                  font-size: 0.9em;
                }
                .materi-content pre code {
                  background: none;
                  padding: 0;
                  color: inherit;
                }
              `}</style>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-center p-6 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <button
                onClick={() => {
                  handleMarkMateriAsRead(selectedStep.id);
                  handleCloseMateriModal();
                }}
                className="px-8 py-3.5 rounded-[2rem] text-sm font-bold bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white hover:opacity-90 shadow-lg shadow-[rgba(0,119,182,0.2)] transition-all"
              >
                Lanjut Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal - Duolingo Style */}
      {showQuizModal && quizStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6">
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md" onClick={handleCloseQuizModal} />
          <div className="relative bg-white rounded-[2rem] w-[95vw] md:w-[95vw] max-w-[1600px] h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">
            {!showResult ? (
              <div className="flex flex-col h-full">
                {/* Preview Banner */}
                {isQuizPreviewMode && (
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 shadow-inner">
                    <span>👁️</span>
                    <span>Anda sedang melihat pratinjau jawaban Anda yang telah disimpan. Gunakan tombol panah di bawah untuk berpindah soal.</span>
                  </div>
                )}

                {/* Top Progress Bar with Arrows */}
                <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                  {isQuizPreviewMode ? (
                    <>
                      <button 
                        onClick={() => handleNextQuestionPreview('prev')} 
                        disabled={currentQIdx === 0} 
                        className="w-10 h-10 rounded-full border-2 border-[#CAF0F8] flex items-center justify-center text-[#94A3B8] hover:border-[#0077B6] hover:text-[#0077B6] transition-all disabled:opacity-30"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex-1 h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }} className="h-full bg-gradient-to-r from-[#0077B6] to-[#00B4D8] rounded-full transition-all" />
                      </div>
                      <button 
                        onClick={() => handleNextQuestionPreview('next')} 
                        disabled={currentQIdx === questions.length - 1} 
                        className="w-10 h-10 rounded-full border-2 border-[#CAF0F8] flex items-center justify-center text-[#94A3B8] hover:border-[#0077B6] hover:text-[#0077B6] transition-all disabled:opacity-30"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => currentQIdx > 0 && !feedback && (setCurrentQIdx(currentQIdx - 1), setFeedback(null), setShowHint(false), setSelectedOptionIndices([]), setFilledBlanks(['']))} disabled={currentQIdx === 0} className="w-10 h-10 rounded-full border-2 border-[#CAF0F8] flex items-center justify-center text-[#94A3B8] hover:border-[#0077B6] hover:text-[#0077B6] transition-all disabled:opacity-30">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex-1 h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }} className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all" />
                      </div>
                      <button disabled className="w-10 h-10 rounded-full border-2 border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] opacity-30">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-10 pb-4 custom-scrollbar">
                  {/* Question Number + Text */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{currentQIdx + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#0077B6] leading-snug">{questions[currentQIdx]?.question}</h3>
                      <p className="text-sm text-[#64748B] mt-1">Perhatikan soal dan pilih jawaban yang tepat.</p>
                    </div>
                  </div>

                  {/* VS Code-style Code Example Block */}
                  {(questions[currentQIdx]?.code || quizStep.content?.taskExample) && (
                    <div className="mb-6 rounded-2xl overflow-hidden border border-[#334155] shadow-lg">
                      <div className="bg-[#1E293B] px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
                          <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                          <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                        </div>
                        <span className="text-[#94A3B8] text-xs font-semibold tracking-wider uppercase">index.html</span>
                      </div>
                      <div className="bg-[#0F172A] px-6 py-6">
                        <pre className="font-mono text-base leading-relaxed text-[#E2E8F0] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlightHTML(questions[currentQIdx]?.code || quizStep.content.taskExample) }} />
                      </div>
                      {questions[currentQIdx]?.perintahCode && (
                        <div className="bg-[#F0F9FF] px-6 py-4 border-t border-[#BAE6FD] flex items-start gap-3">
                           <div className="w-6 h-6 rounded-full bg-[#0077B6] flex items-center justify-center flex-shrink-0 mt-0.5">
                             <Sparkles className="w-3.5 h-3.5 text-white" />
                           </div>
                           <p className="text-sm font-bold text-[#0369A1]">{questions[currentQIdx].perintahCode}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Butuh Petunjuk? Pill */}
                  {!isQuizPreviewMode && (
                    <div className="mb-5 flex items-center justify-between">
                      <button 
                        onClick={() => setShowHintConfirm(true)} 
                        disabled={hintPoints <= 0 || showHint || feedback !== null} 
                        className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-full border-2 text-sm font-semibold tracking-wide transition-all ${hintPoints > 0 && !showHint && !feedback ? 'border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10' : 'border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'}`}
                      >
                        <Lightbulb className="w-4 h-4" />
                        Butuh Petunjuk?
                      </button>
                      
                      <div className="flex items-center gap-2 px-4 py-2 bg-[#FEF9C3] rounded-full border border-[#FDE68A]">
                        <Sparkles className="w-4 h-4 text-[#CA8A04]" />
                        <span className="text-xs font-bold text-[#854D0E]">{hintPoints} Poin</span>
                      </div>
                    </div>
                  )}

                  {/* Hint Display */}
                  {!isQuizPreviewMode && showHint && questions[currentQIdx]?.hint && (
                    <div className="mb-5 rounded-2xl overflow-hidden border-2 border-[#F59E0B] animate-fadeIn" style={{ background: 'linear-gradient(180deg, #FEF3C7, #FDE68A)' }}>
                      <div className="p-5 flex gap-3">
                        <Lightbulb className="w-6 h-6 text-[#92400E] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-[#92400E] mb-1">Petunjuk</p>
                          <p className="text-sm text-[#92400E]">{questions[currentQIdx].hint}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Content based on Type */}
                  <div className="mt-4">
                    {questions[currentQIdx].quizType === 'melengkapi_code' ? (
                      /* Fill in the Blanks UI */
                      <div className="space-y-8">
                        <div className="bg-[#1E293B] rounded-t-2xl px-5 py-3 mb-0">
                          <span className="text-[#94A3B8] text-xs font-semibold tracking-[0.15em] uppercase">Lengkapi Bagian Kosong:</span>
                        </div>
                        <div className="bg-[#0F172A] rounded-b-2xl px-5 py-6 mb-6">
                          <div className="flex flex-wrap items-center gap-3 justify-center">
                            {questions[currentQIdx].question.split('.......').map((part: string, i: number, arr: any[]) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-lg font-mono text-[#E2E8F0]">{part}</span>
                                {i < arr.length - 1 && (
                                  <button
                                    onClick={() => !isQuizPreviewMode && handleBlankClick(i)}
                                    disabled={isQuizPreviewMode}
                                    className={`min-w-[100px] h-10 px-4 rounded-lg border-2 border-dashed flex items-center justify-center transition-all font-mono text-sm ${
                                      isQuizPreviewMode ? 'bg-[#334155] border-[#00B4D8] text-[#00B4D8] font-bold' :
                                      feedback === 'correct' ? 'bg-[#D1FAE5] border-[#10B981] text-[#065F46] font-bold' :
                                      feedback === 'wrong' ? 'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] font-bold' :
                                      filledBlanks[i] ? 'bg-[#334155] border-[#67E8F9] text-[#67E8F9] font-bold' :
                                      'border-[#475569] text-[#475569] hover:border-[#64748B]'
                                    }`}
                                  >
                                    {filledBlanks[i] || "___"}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tiles */}
                        <div className="flex flex-wrap justify-center gap-3">
                          {questions[currentQIdx].options.map((option: string, idx: number) => {
                            const isSelected = selectedOptionIndices.includes(idx);
                            return (
                              <button
                                key={idx}
                                onClick={() => !isQuizPreviewMode && handleOptionClick(idx)}
                                disabled={isQuizPreviewMode || feedback !== null || (isSelected && filledBlanks.every(b => b !== option))}
                                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                                  isSelected
                                    ? "bg-[#CAF0F8] text-[#0077B6] cursor-not-allowed scale-95"
                                    : "bg-white border-2 border-[#CAF0F8] text-[#0077B6] hover:border-[#0077B6] hover:-translate-y-1 hover:shadow-md active:scale-95"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Pilihan Ganda UI */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {questions[currentQIdx].options.map((option: string, idx: number) => {
                          const isSelected = selectedOptionIndices.includes(idx);
                          const isCorrect = idx === questions[currentQIdx].correctAnswer;
                          
                          let bgClass = "bg-white border-[#CAF0F8]";
                          let textClass = "text-[#0077B6]";
                          let icon = null;

                          if (isQuizPreviewMode) {
                            if (isSelected) {
                              bgClass = "bg-[#CAF0F8] border-[#0077B6] ring-2 ring-[#0077B6]";
                              textClass = "text-[#0077B6] font-bold";
                            }
                          } else if (feedback === 'correct' && isCorrect) {
                            bgClass = "bg-[#D1FAE5] border-[#10B981] ring-2 ring-[#10B981]";
                            textClass = "text-[#065F46]";
                            icon = <CheckCircle className="w-5 h-5" />;
                          } else if (feedback === 'wrong') {
                            if (isSelected) {
                              bgClass = "bg-[#FEE2E2] border-[#EF4444]";
                              textClass = "text-[#991B1B]";
                              icon = <XCircle className="w-5 h-5" />;
                            } else if (isCorrect) {
                              bgClass = "bg-[#D1FAE5] border-[#10B981]";
                              textClass = "text-[#065F46]";
                            }
                          } else if (isSelected) {
                            bgClass = "bg-[#CAF0F8] border-[#0077B6] ring-2 ring-[#0077B6]";
                            textClass = "text-[#0077B6]";
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (isQuizPreviewMode || feedback) return;
                                setSelectedOptionIndices([idx]);
                                setFilledBlanks([option]);
                              }}
                              disabled={isQuizPreviewMode}
                              className={`group p-5 rounded-[2rem] border-2 text-left transition-all relative flex items-center justify-between ${bgClass} ${isQuizPreviewMode || feedback ? '' : 'hover:border-[#00B4D8] hover:shadow-lg'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-[#0077B6] text-white' : 'bg-[#CAF0F8] text-[#64748B]'}`}>
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <span className={`font-semibold ${textClass}`}>{option}</span>
                              </div>
                              {icon}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
 
                {/* Footer with Action Button */}
                {isQuizPreviewMode ? (
                  <div className="p-6 md:p-8 border-t border-[#E2E8F0] bg-slate-50 flex justify-between items-center w-full px-12">
                    <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      👁️ Mode Peninjauan Jawaban
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleNextQuestionPreview('prev')}
                        disabled={currentQIdx === 0}
                        className="px-5 py-3 rounded-full border-2 border-[#CAF0F8] text-[#0077B6] font-bold text-sm hover:bg-[#CAF0F8]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Sebelumnya
                      </button>
                      <button
                        onClick={() => handleNextQuestionPreview('next')}
                        disabled={currentQIdx === questions.length - 1}
                        className="px-5 py-3 rounded-full border-2 border-[#CAF0F8] text-[#0077B6] font-bold text-sm hover:bg-[#CAF0F8]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Berikutnya
                      </button>
                      <button
                        onClick={handleCloseQuizModal}
                        className="px-8 py-3 rounded-full bg-slate-800 text-white font-bold text-sm shadow-md hover:bg-slate-700 transition-all ml-4"
                      >
                        Tutup Pratinjau
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 md:p-8 border-t border-[#E2E8F0] bg-white flex justify-center">
                    <button
                      onClick={handleCheckAnswer}
                      disabled={
                        questions[currentQIdx]?.quizType === 'melengkapi_code'
                          ? (filledBlanks.length === 0 || filledBlanks.some(b => b === ''))
                          : selectedOptionIndices.length === 0
                      }
                      className={`min-w-[200px] py-4 rounded-full font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                        !(questions[currentQIdx]?.quizType === 'melengkapi_code'
                          ? (filledBlanks.length === 0 || filledBlanks.some(b => b === ''))
                          : selectedOptionIndices.length === 0)
                          ? 'bg-gradient-to-r from-[#0077B6] to-[#00B4D8] shadow-lg shadow-[rgba(0,119,182,0.2)] hover:opacity-95 hover:-translate-y-0.5'
                          : 'bg-[#CBD5E1] cursor-not-allowed'
                      }`}
                    >
                      {currentQIdx === questions.length - 1 ? 'Selesai' : 'Pertanyaan Berikutnya'}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Result Screen */
              <div className="p-8 text-center flex-1 flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center mx-auto mb-5">
                  {score >= (quizStep.content?.quiz?.nilaiMinimal || 75) ? <CheckCircle className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
                </div>
                <h3 className="text-3xl font-bold text-[#0077B6] mb-2">{score >= (quizStep.content?.quiz?.nilaiMinimal || 75) ? '🎉 Selamat!' : 'Belum Berhasil'}</h3>
                <div className={`text-6xl font-black my-4 ${score >= (quizStep.content?.quiz?.nilaiMinimal || 75) ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{score}</div>
                <p className="text-[#64748B] mb-8">Nilai minimum: {quizStep.content?.quiz?.nilaiMinimal || 75}</p>
                <button onClick={handleCloseQuizModal} className="px-10 py-3.5 rounded-full text-sm font-bold bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white shadow-lg shadow-[rgba(0,119,182,0.2)] hover:opacity-90 transition-all">
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint Confirmation Modal */}
      {showHintConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHintConfirm(false)} />
          <div className="relative bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-[#FEF9C3] flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-[#CA8A04]" />
            </div>
            <h3 className="text-xl font-bold text-[#0077B6] mb-2">Gunakan Bantuan?</h3>
            <p className="text-sm text-[#64748B] mb-6">
              Jika kamu membuka bantuan ini, poin mu akan berkurang 1.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowHintConfirm(false)}
                className="px-6 py-2.5 rounded-full font-semibold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
              >
                Tidak
              </button>
              <button
                onClick={() => {
                  setShowHintConfirm(false);
                  handleUseHint();
                }}
                className="px-6 py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:shadow-lg transition-all"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Editor Modal */}
      {showCodeEditorModal && codeEditorStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6">
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md" onClick={handleCloseCodeEditorModal} />
          <div className="relative bg-white rounded-[2rem] w-[95vw] md:w-[95vw] max-w-[1600px] h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-[#4A3B69] to-[#6C5B8B] flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#0077B6]">{codeEditorStep.judul || codeEditorStep.title}</h2>
                <p className="text-sm text-[#64748B]">Tugas Code Editor</p>
              </div>
              <button onClick={handleCloseCodeEditorModal} className="w-10 h-10 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center transition-colors">
                <XCircle className="w-5 h-5 text-[#94A3B8]" />
              </button>
            </div>

            {/* Preview Banner */}
            {isCodePreviewMode && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 shadow-inner">
                <span>👁️</span>
                <span>Anda sedang melihat pratinjau tugas code editor Anda yang telah lulus.</span>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 custom-scrollbar flex flex-col">
              {/* Task Instructions */}
              {codeEditorStep.content?.taskInstructions && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-[#4A3B69]" />
                    <h3 className="font-bold text-sm text-[#0077B6]">Perintah Tugas</h3>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#CAF0F8]">
                    <p className="text-sm text-[#0077B6] whitespace-pre-wrap">{codeEditorStep.content.taskInstructions}</p>
                  </div>
                </div>
              )}

              {/* Code Example - VS Code Style */}
              {codeEditorStep.content?.taskExample && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-5 h-5 text-[#0077B6]" />
                    <h3 className="font-bold text-sm text-[#0077B6]">Contoh Kode dari Guru</h3>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-[#334155]">
                    <div className="bg-[#1E293B] px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
                        <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                        <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                      </div>
                      <span className="text-[#94A3B8] text-xs font-semibold tracking-wider uppercase">Contoh</span>
                    </div>
                    <div className="bg-[#0F172A] px-5 py-4">
                      <pre className="font-mono text-sm leading-relaxed text-[#E2E8F0] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlightHTML(codeEditorStep.content.taskExample) }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Student Code Editor */}
              <div className="mb-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-[#F59E0B]" />
                    <h3 className="font-bold text-sm text-[#0077B6]">Kode Kamu</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowCodePreview(!showCodePreview)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      {showCodePreview ? 'Sembunyikan' : 'Tampilkan'} Preview
                    </button>
                    {!isCodePreviewMode && (
                      <button onClick={() => setStudentCode(codeEditorStep.content?.initialCode || "")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-0 rounded-2xl overflow-hidden border border-[#E2E8F0] flex-1 min-h-[300px]">
                  <div className={`flex flex-col ${showCodePreview ? 'w-1/2' : 'w-full'}`}>
                    <div className="bg-[#1E293B] px-4 py-2 flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                      </div>
                      <span className="text-[#94A3B8] text-xs">index.html</span>
                    </div>
                    <textarea value={studentCode} onChange={(e) => setStudentCode(e.target.value)} readOnly={isCodePreviewMode} className="flex-1 bg-[#0F172A] text-[#E2E8F0] font-mono text-sm p-4 resize-none focus:outline-none" placeholder="Tulis kode HTML kamu di sini..." spellCheck={false} />
                  </div>
                  {showCodePreview && (
                    <div className="w-1/2 border-l border-[#E2E8F0] flex flex-col">
                      <div className="bg-[#F8FAFC] px-4 py-2 flex items-center gap-2 border-b border-[#E2E8F0]">
                        <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                        <span className="text-[#64748B] text-xs font-medium">Preview</span>
                      </div>
                      <iframe ref={codeIframeRef} title="Preview" className="flex-1 bg-white" sandbox="allow-scripts allow-same-origin" srcDoc={studentCode} />
                    </div>
                  )}
                </div>
              </div>

              {/* Code Submitted Feedback */}
              {codeSubmitted && !isCodePreviewMode && (
                <div className="p-4 rounded-2xl bg-[#D1FAE5] text-center mb-4">
                  <p className="font-bold text-[#065F46]">✓ Kode berhasil dikirim!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {isCodePreviewMode ? (
              <div className="flex justify-between items-center w-full px-6 py-4 border-t border-[#E2E8F0] bg-slate-50">
                <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  👁️ Mode Peninjauan Kode
                </span>
                <button onClick={handleCloseCodeEditorModal} className="px-8 py-3 rounded-full bg-slate-800 text-white font-bold text-sm shadow-md hover:bg-slate-700 transition-all">
                  Tutup Pratinjau
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-white">
                <button onClick={handleCloseCodeEditorModal} className="px-6 py-3 rounded-full border-2 border-[#E2E8F0] text-[#64748B] font-semibold text-sm hover:bg-[#F8FAFC] transition-colors">
                  Tutup
                </button>
                <button onClick={handleSubmitCode} disabled={savingCode || !studentCode.trim()} className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#4A3B69] to-[#6C5B8B] text-white font-bold text-sm shadow-[0_4px_0_#332350] hover:translate-y-0.5 hover:shadow-[0_2px_0_#332350] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {savingCode ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {savingCode ? 'Mengirim...' : 'Kirim Kode'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refleksi Modal */}
      {pembelajaran?.enableReflection && (
        <RefleksiModal
          isOpen={showReflectionModal}
          onClose={() => setShowReflectionModal(false)}
          materiId={pembelajaranId ?? ""}
          template={pembelajaran.reflectionTemplate || "Standar"}
          pertanyaanKendala={pembelajaran.pertanyaanKendala}
          pertanyaanKesan={pembelajaran.pertanyaanKesan}
          onSuccess={() => setHasReflection(true)}
        />
      )}
    </div>
  );
}
