"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/app/dashboard/Sidebar";

interface UserAnswer {
  id: string;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  feedback: string;
  rating: number;
}

interface FeedbackClientProps {
  interview: {
    id: string;
    jobPosition: string;
    jobExperience: number;
    createdAt: Date;
    jobDesc: string;
  };
  answers: UserAnswer[];
  averageScore: number;
  user: any;
  onSignOut: () => Promise<void>;
}

export default function FeedbackClient({
  interview,
  answers,
  averageScore,
  user,
  onSignOut,
}: FeedbackClientProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // expand first by default

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Format date helper
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  // Parse interview type
  const typeMatch = interview.jobDesc?.match(/^\[Type:\s*([^\]]+)\]/);
  const interviewType = typeMatch ? typeMatch[1] : "dsa";
  const isMCQ = interviewType === "mcq" || interviewType.includes("mcq");
  const isBehavioral = interviewType.startsWith("behavioral");
  const isSystemDesign = interviewType.startsWith("system_design");

  // Dynamic assessment text
  let summaryText = "";
  let keyTakeaway = "";
  let performanceBadge = "";
  let strengthsIcon = "trending_up";
  let strengths: { title: string; desc: string }[] = [];
  let improvements: { title: string; desc: string }[] = [];

  const sortedAnswers = [...answers].sort((a, b) => b.rating - a.rating);
  const highestAns = sortedAnswers[0];
  const lowestAns = sortedAnswers[sortedAnswers.length - 1];
  const highestIdx = answers.indexOf(highestAns) + 1;
  const lowestIdx = answers.indexOf(lowestAns) + 1;

  if (isMCQ) {
    if (averageScore >= 8) {
      performanceBadge = "Strong Accuracy";
      summaryText = `You demonstrated excellent technical comprehension and theoretical correctness. Your choices show a deep, precise understanding of core concepts with minimal errors.`;
      keyTakeaway = `Excellent job! Keep practicing advanced theoretical concepts to maintain your high accuracy.`;
      strengthsIcon = "trending_up";
      strengths = [
        {
          title: "Concept Mastery",
          desc: highestAns?.rating >= 8
            ? `Excelled on Q${highestIdx} with a score of ${highestAns.rating}/10, displaying clear conceptual understanding.`
            : "Consistently delivered correct answers with strong theoretical foundations."
        },
        {
          title: "No Fallacy",
          desc: "Successfully avoided distractor choices designed to catch common technical misconceptions."
        }
      ];
      improvements = [
        {
          title: "Concept Edge Cases",
          desc: lowestAns && lowestAns.rating < 8
            ? `Q${lowestIdx} scored ${lowestAns.rating}/10. Review standard specifications and corner cases for this module.`
            : "Review advanced specifications and micro-behaviors of key protocols and OS kernels."
        }
      ];
    } else if (averageScore >= 6) {
      performanceBadge = "Good Progress";
      summaryText = `You showed solid foundational knowledge of the theoretical material. Most questions were answered correctly, though some gaps remain in specific core concepts.`;
      keyTakeaway = `Review the detailed solutions for the incorrect questions to address specific conceptual gaps.`;
      strengthsIcon = "trending_flat";
      strengths = [
        {
          title: "Core Comprehension",
          desc: highestAns?.rating >= 7
            ? `Showed good understanding on Q${highestIdx} with a score of ${highestAns.rating}/10.`
            : "Demonstrated familiarity with standard paradigms and protocols."
        },
        {
          title: "Option Elimination",
          desc: "Successfully eliminated obviously incorrect options on most questions."
        }
      ];
      improvements = [
        {
          title: "Concept Precision",
          desc: lowestAns
            ? `Q${lowestIdx} was a weak point (${lowestAns.rating}/10). Review the underlying fundamentals for this question.`
            : "Focus on complete answers that address every aspect of the question prompt."
        }
      ];
    } else if (averageScore >= 4) {
      performanceBadge = "Needs Practice";
      summaryText = `You showed familiarity with some terms, but had significant gaps in theoretical accuracy. Several choices fell for distractor options.`;
      keyTakeaway = `Spend more time studying the core reference materials and documentation before attempting the next quiz.`;
      strengthsIcon = "trending_down";
      strengths = [
        {
          title: "Basic Recall",
          desc: "Recognized standard terminology and base paradigms."
        },
        {
          title: "Attempt Rate",
          desc: "Attempted all multiple-choice questions, which is a great baseline."
        }
      ];
      improvements = [
        {
          title: "Avoid Pitfalls",
          desc: lowestAns
            ? `Q${lowestIdx} rated lowest (${lowestAns.rating}/10). Review incorrect responses to understand why distractor options looked appealing.`
            : "Review incorrect responses to avoid falling for distractor options."
        }
      ];
    } else {
      performanceBadge = "Needs Core Prep";
      summaryText = `Your score indicates that most choices were incorrect or skipped. You need to focus on building a stronger baseline of core technical fundamentals.`;
      keyTakeaway = `Re-study the fundamentals of the selected topics from the ground up before retaking.`;
      strengthsIcon = "trending_down";
      strengths = [
        {
          title: "Baseline Established",
          desc: "Completed the assessment loop, establishing a baseline to measure future growth."
        }
      ];
      improvements = [
        {
          title: "Fundamental Study",
          desc: "Spend time reviewing textbooks and documentation on core architectures, algorithms, and networks."
        }
      ];
    }
  } else if (isBehavioral) {
    if (averageScore >= 8) {
      performanceBadge = "Strong Delivery";
      summaryText = `You demonstrated exceptional communication and leadership qualities. Your scenarios were structured using the STAR method, showing clear action and impact.`;
      keyTakeaway = `Great delivery! Continue framing your leadership experiences with concrete, metrics-driven outcomes.`;
      strengthsIcon = "trending_up";
      strengths = [
        {
          title: "STAR Framework Mastery",
          desc: highestAns?.rating >= 8
            ? `Excelled on Q${highestIdx} with a score of ${highestAns.rating}/10, demonstrating strong situational structure.`
            : "Consistently used Situation, Task, Action, and Result formats effectively."
        },
        {
          title: "Communication Clarity",
          desc: "Articulated conflicts, collaboration, and priorities cleanly."
        }
      ];
      improvements = [
        {
          title: "Impact Quantification",
          desc: lowestAns && lowestAns.rating < 8
            ? `Q${lowestIdx} scored ${lowestAns.rating}/10. Try incorporating more numeric metrics (e.g. percentages, timelines) in this response.`
            : "Always try to include concrete metrics to back up the results of your projects."
        }
      ];
    } else if (averageScore >= 6) {
      performanceBadge = "Good Progress";
      summaryText = `You showed solid communication and structured thinking. Most answers hit the core behavioral expectations, with minor opportunities to strengthen the action or impact sections.`;
      keyTakeaway = `Focus on detailing your personal contributions (what YOU did) rather than speaking generally about team efforts.`;
      strengthsIcon = "trending_flat";
      strengths = [
        {
          title: "Clear Storytelling",
          desc: "Explanations were mostly structured and easy to follow."
        },
        {
          title: "Empathy & Ownership",
          desc: "Demonstrated good ownership values and team collaboration principles."
        }
      ];
      improvements = [
        {
          title: "Result Detail",
          desc: lowestAns
            ? `Q${lowestIdx} was a weak point (${lowestAns.rating}/10). Make sure to state the final outcome clearly.`
            : "Spend more time describing the resolution and aftermath of the conflicts described."
        }
      ];
    } else if (averageScore >= 4) {
      performanceBadge = "Needs Practice";
      summaryText = `Your answers hit the base topics, but lack depth or structure. Some responses were too brief or missed the specific actions you took.`;
      keyTakeaway = `Practice writing out full stories using the STAR framework to ensure completeness and clarity.`;
      strengthsIcon = "trending_down";
      strengths = [
        {
          title: "Active Participation",
          desc: "Shared real-life examples and scenarios for the questions."
        }
      ];
      improvements = [
        {
          title: "Use STAR Method",
          desc: lowestAns
            ? `Q${lowestIdx} rated lowest (${lowestAns.rating}/10). Re-frame this answer explicitly around Situation, Task, Action, and Result.`
            : "Re-frame your behavioral stories explicitly around the STAR framework (Situation, Task, Action, Result)."
        }
      ];
    } else {
      performanceBadge = "Needs Core Prep";
      summaryText = `Your answers in this session were very brief, incomplete, or skipped, making it hard to evaluate your soft skills.`;
      keyTakeaway = `Prepare 3-4 personal work stories that can be adapted to common leadership and conflict scenarios.`;
      strengthsIcon = "trending_down";
      strengths = [
        {
          title: "Baseline Established",
          desc: "Completed the assessment, setting a baseline to track your behavioral delivery."
        }
      ];
      improvements = [
        {
          title: "Provide Detailed Stories",
          desc: "Avoid brief or one-word answers. Share detailed stories about team collaboration, conflicts, and challenges."
        }
      ];
    }
  } else if (isSystemDesign) {
    if (averageScore >= 8) {
      performanceBadge = "Strong Architecture";
      summaryText = `You demonstrated strong architectural thinking and scalability principles. Your design choices for load balancing, caching, and databases were highly optimal.`;
      keyTakeaway = `Superb design! Focus on micro-optimizations and cost-efficiency trade-offs in your next session.`;
      strengthsIcon = "trending_up";
      strengths = [
        {
          title: "Scalability Mindset",
          desc: highestAns?.rating >= 8
            ? `Excelled on Q${highestIdx} with a score of ${highestAns.rating}/10, showcasing a solid scaling strategy.`
            : "Designed systems with horizontal scaling, load distribution, and low latency in mind."
        },
        {
          title: "Trade-off Analysis",
          desc: "Clearly compared database choices (SQL vs NoSQL) and caching strategies."
        }
      ];
      improvements = [
        {
          title: "Failure Modes",
          desc: lowestAns && lowestAns.rating < 8
            ? `Q${lowestIdx} scored ${lowestAns.rating}/10. Expand on disaster recovery, failovers, and backup strategies for high availability.`
            : "Review failover strategies, consistency models (e.g. eventual consistency), and data partitioning edge cases."
        }
      ];
    } else if (averageScore >= 6) {
      performanceBadge = "Good Progress";
      summaryText = `You showed solid foundational knowledge of scalability and design principles. Most answers hit the core requirements, though there were minor gaps in database selections or caching strategies.`;
      keyTakeaway = `Focus on explaining trade-offs and alternative architectures to elevate your system designs.`;
      strengthsIcon = "trending_flat";
      strengths = [
        {
          title: "Component Understanding",
          desc: "Correctly identified key components like databases, caches, load balancers, and CDNs."
        },
        {
          title: "Logical Design Flow",
          desc: "Explanations were mostly structured and easy to follow."
        }
      ];
      improvements = [
        {
          title: "Architectural Depth",
          desc: lowestAns
            ? `Q${lowestIdx} was a weak point (${lowestAns.rating}/10). Add more details about network layouts or database indexing.`
            : "Elaborate more on specific protocol choices (e.g. gRPC, WebSockets, REST)."
        }
      ];
    } else if (averageScore >= 4) {
      performanceBadge = "Needs Practice";
      summaryText = `You showed some awareness of system design, but there are significant gaps in database choices, API designs, or scaling strategies.`;
      keyTakeaway = `Review system design templates (e.g. TinyURL, Pastebin) and practice mapping out system components.`;
      strengthsIcon = "trending_down";
      strengths = [
        {
          title: "Basic awareness",
          desc: "Familiar with standard architectural components like databases and caches."
        }
      ];
      improvements = [
        {
          title: "Avoid Vague Explanations",
          desc: lowestAns
            ? `Q${lowestIdx} rated lowest (${lowestAns.rating}/10). Provide step-by-step descriptions of the data flow instead of listing components.`
            : "Provide detailed descriptions of your system's data flow and component interactions."
        }
      ];
    } else {
      performanceBadge = "Needs Core Prep";
      summaryText = `Your answers in this session were very brief, incomplete, or blank, indicating that you did not attempt the designs.`;
      keyTakeaway = `Study standard system design frameworks (like the CIRCLES method) to help structure your answers.`;
      strengthsIcon = "trending_down";
      strengths = [
        {
          title: "Baseline Established",
          desc: "Completed the assessment, setting a baseline to track your design skills."
        }
      ];
      improvements = [
        {
          title: "Provide Detailed Architectures",
          desc: "Avoid brief or one-word answers. Explain database choices, caching, and rate limiting in detail."
        }
      ];
    }
  } else {
    // Default (DSA/Coding)
    if (averageScore >= 8) {
      performanceBadge = "Strong Performance";
      summaryText = `You demonstrated excellent technical competence and problem-solving skills in this session. Your code was highly accurate, well-structured, and met all core requirements.`;
      keyTakeaway = `Excellent job! Keep practicing advanced algorithmic patterns and dynamic programming to maintain your edge.`;
      strengthsIcon = "trending_up";
      strengths = [
        {
          title: "Algorithmic Logic",
          desc: highestAns?.rating >= 8
            ? `Excelled on Q${highestIdx} with a score of ${highestAns.rating}/10, demonstrating strong logical correctness.`
            : "Consistently wrote correct algorithms matching the best possible time and space bounds."
        },
        {
          title: "Code Quality",
          desc: "Wrote clean, readable, and structured code that followed programming conventions."
        }
      ];
      improvements = [
        {
          title: "Edge Cases & Optimizations",
          desc: lowestAns && lowestAns.rating < 8
            ? `Q${lowestIdx} scored ${lowestAns.rating}/10. Review input validation and edge cases for this solution.`
            : "Review advanced optimizations and boundary input values (e.g. empty lists, overflow protection)."
        }
      ];
    } else if (averageScore >= 6) {
      performanceBadge = "Good Progress";
      summaryText = `You showed solid foundational knowledge and coding correctness. Most solutions hit the core requirements, though there were minor gaps in code optimization or edge case handling.`;
      keyTakeaway = `Focus on explaining time/space complexities and edge cases to elevate your answers to a senior level.`;
      strengthsIcon = "trending_flat";
      strengths = [
        {
          title: "Solid Foundations",
          desc: highestAns?.rating >= 7
            ? `Showed good understanding on Q${highestIdx} with a score of ${highestAns.rating}/10.`
            : "Demonstrated familiarity with standard data structures and control flow."
        },
        {
          title: "Logical Flow",
          desc: "Explanations and code logic were mostly structured and easy to follow."
        }
      ];
      improvements = [
        {
          title: "Technical Completeness",
          desc: lowestAns
            ? `Q${lowestIdx} was a weak point (${lowestAns.rating}/10). Add more detailed logic and correct complexity bounds.`
            : "Focus on complete solutions that compile and run cleanly."
        }
      ];
    } else if (averageScore >= 4) {
      performanceBadge = "Needs Practice";
      summaryText = `You showed some effort, but there are significant gaps in technical accuracy or syntax compared to the ideal solutions. Some code missed critical requirements.`;
      keyTakeaway = `Review the suggested correct code solutions and practice coding algorithms from scratch.`;
      strengthsIcon = "trending_down";
      strengths = [
        {
          title: "Active Participation",
          desc: "Attempted to solve the coding questions and shared initial logical approaches."
        }
      ];
      improvements = [
        {
          title: "Syntax & Logic Correctness",
          desc: lowestAns
            ? `Q${lowestIdx} rated lowest (${lowestAns.rating}/10). Review the solution syntax and algorithmic logic for this topic.`
            : "Review correct code solutions and practice basic algorithm control structures."
        }
      ];
    } else {
      performanceBadge = "Needs Core Prep";
      summaryText = `Your answers in this session were very brief, incomplete, or blank, indicating that you did not attempt the coding questions.`;
      keyTakeaway = `Focus on coding basic problems on easy arrays and strings to rebuild your confidence.`;
      strengthsIcon = "trending_down";
      strengths = [
        {
          title: "Baseline Established",
          desc: "Completed the assessment loop, establishing a baseline to track your coding progress."
        }
      ];
      improvements = [
        {
          title: "Attempt All Problems",
          desc: "Write out syntax-valid code solutions, even if they are brute-force, rather than submitting blanks."
        }
      ];
    }
  }

  // SVG Radial progress calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29
  const dashoffset = circumference - (circumference * (averageScore * 10)) / 100;

  return (
    <div className="bg-surface-cream text-on-surface font-body-md min-h-screen flex selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Sidebar Layout */}
      <Sidebar user={user} onSignOut={onSignOut} />

      {/* Main Content Canvas */}
      <main className="w-full md:ml-64 p-margin-mobile md:p-margin-desktop pt-24 md:pt-margin-desktop min-h-screen flex flex-col max-w-container-max mx-auto">
        
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 mt-8 md:mt-0">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-body-sm text-body-sm mb-4"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Dashboard
            </Link>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
              Assessment Feedback
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 flex flex-wrap items-center gap-2">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              {formatDate(interview.createdAt)} • {answers.length} Questions • {interview.jobPosition} ({interview.jobExperience} Years Exp)
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="px-6 py-2 rounded-full border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors"
            >
              Print Report
            </button>
            <Link href="/dashboard/new">
              <button className="px-6 py-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md hover:bg-surface-tint hover:text-on-primary transition-colors shadow-sm">
                New Session
              </button>
            </Link>
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-section-gap">
          {/* Overall Score Card (Span 4) */}
          <section className="col-span-1 md:col-span-4 bg-surface-white rounded-xl p-8 shadow-[0_4px_20px_rgba(26,28,35,0.04)] border border-outline-variant/20 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 duration-300">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6 w-full text-left">Overall Score</h3>
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Radial Gauge SVG */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 origin-center" viewBox="0 0 120 120">
                {/* Background Circle */}
                <circle 
                  className="text-surface-variant" 
                  cx="60" 
                  cy="60" 
                  fill="none" 
                  r={radius} 
                  stroke="currentColor" 
                  strokeWidth="8"
                />
                {/* Progress Circle */}
                <circle 
                  className="text-primary-container drop-shadow-md transition-all duration-1000 ease-out" 
                  cx="60" 
                  cy="60" 
                  fill="none" 
                  r={radius} 
                  stroke="currentColor" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={dashoffset}
                  strokeLinecap="round" 
                  strokeWidth="8"
                />
              </svg>
              {/* Score Text */}
              <div className="flex flex-col items-center">
                <span className="font-display-lg text-display-lg text-on-surface font-bold tracking-tighter">
                  {averageScore}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">/ 10</span>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 bg-surface-container-low px-4 py-2 rounded-full">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">
                {performanceBadge}
              </span>
            </div>
          </section>

          {/* Assessment Summary Card (Span 8) */}
          <section className="col-span-1 md:col-span-8 bg-surface-white rounded-xl p-8 shadow-[0_4px_20px_rgba(26,28,35,0.04)] border border-outline-variant/20 flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Assessment Summary</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 leading-relaxed">
              {summaryText}
            </p>
            <div className="bg-surface-cream border border-outline-variant/40 rounded-lg p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lightbulb
                </span>
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-on-surface mb-1">Key Takeaway</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {keyTakeaway}
                </p>
              </div>
            </div>
          </section>

          {/* Performance Matrix: Strengths (Span 6) */}
          <section className="col-span-1 md:col-span-6 bg-surface-white rounded-xl p-8 shadow-[0_4px_20px_rgba(26,28,35,0.04)] border border-outline-variant/20 transition-transform hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-fixed text-sm">{strengthsIcon}</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Strengths</h3>
            </div>
            <ul className="space-y-4">
              {strengths.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-0.5 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <div>
                    <span className="font-label-md text-label-md text-on-surface block mb-1">
                      {item.title}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {item.desc}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Performance Matrix: Areas for Improvement (Span 6) */}
          <section className="col-span-1 md:col-span-6 bg-surface-white rounded-xl p-8 shadow-[0_4px_20px_rgba(26,28,35,0.04)] border border-outline-variant/20 transition-transform hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">build</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Areas for Improvement</h3>
            </div>
            <ul className="space-y-4">
              {improvements.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary mt-0.5 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    arrow_right
                  </span>
                  <div>
                    <span className="font-label-md text-label-md text-on-surface block mb-1">
                      {item.title}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {item.desc}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Final Recommendation / Study Plan Card */}
        <section className="bg-surface-cream border-2 border-outline-variant/30 rounded-2xl p-8 md:p-12 mb-section-gap relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-fixed rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full mb-6 border border-outline-variant/50">
              <span className="material-symbols-outlined text-primary-container text-sm">route</span>
              <span className="font-label-md text-label-md text-on-surface-variant">Next Steps</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Focused Study Plan</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">
              Based on this session, ApexOA recommends focusing on analytical and metrics-driven questions to round out your skillset before the actual interview.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/dashboard" className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20 hover:border-primary-container/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary group-hover:text-primary-container transition-colors">bar_chart</span>
                  <span className="font-label-md text-label-md text-on-surface">Metrics & A/B Testing Module</span>
                </div>
                <span className="material-symbols-outlined text-secondary group-hover:text-primary-container transition-colors">arrow_forward</span>
              </Link>
              <Link href="/dashboard/new" className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20 hover:border-primary-container/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary group-hover:text-primary-container transition-colors">timer</span>
                  <span className="font-label-md text-label-md text-on-surface">Time-boxed Practice Session</span>
                </div>
                <span className="material-symbols-outlined text-secondary group-hover:text-primary-container transition-colors">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Detailed Review (Accordion Sections) */}
        <section className="mb-section-gap">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-8">Detailed Review</h3>
          <div className="space-y-4">
            {answers.map((item, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <div key={item.id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-container-low transition-colors focus:outline-none"
                  >
                    <div className="flex gap-4 items-start">
                      <span className="font-headline-sm text-headline-sm text-on-surface-variant w-6">
                        {index + 1}.
                      </span>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface mb-1 leading-snug">
                          {item.question}
                        </h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-label-md bg-surface-container text-on-surface-variant">
                            Rating Detail
                          </span>
                          <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-secondary">
                            <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span> 
                            {item.rating}/10
                          </span>
                        </div>
                      </div>
                    </div>
                    <span 
                      className="material-symbols-outlined text-secondary transition-transform duration-300"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Collapsible Content */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isExpanded ? "max-h-[1000px] border-t border-outline-variant/10 px-6 pb-6 pt-4" : "max-h-0 overflow-hidden"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: User Answer */}
                      <div className="space-y-3">
                        <h5 className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">record_voice_over</span> 
                          Your Answer
                        </h5>
                        <div className="bg-surface-cream p-4 rounded-lg font-body-sm text-body-sm text-on-surface-variant italic leading-relaxed border-l-4 border-outline-variant">
                          "{item.userAnswer}"
                        </div>
                        <h5 className="font-label-md text-label-md text-green-600 flex items-center gap-2 mt-4">
                          <span className="material-symbols-outlined text-[18px]">check_circle</span> 
                          Ideal Correct Answer
                        </h5>
                        <div className="bg-green-50/50 p-4 rounded-lg font-body-sm text-body-sm text-green-800 leading-relaxed border-l-4 border-green-400">
                          {item.correctAnswer}
                        </div>
                      </div>

                      {/* Right: Assessor Critique */}
                      <div className="space-y-3">
                        <h5 className="font-label-md text-label-md text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">rate_review</span> 
                          Assessor Critique
                        </h5>
                        <div className="bg-primary-fixed/20 p-4 rounded-lg font-body-sm text-body-sm text-on-surface leading-relaxed border-l-4 border-primary">
                          {item.feedback}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
