"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { SideBarMurid } from "../components/SideBarMurid";
import { CheckCircle, XCircle, Loader, AlertCircle, Zap, Lightbulb } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import { updateProgress } from "../utils/api";
import { highlightCode } from "../utils/highlighter";

// Adapter: convert quiz format from DB (pertanyaan/pilihan/jawabanBenar) to player format
function adaptQuestion(q: any) {
  if (!q) return null;

  let choices: string[] = [];
  let correctText = "";
  let questionText = "";
  let explanation = "";

  // New format (pertanyaan-based)
  if (q.pertanyaan) {
    choices = (q.pilihan || []).map((p: any) => p.text || p);
    const correctVal = q.jawabanBenar; // "A", "B", "C", "D", "E"
    const correctIdx = (q.pilihan || []).findIndex((p: any, idx: number) => {
      const label = p.label || String.fromCharCode(65 + idx);
      return label === correctVal;
    });
    correctText = choices[correctIdx] || "";
    questionText = q.pertanyaan;
    explanation = q.penjelasan || "";
  } 
  // Old format (question-based)
  else {
    choices = q.options || [];
    correctText = choices[q.correctAnswer] || "";
    questionText = q.question || "";
    explanation = q.penjelasan || "";
  }

  // Shuffle options
  const shuffled = choices.map((text) => ({ text, isCorrect: text === correctText }));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return {
    question: questionText,
    options: shuffled.map(s => s.text),
    correctAnswer: shuffled.findIndex(s => s.isCorrect),
    penjelasan: explanation,
    originalId: q.id || null,
    originalText: questionText,
    quizType: q.quizType || ((/\.{3,}|_{3,}/.test(questionText) || (q.perintahCode && /\.{3,}|_{3,}/.test(q.perintahCode)) || (q.code && /\.{3,}|_{3,}/.test(q.code))) ? "melengkapi_code" : "pilihan_ganda"),
    code: q.code || "",
    perintahCode: q.perintahCode || "",
    hint: q.bantuan || q.hint || "",
  };
}

