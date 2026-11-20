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
}

interface DraftSnapshot {
  questionIndex: number;
  answer: string;
  revision: number;
}

// Exclude language keywords and type names from generated parameter lists.
const excludedParams = new Set([
  "solve", "null", "undefined", "true", "false", "class", "function", "const", "let", "var",
  "return", "int", "string", "float", "double", "auto", "void", "object", "array", "list",
  "map", "set", "vector", "if", "else", "for", "while", "do", "switch", "case", "default",
  "break", "continue", "try", "catch", "finally", "throw", "new", "delete", "this", "super",
  "import", "export", "extends", "implements", "interface", "enum", "public", "private",
  "protected", "static", "final", "boolean", "char", "long", "short", "byte", "package",
  "instanceof", "typeof", "in", "of", "with", "yield", "await", "async", "def", "pass",
  "and", "or", "not", "is", "lambda", "from", "as", "assert", "del", "elif", "except",
  "global", "nonlocal", "raise", "bool", "unsigned", "signed", "struct", "template",
  "typename", "using", "namespace", "sizeof", "union", "volatile", "synchronized",
  "abstract", "native", "throws", "transient", "strictfp", "debugger", "const_cast",
  "dynamic_cast", "static_cast", "reinterpret_cast", "operator", "friend", "virtual",
  "explicit", "inline", "register", "extern", "mutable", "constexpr", "noexcept", "nullptr",
  "typeid", "typedef", "wchar_t", "char16_t", "char32_t", "alignas", "alignof", "static_assert",
  "thread_local", "co_await", "co_return", "co_yield", "concept", "requires",
]);

