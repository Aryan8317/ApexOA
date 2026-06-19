"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateMockInterview } from "@/app/actions/interview.actions";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    jobExperience: 2, // Junior default
    questionCount: 5, // 5 questions default
  });

  const [selectedRole, setSelectedRole] = useState("Frontend Engineer");
  const [roleType, setRoleType] = useState<"dsa" | "system_design" | "cs_core" | "behavioral">("dsa");
  const [assessmentFormat, setAssessmentFormat] = useState<"code" | "mcq" | "text">("code");
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "React", "Next.js", "TypeScript", "TailwindCSS", "Zustand/Redux"
  ]);
  const [customRoleText, setCustomRoleText] = useState("");
  const [customTopicText, setCustomTopicText] = useState("");

  const experienceLevels = [
    { label: "Intern", years: 0 },
    { label: "Junior", years: 2 },
    { label: "Mid-Level", years: 5 },
    { label: "Senior", years: 8 },
  ];

  const questionCounts = [
    { label: "3 Questions", count: 3, duration: "~15 mins" },
    { label: "5 Questions", count: 5, duration: "~30 mins" },
    { label: "10 Questions", count: 10, duration: "~60 mins" },
  ];

  const roleTemplates: Record<string, { topics: string[]; type: "dsa" | "system_design" | "cs_core" | "behavioral" }> = {
    "Frontend Engineer": {
      topics: ["React", "Next.js", "TypeScript", "TailwindCSS", "Zustand/Redux", "Web Vitals"],
      type: "dsa"
    },
    "Backend Engineer": {
      topics: ["Node.js", "Express", "PostgreSQL", "Prisma ORM", "REST/GraphQL APIs", "Redis Caching"],
      type: "dsa"
    },
    "Full Stack Engineer": {
      topics: ["React", "Next.js", "Node.js", "Prisma", "PostgreSQL", "TailwindCSS"],
      type: "dsa"
    },
    "System Architect": {
      topics: ["Scalability", "Microservices", "Load Balancers", "Rate Limiters", "Database Partitioning", "Caching Strategies"],
      type: "system_design"
    },
    "Algorithms Specialist": {
      topics: ["Trees & Graphs", "Dynamic Programming", "Sorting/Searching", "Recursion", "Big O Complexity"],
      type: "dsa"
    },
    "CS Core Fundamentals": {
      topics: ["Operating Systems", "Computer Networks", "DBMS", "SQL Queries", "ACID Transactions", "CPU Scheduling"],
      type: "cs_core"
    },
    "Behavioral & Lead": {
      topics: ["STAR Framework", "Conflict Resolution", "Engineering Leadership", "Project Prioritization", "Stakeholder Management"],
      type: "behavioral"
    },
    "Custom": {
      topics: [],
      type: "dsa"
    }
  };

  const topicBankByType: Record<string, string[]> = {
    dsa: [
      "React", "Next.js", "TypeScript", "TailwindCSS", "Zustand/Redux", "Web Vitals", "HTML/CSS", "Webpack", "Redux Toolkit",
      "Node.js", "Express", "PostgreSQL", "Prisma ORM", "REST/GraphQL APIs", "Redis Caching", "MongoDB", "Docker", "Go", "Java", "Spring Boot",
      "Trees & Graphs", "Dynamic Programming", "Sorting/Searching", "Recursion", "Big O Complexity", "Hash Tables", "Binary Search"
    ],
    system_design: [
      "Scalability", "Microservices", "Load Balancers", "Rate Limiters", "Database Partitioning", "Caching Strategies", "Message Queues", "CDN", "SQL vs NoSQL", "Consistency & Availability", "DNS"
    ],
    cs_core: [
      "Operating Systems", "Computer Networks", "DBMS", "SQL Queries", "ACID Transactions", "CPU Scheduling", "IP Addressing", "Memory Management", "General Programming Concepts"
    ],
    behavioral: [
      "STAR Framework", "Conflict Resolution", "Engineering Leadership", "Project Prioritization", "Stakeholder Management", "Team Mentorship", "Situational Response"
    ]
  };

  const predefinedRoles = [
    {
      title: "Frontend Architect",
      desc: "Modern React, Next.js 16, TypeScript, TailwindCSS, State Management (Zustand/Redux), web vitals, and rendering strategies.",
      icon: "web",
      type: "dsa",
      badge: "Coding / DSA",
      topics: ["React", "Next.js", "TypeScript", "TailwindCSS", "Zustand/Redux", "Web Vitals"],
      defaultFormat: "code" as const
    },
    {
      title: "Backend Core Engineer",
      desc: "Node.js, Express, PostgreSQL, Prisma ORM, REST/GraphQL APIs, Redis caching, and server-side optimization.",
      icon: "dns",
      type: "dsa",
      badge: "Coding / DSA",
      topics: ["Node.js", "Express", "PostgreSQL", "Prisma ORM", "REST/GraphQL APIs", "Redis Caching"],
      defaultFormat: "code" as const
    },
    {
      title: "System Design Lead",
      desc: "High-scale architecture, microservices, load balancers, database scaling (SQL vs NoSQL), and caching strategies.",
      icon: "lan",
      type: "system_design",
      badge: "System Design",
      topics: ["Scalability", "Microservices", "Load Balancers", "Rate Limiters", "Database Partitioning", "Caching Strategies"],
      defaultFormat: "text" as const
    },
    {
      title: "Algorithms Specialist",
      desc: "Trees, graphs, dynamic programming, sorting/searching algorithms, and Big O space/time complexity bounds.",
      icon: "terminal",
      type: "dsa",
      badge: "Coding / DSA",
      topics: ["Trees & Graphs", "Dynamic Programming", "Sorting/Searching", "Recursion", "Big O Complexity"],
      defaultFormat: "code" as const
    },
    {
      title: "CS Core Fundamentals",
      desc: "Operating Systems (processes, scheduling, memory), Computer Networks (OSI layers, TCP/UDP, HTTP), and DBMS (SQL, ACID, indexing).",
      icon: "menu_book",
      type: "mcq", // Maps to cs_core under the hood
      badge: "MCQ Quiz",
      topics: ["Operating Systems", "Computer Networks", "DBMS", "SQL Queries", "ACID Transactions", "CPU Scheduling"],
      defaultFormat: "mcq" as const
    },
    {
      title: "Behavioral & Lead STAR",
      desc: "Conflict resolution, engineering leadership, project management, and STAR methodology scenarios.",
      icon: "groups",
      type: "behavioral",
      badge: "Behavioral",
      topics: ["STAR Framework", "Conflict Resolution", "Engineering Leadership", "Project Prioritization", "Stakeholder Management"],
      defaultFormat: "text" as const
    }
  ];

  const handleRoleTypeChange = (newType: "dsa" | "system_design" | "cs_core" | "behavioral") => {
    setRoleType(newType);
    
    // Auto-adjust format if current format is not allowed for the new type
    if (newType === "behavioral") {
      setAssessmentFormat("text");
    } else if (newType === "system_design" || newType === "cs_core") {
      if (assessmentFormat === "code") {
        setAssessmentFormat(newType === "cs_core" ? "mcq" : "text");
      }
    }
  };

  const isCodeDisabled = roleType !== "dsa";
  const isMcqDisabled = roleType === "behavioral";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalJobPosition = selectedRole === "Custom" ? customRoleText.trim() : selectedRole;
    const finalJobDesc = selectedTopics.join(", ");

    if (!finalJobPosition) {
      setError("Please specify a target job title or role.");
      return;
    }
    if (selectedTopics.length === 0) {
      setError("Please select or add at least one topic focus tag.");
      return;
    }

    setLoading(true);
    setError(null);

    // Map roleType and assessmentFormat to final interviewType string
    let finalInterviewType = "";
    if (roleType === "dsa") {
      if (assessmentFormat === "code") finalInterviewType = "dsa";
      else if (assessmentFormat === "mcq") finalInterviewType = "dsa_mcq";
      else finalInterviewType = "dsa_text";
    } else if (roleType === "system_design") {
      if (assessmentFormat === "mcq") finalInterviewType = "system_design_mcq";
      else finalInterviewType = "system_design";
    } else if (roleType === "cs_core") {
      if (assessmentFormat === "mcq") finalInterviewType = "mcq";
      else finalInterviewType = "cs_core_text";
    } else {
      // behavioral
      finalInterviewType = "behavioral";
    }

    try {
      const result = await generateMockInterview({
        jobPosition: finalJobPosition,
        jobDesc: finalJobDesc,
        jobExperience: formData.jobExperience,
        interviewType: finalInterviewType,
        questionCount: formData.questionCount,
      });

      if (result.success && result.interviewId) {
        router.push(`/interview/${result.interviewId}`);
      } else {
        setError(result.error || "Failed to generate interview. Please check your API configuration and try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while generating your interview.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1000px] flex flex-col gap-8 mx-auto">
      {/* Back Link */}
      <div className="w-full">
        <Link
          className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-label-md text-label-md group"
          href="/dashboard"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          ← Back to Dashboard
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-surface-white rounded-xl shadow-[0px_4px_20px_rgba(26,28,35,0.04)] p-8 md:p-12 border border-outline-variant/30 flex flex-col gap-10 relative overflow-hidden">
        {/* Decorative subtle blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-[80px] -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col gap-2">
          <h2 className="font-headline-md text-headline-md text-on-surface">Configure Your Mock Assessment</h2>
          <p className="font-body-md text-body-md text-secondary">Tailor your mock assessment session to match your upcoming real-world challenges.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Section 1: Role & Context */}
          <div className="flex flex-col gap-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">1. Role & Context</h3>
            
            {/* Clickable Quick Predefined Options */}
            <div className="flex flex-col gap-4">
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Predefined Quick Templates:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedRoles.map((role) => {
                  const isSelected = selectedRole === (role.title.includes("Frontend") ? "Frontend Engineer" : role.title.includes("Backend") ? "Backend Engineer" : role.title.includes("Design") ? "System Architect" : role.title.includes("Algorithms") ? "Algorithms Specialist" : role.title.includes("CS Core") ? "CS Core Fundamentals" : role.title.includes("Behavioral") ? "Behavioral & Lead" : "Custom");
                  return (
                    <button
                      key={role.title}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        const mappedRoleName = role.title.includes("Frontend") ? "Frontend Engineer" : role.title.includes("Backend") ? "Backend Engineer" : role.title.includes("Design") ? "System Architect" : role.title.includes("Algorithms") ? "Algorithms Specialist" : role.title.includes("CS Core") ? "CS Core Fundamentals" : role.title.includes("Behavioral") ? "Behavioral & Lead" : "Custom";
                        
                        const typeMap: Record<string, "dsa" | "system_design" | "cs_core" | "behavioral"> = {
                          dsa: "dsa",
                          system_design: "system_design",
                          mcq: "cs_core",
                          behavioral: "behavioral"
                        };
                        const newType = typeMap[role.type] || "dsa";

                        setSelectedRole(mappedRoleName);
                        setSelectedTopics(role.topics);
                        handleRoleTypeChange(newType);
                        setAssessmentFormat(role.defaultFormat);
                      }}
                      className={`text-left p-5 rounded-2xl border bg-surface-cream/40 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between min-h-[170px] ${
                        isSelected
                          ? "border-primary bg-primary-fixed/10 ring-1 ring-primary"
                          : "border-outline-variant/30 hover:border-primary-container"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className={`w-9 h-9 rounded-xl bg-surface-white flex items-center justify-center shadow-sm ${isSelected ? 'text-primary' : 'text-secondary-fixed'}`}>
                            <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-white text-on-surface-variant border border-outline-variant/30">
                            {role.badge}
                          </span>
                        </div>
                        <h4 className="font-label-md text-label-md text-on-surface mb-1 font-semibold group-hover:text-primary transition-colors">
                          {role.title}
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                          {role.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-6 mt-6 p-6 bg-surface-cream/30 border border-outline-variant/20 rounded-2xl">
              
              {/* Role Select Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="role_select">
                  Select Target Role / Profile
                </label>
                <select
                  id="role_select"
                  disabled={loading}
                  value={selectedRole}
                  onChange={(e) => {
                    const role = e.target.value;
                    setSelectedRole(role);
                    setSelectedTopics(roleTemplates[role].topics);
                    
                    const newType = roleTemplates[role].type;
                    handleRoleTypeChange(newType);
                  }}
                  className="w-full bg-surface-white border border-outline-variant/60 focus:border-primary focus:ring-0 rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface transition-colors cursor-pointer"
                >
                  {Object.keys(roleTemplates).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Custom Role Title Text Input & Category Select */}
              {selectedRole === "Custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="custom_role">
                      Specify Custom Role Title
                    </label>
                    <input
                      type="text"
                      id="custom_role"
                      required
                      disabled={loading}
                      value={customRoleText}
                      onChange={(e) => setCustomRoleText(e.target.value)}
                      placeholder="e.g. Senior iOS Developer"
                      className="w-full bg-surface-white border border-outline-variant/60 focus:border-primary focus:ring-0 rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="custom_role_type">
                      Role Category / Domain
                    </label>
                    <select
                      id="custom_role_type"
                      disabled={loading}
                      value={roleType}
                      onChange={(e) => handleRoleTypeChange(e.target.value as any)}
                      className="w-full bg-surface-white border border-outline-variant/60 focus:border-primary focus:ring-0 rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface transition-colors cursor-pointer"
                    >
                      <option value="dsa">Coding / DSA</option>
                      <option value="system_design">System Design</option>
                      <option value="cs_core">CS Core Fundamentals</option>
                      <option value="behavioral">Behavioral & Lead</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tag-Based Topic Builder */}
              <div className="flex flex-col gap-3 mt-2">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Selected Focus Areas / Topics
                </label>
                
                {/* Topic Pills */}
                <div className="flex flex-wrap gap-2 min-h-[50px] p-3.5 bg-surface-white border border-outline-variant/50 rounded-xl">
                  {selectedTopics.length === 0 ? (
                    <span className="text-sm text-secondary italic">No topics selected. Add some preset topics below or select a template.</span>
                  ) : (
                    selectedTopics.map(topic => (
                      <span 
                        key={topic}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-cream text-on-surface border border-outline-variant/40 shadow-sm"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => setSelectedTopics(selectedTopics.filter(t => t !== topic))}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors"
                        >
                          <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Topic Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  
                  {/* Select from presets */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-on-surface-variant font-semibold">Add from preset library:</span>
                    <select
                      disabled={loading}
                      value=""
                      onChange={(e) => {
                        const newTopic = e.target.value;
                        if (newTopic && !selectedTopics.includes(newTopic)) {
                          setSelectedTopics([...selectedTopics, newTopic]);
                        }
                      }}
                      className="bg-surface-white border border-outline-variant/60 focus:border-primary rounded-lg px-3 py-2.5 font-body-sm text-body-sm text-on-surface cursor-pointer focus:outline-none w-full"
                    >
                      <option value="" disabled>-- Select preset topic --</option>
                      {(topicBankByType[roleType] || [])
                        .filter(t => !selectedTopics.includes(t))
                        .map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Type custom topic */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-on-surface-variant font-semibold">Or type custom topic:</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTopicText}
                        onChange={(e) => setCustomTopicText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = customTopicText.trim();
                            if (val && !selectedTopics.includes(val)) {
                              setSelectedTopics([...selectedTopics, val]);
                              setCustomTopicText("");
                            }
                          }
                        }}
                        placeholder="e.g. WebRTC, WebSockets..."
                        className="flex-grow bg-surface-white border border-outline-variant/60 focus:border-primary focus:ring-0 rounded-lg px-3 py-2.5 font-body-sm text-body-sm text-on-surface"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = customTopicText.trim();
                          if (val && !selectedTopics.includes(val)) {
                            setSelectedTopics([...selectedTopics, val]);
                            setCustomTopicText("");
                          }
                        }}
                        className="px-4 py-2 bg-primary-container text-surface-white font-label-md text-label-md rounded-lg hover:bg-primary transition-colors font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="font-label-md text-label-md text-on-surface font-semibold">Experience Level</label>
                <div className="flex flex-wrap gap-3">
                  {experienceLevels.map((level) => (
                    <label key={level.label} className="cursor-pointer">
                      <input
                        type="radio"
                        name="exp_level"
                        value={level.years}
                        checked={formData.jobExperience === level.years}
                        onChange={() => setFormData({ ...formData, jobExperience: level.years })}
                        disabled={loading}
                        className="peer sr-only"
                      />
                      <span className="inline-block px-5 py-2 rounded-full font-label-md text-label-md bg-surface-white text-tertiary border border-outline-variant/40 peer-checked:bg-primary-fixed/30 peer-checked:text-primary peer-checked:border-primary-fixed transition-colors shadow-sm">
                        {level.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <hr className="border-secondary-container" />

          {/* Section 2: Interview Format Selector */}
          <div className="flex flex-col gap-4">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">2. Interview Format</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Card 1: Code Based */}
              <label className={`relative flex flex-col justify-between h-full bg-surface-cream rounded-xl p-6 border-2 transition-all duration-300 ${
                isCodeDisabled 
                  ? "opacity-40 cursor-not-allowed border-transparent bg-gray-100" 
                  : "cursor-pointer hover:shadow-sm " + (assessmentFormat === "code" ? "border-primary bg-primary-fixed/20" : "border-transparent")
              }`}>
                <input
                  type="radio"
                  name="assessment_format"
                  value="code"
                  checked={assessmentFormat === "code"}
                  disabled={isCodeDisabled || loading}
                  onChange={() => setAssessmentFormat("code")}
                  className="sr-only"
                />
                <div>
                  <div className="w-12 h-12 bg-surface-white rounded-full flex items-center justify-center mb-4 shadow-sm text-primary">
                    <span className="material-symbols-outlined">code</span>
                  </div>
                  <h4 className="font-label-md text-label-md text-on-surface mb-2 font-semibold">Code Based</h4>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Solve real coding challenges using a rich in-browser code workspace with multiple language support.
                  </p>
                </div>
                {isCodeDisabled ? (
                  <div className="mt-4 text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-100 self-start">
                    Code editor not supported for this role type
                  </div>
                ) : (
                  assessmentFormat === "code" && (
                    <div className="absolute top-4 right-4 text-primary">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                  )
                )}
              </label>

              {/* Card 2: MCQ Quiz */}
              <label className={`relative flex flex-col justify-between h-full bg-surface-cream rounded-xl p-6 border-2 transition-all duration-300 ${
                isMcqDisabled 
                  ? "opacity-40 cursor-not-allowed border-transparent bg-gray-100" 
                  : "cursor-pointer hover:shadow-sm " + (assessmentFormat === "mcq" ? "border-primary bg-primary-fixed/20" : "border-transparent")
              }`}>
                <input
                  type="radio"
                  name="assessment_format"
                  value="mcq"
                  checked={assessmentFormat === "mcq"}
                  disabled={isMcqDisabled || loading}
                  onChange={() => setAssessmentFormat("mcq")}
                  className="sr-only"
                />
                <div>
                  <div className="w-12 h-12 bg-surface-white rounded-full flex items-center justify-center mb-4 shadow-sm text-tertiary">
                    <span className="material-symbols-outlined">checklist</span>
                  </div>
                  <h4 className="font-label-md text-label-md text-on-surface mb-2 font-semibold">MCQ (Multiple Choice)</h4>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Answer conceptual multiple choice questions to test your theoretical and framework knowledge.
                  </p>
                </div>
                {isMcqDisabled ? (
                  <div className="mt-4 text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-100 self-start">
                    MCQ format not supported for Behavioral
                  </div>
                ) : (
                  assessmentFormat === "mcq" && (
                    <div className="absolute top-4 right-4 text-primary">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                  )
                )}
              </label>

              {/* Card 3: Text Based */}
              <label className={`relative flex flex-col justify-between h-full bg-surface-cream rounded-xl p-6 border-2 cursor-pointer transition-all duration-300 hover:shadow-sm ${
                assessmentFormat === "text" ? "border-primary bg-primary-fixed/20" : "border-transparent"
              }`}>
                <input
                  type="radio"
                  name="assessment_format"
                  value="text"
                  checked={assessmentFormat === "text"}
                  disabled={loading}
                  onChange={() => setAssessmentFormat("text")}
                  className="sr-only"
                />
                <div>
                  <div className="w-12 h-12 bg-surface-white rounded-full flex items-center justify-center mb-4 shadow-sm text-tertiary">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <h4 className="font-label-md text-label-md text-on-surface mb-2 font-semibold">Text Based</h4>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Write detailed free-text explanations, architectures, analyses, or stories.
                  </p>
                </div>
                {assessmentFormat === "text" && (
                  <div className="absolute top-4 right-4 text-primary">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                )}
              </label>

            </div>
          </div>

          <hr className="border-secondary-container" />

          {/* Section 3: Session Parameters */}
          <div className="flex flex-col gap-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">3. Session Parameters</h3>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface font-semibold">Question Count</label>
              <div className="flex flex-wrap gap-3">
                {questionCounts.map((q) => (
                  <label key={q.count} className="cursor-pointer flex-1 md:flex-none">
                    <input
                      type="radio"
                      name="q_count"
                      value={q.count}
                      checked={formData.questionCount === q.count}
                      onChange={() => setFormData({ ...formData, questionCount: q.count })}
                      disabled={loading}
                      className="peer sr-only"
                    />
                    <div className="px-6 py-3 rounded-lg text-center font-label-md text-label-md bg-[#F9F6F1] text-secondary border border-transparent peer-checked:bg-surface-white peer-checked:border-primary peer-checked:text-primary transition-colors">
                      {q.label}
                      <br />
                      <span className="text-[12px] font-normal opacity-70">{q.duration}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Skeletons/Loading Feedback */}
          {loading && (
            <div className="space-y-4 pt-4 border-t border-secondary-container">
              <div className="flex items-center gap-3 text-sm text-primary font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Generating Assessment...
              </div>
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-[80%] rounded-md" />
            </div>
          )}

          {/* Submit CTA */}
          <div className="mt-4 pt-8 border-t border-secondary-container flex justify-end">
            <button
              type="submit"
              disabled={loading || selectedTopics.length === 0}
              className="bg-primary-container text-surface-white font-label-md text-label-md px-8 py-4 rounded-lg hover:bg-primary transition-all duration-300 hover:shadow-[0_0_15px_rgba(157,67,0,0.2)] flex items-center gap-2 w-full md:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Generate Assessment Session"}
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
