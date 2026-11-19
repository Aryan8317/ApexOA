"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { evaluateUserAnswer, saveDraft, getDrafts } from "@/app/actions/interview.actions";
import { Loader2, Video, VideoOff, Terminal, Volume2, VolumeX } from "lucide-react";
import Editor from "@monaco-editor/react";

interface Question {
  question: string;
  correctAnswer: string;
}

const extractParamsFromQuestion = (questionText: string) => {
  const regex = /`([a-zA-Z_][a-zA-Z0-9_]*)`/g;
  const params: string[] = [];
  let match;
  while ((match = regex.exec(questionText)) !== null) {
    const varName = match[1];
    const exclusions = ["solve", "null", "undefined", "true", "false", "class", "function", "const", "let", "var", "return", "int", "string", "float", "double", "auto", "void", "object", "array", "list", "map", "set", "vector"];
    if (!exclusions.includes(varName.toLowerCase()) && !params.includes(varName)) {
      params.push(varName);
    }
  }
  return params.length > 0 ? params : ["input"];
};

const getCodeTemplate = (lang: string, params: string[]) => {
  const paramList = params.join(", ");
  switch (lang) {
    case "javascript":
      return `// Write your JavaScript solution here\nfunction solve(${paramList}) {\n  \n  return;\n}`;
    case "python":
      return `# Write your Python solution here\ndef solve(${paramList}):\n    pass`;
    case "cpp":
      return `// Write your C++ solution here\n#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nvoid solve(${params.map(p => `auto ${p}`).join(", ")}) {\n    \n}`;
    case "java":
      return `// Write your Java solution here\npublic class Solution {\n    public static void solve(${params.map(p => `Object ${p}`).join(", ")}) {\n        \n    }\n}`;
    default:
      return `// Write your solution here\nfunction solve(${paramList}) {\n  \n}`;
  }
};