const extractParamsFromQuestion = (questionText: string) => {
  const regex = /`([a-zA-Z_][a-zA-Z0-9_]*)`/g;
  const params: string[] = [];
  let match;
  while ((match = regex.exec(questionText)) !== null) {
    const varName = match[1];
    if (!excludedParams.has(varName.toLowerCase()) && !params.includes(varName)) {
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
      return `// Write your C++ solution here\n#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\ntemplate <${params.map((_, index) => `typename T${index}`).join(", ")}>\nvoid solve(${params.map((param, index) => `T${index} ${param}`).join(", ")}) {\n    \n}`;
    case "java":
      return `// Write your Java solution here\npublic class Solution {\n    public static void solve(${params.map(p => `Object ${p}`).join(", ")}) {\n        \n    }\n}`;
    default:
      return `// Write your solution here\nfunction solve(${paramList}) {\n  \n}`;
  }
};

const parseMCQ = (questionText: string) => {
  // Only explicit option labels are delimiters; ordinary "A" in prose is not.
  const labels = Array.from(questionText.matchAll(/(?:^|\s)([A-D][).])\s*/g));
  if (labels.length >= 2) {
    const options = labels.map((label, index) => {
      const start = (label.index ?? 0) + label[0].length;
      const end = labels[index + 1]?.index ?? questionText.length;
      const content = questionText.slice(start, end).replace(/\s+/g, " ").trim();
      return `${label[1]} ${content}`.trim();
    });
    return {
      questionText: questionText.slice(0, labels[0].index).trim(),
      options,
    };
  }

  // Support the legacy unlabelled, four-options-on-separate-lines format.
  const lines = questionText.split("\n").map(line => line.trim()).filter(Boolean);
  if (labels.length === 0 && lines.length === 5) {
    return { questionText: lines[0], options: lines.slice(1) };
  }
  return { questionText, options: [] };
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
  const isMCQ = interviewType === "mcq" || interviewType.includes("mcq");
  const isCode = interviewType === "dsa" || (interviewType.startsWith("dsa") && !interviewType.includes("text") && !interviewType.includes("mcq"));

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [language, setLanguage] = useState("javascript");

  const [userAnswer, setUserAnswer] = useState(() => {
    if (isCode && questions && questions.length > 0) {
      const params = extractParamsFromQuestion(questions[0]?.question || "");
      return getCodeTemplate("javascript", params);
    }
    return "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const actionInProgress = useRef(false);
  const isMounted = useRef(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasWebcam, setHasWebcam] = useState(true);

  // ── AUTOSAVE STATE ──────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Serialize writes so an older request cannot overwrite a newer answer.
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const latestDraft = useRef<DraftSnapshot>({ questionIndex: 0, answer: "", revision: 0 });
  // Track whether the initial DB draft load has finished — prevents the
  // autosave from firing before we know if the user has existing work
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  // Track whether the user has actually typed/modified the answer
  const isUserDirty = useRef(false);
  // ───────────────────────────────────────────────────────────────────────────

  // ── TEXT-TO-SPEECH (Interviewer Voice) ─────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeech = () => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const toggleSpeech = (textToRead: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utteranceRef.current = utterance;
    utterance.lang = "en-US";
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

    const finishSpeech = () => {
      if (utteranceRef.current === utterance && isMounted.current) {
        utteranceRef.current = null;
        setIsSpeaking(false);
      }
    };
    utterance.onend = finishSpeech;
    utterance.onerror = finishSpeech;

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Only synchronize external resources here; UI updates happen in handlers.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  const persistDraft = useCallback((snapshot: DraftSnapshot): Promise<boolean> => {
    const task = saveQueue.current.then(async () => {
      try {
        const result = await saveDraft({
          interviewId,
          questionIndex: snapshot.questionIndex,
          draftAnswer: snapshot.answer,
        });
        if (!result.success) throw new Error(result.error || "Failed to save draft");

        if (isMounted.current && snapshot.revision === latestDraft.current.revision) {
          setDrafts(prev => ({ ...prev, [snapshot.questionIndex]: snapshot.answer }));
          isUserDirty.current = false;
          setSaveStatus("saved");
          savedStatusTimer.current = setTimeout(() => {
            if (isMounted.current) setSaveStatus("idle");
          }, 2000);
        }
        return true;
      } catch (error) {
        console.error("Failed to save draft:", error);
        if (isMounted.current && snapshot.revision === latestDraft.current.revision) {
          setSaveStatus("error");
        }
        return false;
      }
    });
    saveQueue.current = task.then(() => undefined);
    return task;
  }, [interviewId]);

  const flushDraft = async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await saveQueue.current;
    return !isUserDirty.current || await persistDraft({ ...latestDraft.current });
  };

  const handleAnswerChange = (answer: string) => {
    if (actionInProgress.current || answer === userAnswer) return;
    if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
    latestDraft.current = {
      questionIndex: activeQuestionIndex,
      answer,
      revision: latestDraft.current.revision + 1,
    };
    isUserDirty.current = true;
    setSaveStatus("saving");
    setErrorMessage(null);
    setUserAnswer(answer);
  };

  const handleLeaveSession = async () => {
    if (actionInProgress.current || !draftsLoaded) return;
    const confirmLeave = window.confirm(
      "Leave this session? Your latest answer will be saved before returning to the dashboard."
    );
    if (confirmLeave) {
      actionInProgress.current = true;
      setIsLeaving(true);
      stopSpeech();
      try {
        if (!await flushDraft()) {
          setErrorMessage("Your answer could not be saved. Please try leaving again.");
          return;
        }
        if (isMounted.current) router.push("/dashboard");
      } finally {
        actionInProgress.current = false;
        if (isMounted.current) setIsLeaving(false);
      }
    }
  };

  // ── EFFECT 1: Load all saved drafts once when the interview opens ────────────
  // We fetch all drafts for this interview and store them in state.
  useEffect(() => {
    let isMounted = true;

    const loadDrafts = async () => {
      try {
        const result = await getDrafts(interviewId);
        if (!isMounted) return;
        if (!result.success) {
          throw new Error(result.error || "Failed to load drafts");
        }

        const loadedDrafts: Record<number, string> = result.drafts;
        setDrafts(loadedDrafts);
        // Preserve edits made while the request was in flight, including deletions.
        const draft = loadedDrafts[latestDraft.current.questionIndex];
        if (!isUserDirty.current && draft !== undefined) {
          latestDraft.current = { ...latestDraft.current, answer: draft };
          setUserAnswer(draft);
        }
      } catch (error) {
        console.error("Failed to load drafts:", error);
        if (isMounted) {
          setErrorMessage("Saved drafts could not be loaded. Your existing work has not been restored.");
        }
      } finally {
        if (isMounted) {
          // State (not just a ref) schedules autosave for edits made during loading.
          setDraftsLoaded(true);
        }
      }
    };

    loadDrafts();

    return () => {
      isMounted = false;
    };
  }, [interviewId]);

  // ── EFFECT 2: Debounced autosave whenever userAnswer changes ─────────────────
  // Guard with draftsLoaded and isUserDirty so untouched boilerplate is not saved
  useEffect(() => {
    if (!draftsLoaded || !isUserDirty.current || isSubmitting || isLeaving) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const snapshot = { ...latestDraft.current };
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      void persistDraft(snapshot);
    }, 1500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [userAnswer, activeQuestionIndex, draftsLoaded, isSubmitting, isLeaving, persistDraft]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let cancelled = false;

    // Setup Webcam
    const startWebcam = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Webcam access is not supported in this browser");
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Permission may resolve after cleanup (including Strict Mode's remount).
        if (cancelled) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        activeStream = mediaStream;
        setHasWebcam(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Webcam access denied or unavailable", err);
        if (!cancelled) setHasWebcam(false);
      }
    };
    startWebcam();

    return () => {
      cancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const submitAnswer = async () => {
    if (actionInProgress.current || !draftsLoaded || !questions[activeQuestionIndex] || !userAnswer.trim()) return;

    actionInProgress.current = true;
    stopSpeech();
    setErrorMessage(null);
    setIsSubmitting(true);
    
    try {
      // Wait for outstanding saves before evaluation deletes the server draft.
      // A save failure need not prevent the answer itself from being submitted.
      await flushDraft();
      if (!isMounted.current) return;
      const res = await evaluateUserAnswer({
        interviewId,
        questionIndex: activeQuestionIndex,
        userAnswer: userAnswer
      });
      
      if (!res.success) {
        throw new Error(res.error || "Failed to evaluate answer");
      }
      if (!isMounted.current) return;
      
      // Clear the draft for the submitted question from local state
      setDrafts(prev => {
        const updated = { ...prev };
        delete updated[activeQuestionIndex];
        return updated;
      });
      setSaveStatus("idle");
      if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
      isUserDirty.current = false;
      
      if (activeQuestionIndex < questions.length - 1) {
        const nextIndex = activeQuestionIndex + 1;
        // Restore saved draft for next question, or fall back to starter template
        const nextDraft = drafts[nextIndex];
        const nextAnswer = nextDraft ?? (isCode
          ? getCodeTemplate(language, extractParamsFromQuestion(questions[nextIndex]?.question || ""))
          : "");
        latestDraft.current = {
          questionIndex: nextIndex,
          answer: nextAnswer,
          revision: latestDraft.current.revision + 1,
        };
        setUserAnswer(nextAnswer);
        setActiveQuestionIndex(nextIndex);
      } else {
        router.push(`/interview/${interviewId}/feedback`);
      }
    } catch (error) {
      console.error("Failed to submit answer", error);
      if (isMounted.current) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to submit answer. Please try again.");
      }
    } finally {
      actionInProgress.current = false;
      if (isMounted.current) setIsSubmitting(false);
    }
  };

  if (!questions || questions.length === 0 || !questions[activeQuestionIndex]) {
    return <div>No questions found for this assessment.</div>;
  }

  const currentQuestion = questions[activeQuestionIndex];

  const mcqData = parseMCQ(currentQuestion?.question || "");
  const isBusy = isSubmitting || isLeaving;

  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* Top Exit workspace action */}
      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
        <button
          type="button"
          onClick={handleLeaveSession}
          disabled={isBusy || !draftsLoaded}
          className="inline-flex items-center gap-1.5 text-secondary hover:text-red-600 transition-colors font-label-md text-label-md group font-semibold"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          Exit Workspace
        </button>
        <span role="status" className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-surface-cream text-on-surface-variant border border-outline-variant/30 uppercase tracking-wider">
          {!draftsLoaded ? "Loading drafts..." : (
            saveStatus === "saving" ? "Saving..." :
            saveStatus === "saved" ? "Saved ✓" :
            saveStatus === "error" ? "Save failed — edit to retry" : "Auto-Save On"
          )}
        </span>
      </div>

      {errorMessage && (
        <div role="alert" className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {errorMessage}
        </div>
      )}

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
                disabled={isBusy}
                aria-pressed={isSpeaking}
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
              {mcqData.options.length === 0 && (
                <p role="alert" className="text-sm text-red-600">
                  No answer options could be read. Please return to the dashboard and create a new assessment.
                </p>
              )}
              <div className="flex flex-col gap-3">
                {mcqData.options.map((option, idx) => {
                  const isSelected = userAnswer === option;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isBusy}
                      aria-pressed={isSelected}
                      onClick={() => handleAnswerChange(option)}
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
                disabled={isBusy}
                aria-label="Programming language"
                onChange={(e) => {
                  const newLang = e.target.value;
                  const currentTemplate = getCodeTemplate(language, extractParamsFromQuestion(currentQuestion?.question || ""));
                  if (userAnswer.trim() && userAnswer !== currentTemplate && !window.confirm("Changing languages replaces your current code with a starter template. Continue?")) return;
                  setLanguage(newLang);
                  const extractedParams = extractParamsFromQuestion(currentQuestion?.question || "");
                  handleAnswerChange(getCodeTemplate(newLang, extractedParams));
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
                onChange={(value) => handleAnswerChange(value ?? "")}
                options={{
                  readOnly: isBusy,
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
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={isBusy}
                aria-label="Your answer"
              />
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleLeaveSession}
            disabled={isBusy || !draftsLoaded}
            className="w-full sm:w-auto h-12 px-6 text-base text-red-600 hover:text-red-700 hover:bg-red-50/50 border border-transparent hover:border-red-100 transition-all font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">exit_to_app</span>
            {isLeaving ? "Saving & Leaving..." : "Leave Assessment"}
          </Button>

          <Button 
            type="button"
            onClick={submitAnswer} 
            disabled={isBusy || !draftsLoaded || !userAnswer.trim() || (isMCQ && !mcqData.options.includes(userAnswer))}
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