export default function MengerjakanLatihan() {
  const navigate = useNavigate();
  const { pembelajaranId, stepId } = useParams();
  const { user, refreshUser } = useAuth();
  const [pembelajaran, setPembelajaran] = useState<any>(null);
  const [step, setStep] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [hintPoints, setHintPoints] = useState(3);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<any[]>([]);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canAccessQuiz, setCanAccessQuiz] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [claimedBonus, setClaimedBonus] = useState(0);
  const [filledBlanks, setFilledBlanks] = useState<string[]>([]);
  const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showHintConfirm, setShowHintConfirm] = useState(false);

  useEffect(() => {
    if (pembelajaranId && user) loadData();
  }, [pembelajaranId, stepId, user]);

  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const loadData = async () => {
    if (!pembelajaranId || !user) return;
    setLoading(true);
    try {
      // Fetch pembelajaran dari Supabase
      const { data: pData } = await supabase.from('pembelajaran').select('*').eq('id', pembelajaranId).single();
      setPembelajaran(pData);

      const currentStep = (pData?.steps || []).find((s: any) => s.id === stepId);
      setStep(currentStep);

      // Adapt questions format
      const rawSoal = currentStep?.content?.quiz?.soalList || currentStep?.questions || [];
      const adaptedQuestions = rawSoal.map(adaptQuestion).filter(Boolean);
      setQuestions(adaptedQuestions);
      if (adaptedQuestions.length > 0) {
        const firstQ = adaptedQuestions[0];
        if (firstQ.quizType === 'melengkapi_code') {
          const codeBlanks = (firstQ.code?.match(/\.{3,}|_{3,}/g) || []).length;
          const instructionBlanks = (firstQ.perintahCode?.match(/\.{3,}|_{3,}/g) || []).length;
          const blankCount = codeBlanks > 0 ? codeBlanks : (instructionBlanks > 0 ? instructionBlanks : (firstQ.question.match(/\.{3,}|_{3,}/g) || []).length);
          setFilledBlanks(Array(blankCount).fill(''));
        } else {
          setFilledBlanks([]);
        }
      }

      // Fetch user profile for hint_points
      const { data: profile } = await supabase.from('profiles').select('hint_points, exp, streak').eq('id', user.id).single();
      setHintPoints(profile?.hint_points ?? 3);

      // Check if student already read materi and collect existing attempts
      const { data: existingProgress } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('pembelajaran_id', pembelajaranId)
        .eq('step_id', stepId)
        .maybeSingle();
      setAttemptCount(existingProgress?.answers?.attempts || 0);

      // Check if student already read materi
      if (currentStep?.content?.bacaMateri) {
        const progData = existingProgress;
        setCanAccessQuiz(!!(progData?.answers?.read_materi || progData?.completed));
      } else {
        setCanAccessQuiz(true);
      }
    } catch (error) {
      console.error("Failed to load quiz data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseHint = async () => {
    if (!user || feedback || showResult || hintPoints <= 0 || showHint) return;

    try {
      const currentQ = questions[currentQIdx];
      const wrongOptions = currentQ.options
        .map((_: any, idx: number) => idx)
        .filter((idx: number) => idx !== currentQ.correctAnswer && !eliminatedOptions.includes(idx));

      if (wrongOptions.length > 0) {
        const toEliminate = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        setEliminatedOptions([...eliminatedOptions, toEliminate]);
      }

      // Deduct hint point
      const newHints = hintPoints - 1;
      setHintPoints(newHints);
      setShowHint(true);
      await supabase.from('profiles').update({ hint_points: newHints }).eq('id', user.id);
    } catch (err) {
      console.error("Failed to use hint:", err);
    }
  };

  const handleCheckAnswer = () => {
    const currentQ = questions[currentQIdx];
    
    if (currentQ.quizType === 'melengkapi_code') {
      if (filledBlanks.some(b => b === '') || feedback) return;
      const correctAnswer = currentQ.options[currentQ.correctAnswer];
      const userAnswer = filledBlanks.join(' ');
      
      if (userAnswer === correctAnswer) {
        setFeedback('correct');
        setCorrectCount(prev => prev + 1);
      } else {
        setFeedback('wrong');
        setWrongQuestions(prev => [...prev, { question: currentQ.question, selected: userAnswer, correct: correctAnswer }]);
      }
    } else {
      if (selectedAnswer === null || feedback) return;
      if (selectedAnswer === currentQ.correctAnswer) {
        setFeedback('correct');
        setCorrectCount(prev => prev + 1);
      } else {
        setFeedback('wrong');
        setWrongQuestions(prev => [
          ...prev, 
          { 
            question: currentQ.question, 
            selected: currentQ.options[selectedAnswer], 
            correct: currentQ.options[currentQ.correctAnswer] 
          }
        ]);
      }
    }
  };

  const handleNextOrSubmit = async () => {
    if (currentQIdx < questions.length - 1) {
      const nextIdx = currentQIdx + 1;
      const nextQ = questions[nextIdx];
      setCurrentQIdx(nextIdx);
      setSelectedAnswer(null);
      setFeedback(null);
      setEliminatedOptions([]);
      setSelectedOptionIndices([]);
      setShowHint(false);
      
      if (nextQ.quizType === 'melengkapi_code') {
        const codeBlanks = (nextQ.code?.match(/\.{3,}|_{3,}/g) || []).length;
        const instructionBlanks = (nextQ.perintahCode?.match(/\.{3,}|_{3,}/g) || []).length;
        const blankCount = codeBlanks > 0 ? codeBlanks : (instructionBlanks > 0 ? instructionBlanks : (nextQ.question.match(/\.{3,}|_{3,}/g) || []).length);
        setFilledBlanks(Array(blankCount).fill(''));
      } else {
        setFilledBlanks([]);
      }
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!step || !pembelajaranId || !stepId || !user) return;
    setSubmitting(true);
    try {
      const total = questions.length || 1;
      const finalScore = Math.round((correctCount / total) * 100);
      setScore(finalScore);
      setShowResult(true);

      const passingScore = step.content?.quiz?.nilaiMinimal || step.passingScore || 75;
      const passed = finalScore >= passingScore;
      const nextAttempts = attemptCount + 1;
      const needsHelp = nextAttempts >= 3 && !passed;

      // Save progress
      await updateProgress({
        pembelajaranId,
        stepId,
        score: finalScore,
        completed: passed,
        answers: {
          quiz_done: true,
          attempts: nextAttempts,
          needs_help: needsHelp,
          read_materi: true,
          wrong_questions: wrongQuestions, // Send detail of wrong answers
        },
      });
      setAttemptCount(nextAttempts);

      // Gamification: bonus bantuan hanya jika lolos sekali coba
      if (passed) {
        const { data: profile } = await supabase.from('profiles').select('hint_points, exp, streak, last_streak_date').eq('id', user.id).single();
        const newExp = (profile?.exp || 0) + Math.round((finalScore / 100) * 50);
        // Streak update
        const today = new Date().toISOString().split('T')[0];
        const wasStreakToday = profile?.last_streak_date === today;
        const newStreak = wasStreakToday ? (profile?.streak || 0) : (profile?.streak || 0) + 1;
        // Bonus hint only if directly passed (not retry)
        const firstTryBonus = nextAttempts === 1 ? 1 : 0;
        const newHints = Math.min((profile?.hint_points || 0) + firstTryBonus, 10);
        await supabase.from('profiles').update({
          exp: newExp,
          streak: newStreak,
          hint_points: newHints,
          last_streak_date: today
        }).eq('id', user.id);
        setClaimedBonus(firstTryBonus);
        await refreshUser();
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      showToastNotification("Gagal menyimpan jawaban. Silakan coba lagi.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentQIdx(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setCorrectCount(0);
    setEliminatedOptions([]);
    setShowResult(false);
    setScore(0);
    setWrongQuestions([]);
    setShowHint(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "transparent" }}>
        <Loader className="w-12 h-12 text-[#0077B6] animate-spin" />
      </div>
    );
  }

  if (!canAccessQuiz) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent" }}>
        <SideBarMurid />
        <main className="ml-0 lg:ml-80 min-h-screen flex items-center justify-center">
          <div className="max-w-md text-center bg-white rounded-[2.5rem] p-12 shadow-md">
            <AlertCircle className="w-16 h-16 text-[#EF4444] mx-auto mb-6" />
            <h2 className="font-bold text-2xl text-[#0077B6] mb-4">Baca Materi Dulu!</h2>
            <p className="text-[#64748B] mb-8">Anda harus membaca materi terlebih dahulu sebelum mengerjakan latihan ini.</p>
            <button onClick={() => navigate(`/pembelajaran/${pembelajaranId}/materi/${stepId}`)} className="bg-[#0077B6] text-white font-bold py-3 px-8 rounded-full hover:bg-[#0077B6] transition-all">
              Baca Materi
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!step || questions.length === 0) {
    return (
      <div className="min-h-screen w-full relative" style={{ background: "transparent" }}>
        <SideBarMurid />
        <main className="ml-0 lg:ml-80 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
            <p className="text-[#64748B]">Quiz tidak tersedia untuk step ini.</p>
            <button onClick={() => navigate(`/pembelajaran/${pembelajaranId}`)} className="mt-4 text-[#0077B6] font-semibold">Kembali</button>
          </div>
        </main>
      </div>
    );
  }

  const passingScore = step.content?.quiz?.nilaiMinimal || step.passingScore || 75;
  const passed = score >= passingScore;
  const currentQ = questions[currentQIdx];

  return (
    <div className="min-h-screen w-full relative" style={{ background: "transparent" }}>
      <SideBarMurid />
      <main className="ml-0 lg:ml-80 min-h-screen">
        <div className="px-4 py-6 max-w-4xl mx-auto lg:px-8">
          {/* Progress bar & stats */}
          <div className="pt-16 lg:pt-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => navigate(`/pembelajaran/${pembelajaranId}`)} className="p-2 rounded-full hover:bg-white/70 text-[#64748B] transition-all">
                <XCircle className="w-6 h-6" />
              </button>
              <div className="flex-1 h-4 bg-[#CAF0F8] rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(currentQIdx / questions.length) * 100}%` }}
                  className="h-full bg-[#46BD84] rounded-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#FEF9C3] px-3 py-1.5 rounded-full">
                  <Zap className="w-4 h-4 text-[#CA8A04] fill-current" />
                  <span className="text-sm font-bold text-[#CA8A04]">{user?.exp || 0} EXP</span>
                </div>
                <div className="flex items-center gap-1 bg-[#FFEDD5] px-3 py-1.5 rounded-full">
                  <span className="text-lg">🔥</span>
                  <span className="text-sm font-bold text-[#EA580C]">{user?.streak || 0}</span>
                </div>
                {!showResult && (
                  <button
                    onClick={() => setShowHintConfirm(true)}
                    disabled={feedback !== null || hintPoints <= 0 || showHint}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${hintPoints > 0 && feedback === null && !showHint ? 'bg-[#CAF0F8] text-[#0077B6] hover:bg-[#90E0EF]' : 'bg-[#CAF0F8] text-[#94A3B8] cursor-not-allowed'}`}
                    title={showHint ? "Bantuan sudah aktif" : `Gunakan bantuan. Sisa: ${hintPoints}`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    {hintPoints} Bantuan
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-[#94A3B8] text-center">Soal {currentQIdx + 1} dari {questions.length}</p>
          </div>

          {/* Quiz Content */}
          {showResult ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] p-12 text-center shadow-md">
              {passed ? <CheckCircle className="w-20 h-20 text-[#46BD84] mx-auto mb-6" /> : <XCircle className="w-20 h-20 text-[#EF4444] mx-auto mb-6" />}
              <h2 className="font-bold text-3xl text-[#0077B6] mb-4">{passed ? "🎉 Selamat!" : "Belum Berhasil"}</h2>
              <div className={`text-6xl font-black mb-4 ${passed ? 'text-[#46BD84]' : 'text-[#EF4444]'}`}>{score}</div>
              <p className="text-[#64748B] mb-2">Nilai minimum: {passingScore}</p>
              <p className="text-[#64748B] mb-8">
                {passed
                  ? `+${Math.round((score / 100) * 50)} EXP${claimedBonus > 0 ? ` + ${claimedBonus} poin bantuan bonus!` : "!"}`
                  : `Coba lagi untuk mencapai nilai ${passingScore}.`
                }
              </p>
              <div className="flex gap-4 justify-center">
                {!passed && (
                  <button onClick={handleRetry} className="bg-[#0077B6] text-white font-bold py-3 px-8 rounded-full shadow-[0_4px_0_#0077B6] hover:translate-y-1 hover:shadow-[0_2px_0_#0077B6] transition-all">
                    Coba Lagi
                  </button>
                )}
                <button onClick={() => navigate(`/pembelajaran/${pembelajaranId}`)} className={`font-bold py-3 px-8 rounded-full transition-all ${passed ? 'bg-[#46BD84] text-white shadow-[0_4px_0_#16A34A] hover:translate-y-1' : 'bg-[#CAF0F8] text-[#64748B]'}`}>
                  {passed ? "Lanjut ▶" : "Kembali"}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-md">
              {/* Modern Toast Notification */}
              <AnimatePresence>
                {showToast && (
                  <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
                      toastType === 'success' ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white'
                    }`}
                  >
                    {toastType === 'success' ? (
                      <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-sm">{toastMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.div key={currentQIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  {currentQ?.quizType === 'melengkapi_code' ? (
                    <h2 className="font-bold text-2xl text-[#0077B6] mb-8 leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-2">
                      {currentQ.question.split(/\.{3,}|_{3,}/).map((part: string, i: number, arr: any[]) => (
                        <span key={i} className="inline-flex items-center gap-2 flex-wrap">
                          <span>{part}</span>
                          {i < arr.length - 1 && (
                            <button
                              onClick={() => {
                                if (feedback) return;
                                const optionToRemove = filledBlanks[i];
                                if (!optionToRemove) return;
                                
                                const newFilled = [...filledBlanks];
                                newFilled[i] = '';
                                setFilledBlanks(newFilled);
                                
                                const optionIdx = currentQ.options.indexOf(optionToRemove);
                                if (optionIdx !== -1) {
                                  setSelectedOptionIndices(prev => prev.filter(idx => idx !== optionIdx));
                                }
                              }}
                              className={`min-w-[120px] h-10 px-4 inline-flex items-center justify-center rounded-xl border-2 border-dashed transition-all font-mono text-base ${
                                feedback === 'correct' ? 'bg-[#D1FAE5] border-[#10B981] text-[#065F46] font-bold shadow-sm' :
                                feedback === 'wrong' ? 'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] font-bold shadow-sm' :
                                filledBlanks[i] ? 'bg-[#0077B6] border-[#0077B6] text-white font-bold shadow-md transform scale-105' :
                                'border-[#CBD5E1] text-[#94A3B8] hover:border-[#0077B6] hover:bg-[#CAF0F8]/20'
                              }`}
                            >
                              {filledBlanks[i] || ""}
                            </button>
                          )}
                        </span>
                      ))}
                    </h2>
                  ) : (
                    <h2 className="font-bold text-2xl text-[#0077B6] mb-8 leading-relaxed">{currentQ?.question}</h2>
                  )}
                  
                  {/* Code Viewer inside Quiz */}
                  {currentQ?.code && (
                    <div className="mb-6 rounded-2xl overflow-hidden border border-[#334155] bg-[#0F172A] shadow-lg animate-fadeIn text-left">
                      <div className="bg-[#1E293B] px-4 py-2 flex items-center justify-between border-b border-[#334155]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                        </div>
                        <span className="text-[#94A3B8] text-[10px] font-bold tracking-wider uppercase font-mono">soal_code.html</span>
                      </div>
                      <div className="p-5 overflow-x-auto custom-scrollbar font-['Fira_Code','Courier_New',monospace]">
                        {(() => {
                          const rawCode = currentQ.code || "";
                          const hasBlanks = (rawCode.match(/\.{3,}|_{3,}/g) || []).length > 0;
                          
                          if (hasBlanks) {
                            const highlighted = highlightCode(rawCode);
                            const parts = highlighted.split(/(\.{3,}|_{3,})/g);
                            let blankCounter = 0;
                            
                            return (
                              <pre className="font-mono text-sm leading-relaxed text-[#E2E8F0] whitespace-pre-wrap select-all m-0 bg-transparent p-0 border-0" style={{ color: "#E2E8F0" }}>
                                {parts.map((part, i) => {
                                  const isBlank = part.match(/\.{3,}|_{3,}/);
                                  if (isBlank) {
                                    const currentBlankIdx = blankCounter;
                                    blankCounter++;
                                    return (
                                      <button
                                        key={i}
                                        onClick={() => handleBlankClick(currentBlankIdx)}
                                        className={`mx-1 min-w-[100px] h-8 px-3 inline-flex items-center justify-center rounded-lg border-2 border-dashed transition-all font-mono text-sm ${
                                          feedback === 'correct' ? 'bg-[#D1FAE5] border-[#10B981] text-[#065F46] font-bold shadow-sm' :
                                          feedback === 'wrong' ? 'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] font-bold shadow-sm' :
                                          filledBlanks[currentBlankIdx] ? 'bg-[#0077B6] border-[#0077B6] text-white font-bold shadow-md transform scale-105 animate-scaleIn' :
                                          'border-[#475569] text-[#64748B] hover:border-[#0077B6] hover:bg-[#CAF0F8]/20'
                                        }`}
                                      >
                                        {filledBlanks[currentBlankIdx] || ""}
                                      </button>
                                    );
                                  } else {
                                    return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
                                  }
                                })}
                              </pre>
                            );
                          } else {
                            return (
                              <pre 
                                className="font-mono text-sm leading-relaxed text-[#E2E8F0] whitespace-pre-wrap select-all m-0 bg-transparent p-0 border-0" 
                                style={{ color: "#E2E8F0" }}
                                dangerouslySetInnerHTML={{ __html: highlightCode(rawCode) }}
                              />
                            );
                          }
                        })()}
                      </div>
                      {currentQ?.perintahCode && (
                        <div className="bg-[#1E293B] px-5 py-3 border-t border-[#334155] w-full">
                           {(() => {
                             const rawText = currentQ.perintahCode;
                             const hasBlanks = (rawText.match(/\.{3,}|_{3,}/g) || []).length > 0;
                             
                             if (hasBlanks && currentQ.quizType === 'melengkapi_code') {
                               const parts = rawText.split(/(\.{3,}|_{3,}/g);
                               let blankCounter = 0;
                               return (
                                 <p className="text-xs text-[#94A3B8] font-semibold flex flex-wrap items-center gap-x-2 gap-y-1.5 leading-relaxed m-0">
                                   {parts.map((part, i) => {
                                     const isBlank = part.match(/\.{3,}|_{3,}/);
                                     if (isBlank) {
                                       const currentBlankIdx = blankCounter;
                                       blankCounter++;
                                       return (
                                         <button
                                           key={i}
                                           onClick={() => handleBlankClick(currentBlankIdx)}
                                           className={`mx-1 min-w-[90px] h-7 px-2.5 inline-flex items-center justify-center rounded-lg border-2 border-dashed transition-all font-sans text-xs ${
                                             feedback === 'correct' ? 'bg-[#D1FAE5] border-[#10B981] text-[#065F46] font-bold shadow-sm' :
                                             feedback === 'wrong' ? 'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B] font-bold shadow-sm' :
                                             filledBlanks[currentBlankIdx] ? 'bg-[#0077B6] border-[#0077B6] text-white font-bold shadow-md transform scale-105 animate-scaleIn' :
                                             'border-[#475569] text-[#94A3B8] hover:border-[#0077B6] hover:bg-[#CAF0F8]/20'
                                           }`}
                                         >
                                           {filledBlanks[currentBlankIdx] || ""}
                                         </button>
                                       );
                                     } else {
                                       return <span key={i}>{part}</span>;
                                     }
                                   })}
                                 </p>
                               );
                             } else {
                               return (
                                 <p className="text-xs text-[#94A3B8] italic font-semibold m-0">{rawText}</p>
                               );
                             }
                           })()}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Hint Display */}
                  {showHint && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="mb-8 rounded-2xl overflow-hidden border-2 border-[#F59E0B] shadow-sm animate-fadeIn" 
                      style={{ background: 'linear-gradient(180deg, #FEF3C7, #FDE68A)' }}
                    >
                      <div className="p-5 flex gap-3">
                        <Lightbulb className="w-6 h-6 text-[#92400E] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-[#92400E] mb-1">💡 Petunjuk Guru</p>
                          <p className="text-sm text-[#92400E] leading-relaxed">
                            {currentQ.hint || "Coba baca kembali modul materi yang bersangkutan untuk menemukan jawabannya!"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentQ.quizType === 'melengkapi_code' ? (
                    <div className="space-y-8 mt-8">
                      <div className="flex flex-wrap justify-center gap-4">
                        {currentQ.options.map((option: string, idx: number) => {
                          const isSelected = selectedOptionIndices.includes(idx);
                          return (
                            <div key={idx} className="relative">
                              {/* Placeholder beneath when selected (Duolingo style) */}
                              <div className="absolute inset-0 bg-[#E2E8F0] rounded-2xl border-2 border-dashed border-[#CBD5E1] opacity-60 pointer-events-none flex items-center justify-center">
                                <span className="text-transparent select-none text-sm font-bold">{option}</span>
                              </div>
                              
                              <button
                                onClick={() => {
                                  if (feedback) return;
                                  if (isSelected) {
                                    const newSelected = selectedOptionIndices.filter(i => i !== idx);
                                    const newFilled = [...filledBlanks];
                                    const fIdx = newFilled.indexOf(option);
                                    if (fIdx !== -1) newFilled[fIdx] = '';
                                    setSelectedOptionIndices(newSelected);
                                    setFilledBlanks(newFilled);
                                  } else {
                                    const bIdx = filledBlanks.findIndex(b => b === '');
                                    if (bIdx !== -1) {
                                      const newFilled = [...filledBlanks];
                                      newFilled[bIdx] = option;
                                      setFilledBlanks(newFilled);
                                      setSelectedOptionIndices([...selectedOptionIndices, idx]);
                                    }
                                  }
                                }}
                                disabled={feedback !== null}
                                className={`relative px-6 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                                  isSelected
                                    ? "opacity-0 pointer-events-none translate-y-2 scale-95"
                                    : "bg-white border-2 border-[#CAF0F8] text-[#0077B6] hover:border-[#0077B6] hover:-translate-y-1 hover:shadow-md active:scale-95"
                                }`}
                              >
                                {option}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {currentQ?.options?.map((option: string, idx: number) => {
                        const isEliminated = eliminatedOptions.includes(idx);
                        let cls = "border-2 border-[#CAF0F8] bg-white text-[#0077B6] hover:bg-[#F8FAFC]";
                        if (selectedAnswer === idx) {
                          cls = feedback === 'correct' ? "border-2 border-[#46BD84] bg-[#DCFCE7] text-[#16A34A]"
                            : feedback === 'wrong' ? "border-2 border-[#EF4444] bg-[#FEE2E2] text-[#DC2626]"
                            : "border-2 border-[#0077B6] bg-[#CAF0F8] text-[#0077B6]";
                        } else if (feedback === 'wrong' && idx === currentQ.correctAnswer) {
                          cls = "border-2 border-[#46BD84] bg-[#DCFCE7] text-[#16A34A]";
                        } else if (isEliminated) {
                          cls = "border-2 border-[#CAF0F8] bg-transparent text-[#CBD5E1] opacity-40 cursor-not-allowed line-through";
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => !isEliminated && !feedback && setSelectedAnswer(idx)}
                            disabled={feedback !== null || isEliminated}
                            className={`text-left font-semibold text-base p-5 rounded-[1.5rem] transition-all shadow-sm ${cls}`}
                          >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>{option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Bottom bar */}
              <div className={`-mx-8 -mb-8 px-8 py-6 rounded-b-[2.5rem] border-t-2 transition-all ${feedback === 'correct' ? 'bg-[#DCFCE7] border-[#46BD84]' : feedback === 'wrong' ? 'bg-[#FEE2E2] border-[#EF4444]' : 'bg-[#F8FAFC] border-[#CAF0F8]'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    {feedback === 'correct' && <div className="flex items-center gap-2 text-[#16A34A] font-bold text-xl"><CheckCircle className="w-7 h-7" /> Luar Biasa!</div>}
                    {feedback === 'wrong' && (
                      <div>
                        <div className="flex items-center gap-2 text-[#DC2626] font-bold text-lg"><XCircle className="w-6 h-6" /> Jawaban yang benar:</div>
                        <p className="text-[#DC2626] text-sm mt-1">{String.fromCharCode(65 + currentQ.correctAnswer)}. {currentQ.options[currentQ.correctAnswer]}</p>
                        {currentQ.penjelasan && <p className="text-[#64748B] text-sm mt-1">{currentQ.penjelasan}</p>}
                      </div>
                    )}
                  </div>
                  {!feedback ? (
                    <button onClick={handleCheckAnswer} disabled={selectedAnswer === null} className={`font-bold text-base py-3 px-10 min-w-[180px] rounded-full transition-all ${selectedAnswer === null ? 'bg-[#CAF0F8] text-[#94A3B8] cursor-not-allowed' : 'bg-[#46BD84] text-white shadow-[0_4px_0_#16A34A] hover:translate-y-1 hover:shadow-[0_2px_0_#16A34A]'}`}>
                      Periksa
                    </button>
                  ) : (
                    <button onClick={handleNextOrSubmit} disabled={submitting} className={`font-bold text-base py-3 px-10 min-w-[180px] rounded-full transition-all text-white hover:translate-y-1 ${feedback === 'correct' ? 'bg-[#16A34A] shadow-[0_4px_0_#15803D]' : 'bg-[#EF4444] shadow-[0_4px_0_#B91C1C]'} hover:shadow-[0_2px_0_rgba(0,0,0,0.2)]`}>
                      {submitting ? <Loader className="w-5 h-5 animate-spin" /> : currentQIdx < questions.length - 1 ? "Lanjut →" : "Selesai ✓"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Hint Confirmation Modal */}
      {showHintConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHintConfirm(false)} />
          <div className="relative bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl text-center z-10 border border-[#E2E8F0] animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-[#FEF9C3] flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-[#CA8A04]" />
            </div>
            <h3 className="text-xl font-bold text-[#0077B6] mb-2">Gunakan Bantuan?</h3>
            <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
              Jika kamu membuka bantuan ini, Poin Bantuanmu akan berkurang 1.
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
                  void handleUseHint();
                }}
                className="px-6 py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:shadow-lg transition-all"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