export default function InterviewClient({ 
  interviewId, 
  questions,
  interviewType = "dsa"
}: { 
  interviewId: string, 
  questions: Question[],
  interviewType?: string
}) {
  const router = useRouter();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [language, setLanguage] = useState("javascript");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasWebcam, setHasWebcam] = useState(true);

  // ── AUTOSAVE STATE ──────────────────────────────────────────────────────────
  // drafts: map of questionIndex → saved draft text (loaded once on mount)
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  // saveStatus: shown in the "Auto-Saving" badge so the user gets feedback
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  // debounceTimer: holds the setTimeout reference so we can clear/reset it
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ───────────────────────────────────────────────────────────────────────────

  // ── TEXT-TO-SPEECH (Interviewer Voice) ─────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleSpeech = (textToRead: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95; // Natural, measured interview pace
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      v => v.lang.startsWith("en") && 
      (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Karen"))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech when navigating away or switching questions
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeQuestionIndex]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  const isMCQ = interviewType === "mcq" || interviewType.includes("mcq");
  const isCode = interviewType === "dsa" || (interviewType.startsWith("dsa") && !interviewType.includes("text") && !interviewType.includes("mcq"));

  const handleLeaveSession = () => {
    const confirmLeave = window.confirm(
      "Are you sure you want to leave this session? Your progress is saved, and you can resume it later from the dashboard."
    );
    if (confirmLeave) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      router.push("/dashboard");
    }
  };

  // Pre-populate code template if it's a DSA interview and answer is empty
  // ── EFFECT 1: Load all saved drafts once when the interview first opens ──────
  // This runs only on mount (empty [] dependency array).
  // We fetch all drafts for this interview and store them in state.
  useEffect(() => {
    const loadDrafts = async () => {
      const result = await getDrafts(interviewId);
      if (result.success) {
        setDrafts(result.drafts);
      }
    };
    loadDrafts();
  }, []); // [] = run once on mount, never again

  // ── EFFECT 2: Restore draft OR show template when switching questions ────────
  // Whenever activeQuestionIndex changes, check if there's a saved draft for it.
  // If yes → restore it. If no → show the blank template (for code) or empty string.
  useEffect(() => {
    const savedDraft = drafts[activeQuestionIndex];
    if (savedDraft) {
      setUserAnswer(savedDraft);
    } else if (isCode) {
      const extractedParams = extractParamsFromQuestion(currentQuestion?.question || "");
      setUserAnswer(getCodeTemplate(language, extractedParams));
    } else {
      setUserAnswer("");
    }
  }, [activeQuestionIndex, language, isCode]);

  // ── EFFECT 3: Debounced autosave whenever userAnswer changes ─────────────────
  // "Debounce" means: wait for the user to STOP typing for 1.5s, THEN save.
  // If they keep typing, the timer resets each keystroke — avoids saving on every character.
  useEffect(() => {
    if (!userAnswer.trim()) return;

    setSaveStatus("saving");

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      await saveDraft({ interviewId, questionIndex: activeQuestionIndex, draftAnswer: userAnswer });
      setDrafts(prev => ({ ...prev, [activeQuestionIndex]: userAnswer }));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [userAnswer]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    // Setup Webcam
    const startWebcam = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Webcam access denied or unavailable", err);
        setHasWebcam(false);
      }
    };
    startWebcam();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setIsSubmitting(true);
    const currentQuestion = questions[activeQuestionIndex];
    
    try {
      await evaluateUserAnswer({
        interviewId,
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correctAnswer,
        userAnswer: userAnswer
      });
      
      // Clear the draft for the submitted question from local state
      setDrafts(prev => {
        const updated = { ...prev };
        delete updated[activeQuestionIndex];
        return updated;
      });
      setSaveStatus("idle");
      setUserAnswer("");
      
      if (activeQuestionIndex < questions.length - 1) {
        const nextIndex = activeQuestionIndex + 1;
        if (isCode) {
          const nextQuestion = questions[nextIndex];
          const nextParams = extractParamsFromQuestion(nextQuestion?.question || "");
          setUserAnswer(getCodeTemplate(language, nextParams));
        }
        setActiveQuestionIndex(nextIndex);
      } else {
        router.push(`/interview/${interviewId}/feedback`);
      }
    } catch (error) {
      console.error("Failed to submit answer", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!questions || questions.length === 0) {
    return <div>No questions found for this assessment.</div>;
  }

  const currentQuestion = questions[activeQuestionIndex];

  // MCQ parser helper
  const parseMCQ = (questionText: string) => {
    // Clean up double newlines or jumbled option letters first (e.g. C)\nText -> C) Text)
    const cleanedText = questionText.replace(/\n+([A-D][\)\.\s])\n+/g, "\n$1 ");

    // Robust split using lookahead for option labels (A), B), C), D) or A., B., C., D.)
    const parts = cleanedText.split(/[\s\n]+(?=[A-D][\)\.\s])/).map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length >= 2) {
      return {
        questionText: parts[0],
        options: parts.slice(1).map(opt => 
          opt.replace(/^([A-D][\)\.\s])\s*\n+/, "$1 ").replace(/\s+/g, " ").trim()
        )
      };
    }
    
    // Fallback to standard newline split
    const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length >= 2) {
      return {
        questionText: lines[0],
        options: lines.slice(1).map(opt => 
          opt.replace(/^([A-D][\)\.\s])\s*\n+/, "$1 ").replace(/\s+/g, " ").trim()
        )
      };
    }
    
    return {
      questionText,
      options: []
    };
  };

  const mcqData = parseMCQ(currentQuestion?.question || "");

  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* Top Exit workspace action */}
      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
        <button
          type="button"
          onClick={handleLeaveSession}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 text-secondary hover:text-red-600 transition-colors font-label-md text-label-md group font-semibold"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          Exit Workspace
        </button>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-surface-cream text-on-surface-variant border border-outline-variant/30 uppercase tracking-wider">
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved ✓"}
          {saveStatus === "idle" && "Auto-Save On"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
      {/* Left Panel */}
      <div className="space-y-6">
        <Card className="border border-outline-variant/30 bg-surface-white/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                Question {activeQuestionIndex + 1} of {questions.length}
              </div>
              <button
                type="button"
                onClick={() => toggleSpeech(isMCQ ? mcqData.questionText : (currentQuestion?.question || ""))}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  isSpeaking
                    ? "bg-primary text-surface-white border-primary shadow-sm ring-2 ring-primary/20 animate-pulse"
                    : "bg-surface-cream text-on-surface hover:text-primary hover:border-primary/40 border-outline-variant/40"
                }`}
                title={isSpeaking ? "Stop voice" : "Listen to interviewer read question"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                    <span>Read Aloud</span>
                  </>
                )}
              </button>
            </div>
            <h2 className="text-xl font-bold leading-relaxed text-on-surface">
              {isMCQ ? mcqData.questionText : currentQuestion?.question}
            </h2>
          </CardContent>
        </Card>

        <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-lg">
          {hasWebcam ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
          ) : (
            <div className="text-center text-gray-500">
              <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Camera access denied or unavailable</p>
            </div>
          )}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 font-medium">
            <Video className="w-3.5 h-3.5" />
            Proctored Session
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col h-full justify-between">
        {isMCQ ? (
          /* MCQ OPTIONS */
          <Card className="flex-1 flex flex-col justify-center min-h-[350px] border border-outline-variant/30 bg-surface-white">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="font-label-md text-label-md text-on-surface-variant mb-2 font-semibold">
                Select the correct answer option:
              </div>
              <div className="flex flex-col gap-3">
                {mcqData.options.map((option, idx) => {
                  const isSelected = userAnswer === option;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setUserAnswer(option)}
                      className={`w-full p-4 rounded-xl border text-left font-body-md transition-all duration-200 ${
                        isSelected
                          ? "bg-primary-fixed/20 border-primary text-primary font-semibold ring-1 ring-primary shadow-sm"
                          : "bg-surface-cream border-outline-variant/30 hover:bg-surface-cream/80 hover:border-outline-variant text-on-surface"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : isCode ? (
          /* MONACO IDE CODE EDITOR */
          <div className="flex-1 flex flex-col min-h-[350px]">
            <div className="flex justify-between items-center bg-surface-container-low px-4 py-2.5 rounded-t-xl border border-outline-variant/30 border-b-0">
              <div className="flex items-center gap-2 text-primary font-label-md text-label-md font-semibold">
                <Terminal className="w-4 h-4 text-primary" />
                ApexIDE v1.0
              </div>
              <select 
                value={language}
                disabled={isSubmitting}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  const extractedParams = extractParamsFromQuestion(currentQuestion?.question || "");
                  setUserAnswer(getCodeTemplate(newLang, extractedParams));
                }}
                className="bg-surface-white border border-outline-variant/60 rounded-md px-3 py-1 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
            <div className="flex-grow h-[340px] border border-outline-variant/30 rounded-b-xl overflow-hidden shadow-inner bg-white">
              <Editor
                height="100%"
                language={language}
                value={userAnswer}
                theme="vs-light"
                onChange={(value) => setUserAnswer(value || "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 }
                }}
              />
            </div>
          </div>
        ) : (
          /* STANDARD TEXT AREA (For System Design & Behavioral) */
          <Card className="flex-1 flex flex-col border border-outline-variant/30 bg-surface-white min-h-[350px]">
            <CardContent className="p-4 flex-1 flex flex-col">
              <Textarea 
                placeholder="Type your answer here..." 
                className="flex-1 min-h-[300px] text-base resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent text-on-surface"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleLeaveSession}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-12 px-6 text-base text-red-600 hover:text-red-700 hover:bg-red-50/50 border border-transparent hover:border-red-100 transition-all font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">exit_to_app</span>
            Leave Assessment
          </Button>

          <Button 
            onClick={submitAnswer} 
            disabled={isSubmitting || !userAnswer.trim()}
            className="w-full sm:w-auto h-12 px-8 text-base bg-primary-container text-surface-white hover:bg-primary transition-all duration-300 font-semibold rounded-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Evaluating...
              </>
            ) : activeQuestionIndex === questions.length - 1 ? (
              "Complete Interview"
            ) : (
              "Submit Answer & Next"
            )}
          </Button>
        </div>
      </div>
    </div>
  </div>
  );
}
