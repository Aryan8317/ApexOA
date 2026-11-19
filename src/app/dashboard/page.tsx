import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import SkillMatrix from "./SkillMatrix";
import { domainStats } from "@/lib/domainStats";
import { parseDomainFromJobDesc } from "@/lib/parseDomain";
import type { Domain } from "@/lib/domainStats";

export default async function DashboardPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 1. Fetch user interviews
  const interviews = await db.interview.findMany({
    where: { userId },
    include: {
      userAnswers: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate stats
  const totalInterviews = interviews.length;

  // Calculate real calendar-day streak
  const attemptedInterviews = interviews.filter((i) => i.userAnswers.length > 0);
  let currentStreak = 0;

  if (attemptedInterviews.length > 0) {
    const uniqueDates = Array.from(
      new Set(
        attemptedInterviews.map((i) => {
          const d = new Date(i.createdAt);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        })
      )
    ).sort((a, b) => b.localeCompare(a));

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyyYest = yesterday.getFullYear();
    const mmYest = String(yesterday.getMonth() + 1).padStart(2, "0");
    const ddYest = String(yesterday.getDate()).padStart(2, "0");
    const yesterdayStr = `${yyyyYest}-${mmYest}-${ddYest}`;

    const latestDateStr = uniqueDates[0];
    if (latestDateStr === todayStr || latestDateStr === yesterdayStr) {
      currentStreak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        const diffTime = current.getTime() - next.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          break;
        }
      }
    }
  }

  // Build a flat list of answers with domain tag for aggregation
  const allAnswersWithDomain = interviews.flatMap(interview => {
    const domain = parseDomainFromJobDesc(interview.jobDesc) ?? "DSA";
    return interview.userAnswers
      .filter(a => Number.isInteger(a.rating) && a.rating >= 1 && a.rating <= 10)
      .map(a => ({ rating: a.rating, domain }));
  });

  const stats = domainStats(allAnswersWithDomain);

  // Overall average (for metric card) — still answer-weighted
  const allRatings = allAnswersWithDomain.map(a => a.rating);
  const averageRating = allRatings.length > 0
    ? allRatings.reduce((s, r) => s + r, 0) / allRatings.length
    : 0;

  // Strongest and focus area — derived from domain stats
  const domainsWithData = (Object.entries(stats) as [Domain, { mean: number | null; count: number }][])
    .filter(([_, s]) => s.mean !== null) as [Domain, { mean: number; count: number }][];

  const DOMAIN_LABELS_SHORT: Record<Domain, string> = {
    DSA: "DSA / Coding",
    SYSTEM_DESIGN: "System Design",
    CS_CORE: "CS Core",
    BEHAVIORAL: "Behavioral",
  };

  let strongestArea = "—";
  let focusArea = "—";
  if (domainsWithData.length > 0) {
    const sorted = domainsWithData.sort((a, b) => b[1].mean - a[1].mean);
    strongestArea = DOMAIN_LABELS_SHORT[sorted[0][0]];
    focusArea = DOMAIN_LABELS_SHORT[sorted[sorted.length - 1][0]];
  }

  // Format date helper
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-gutter">
      {/* Welcome Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">
            Welcome Back, {session.user.name || "Alex"}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
            {currentStreak > 0 ? (
              `You're on a ${currentStreak}-day streak! Keep up the momentum to hit your weekly target.`
            ) : (
              "Start an interview today to kick off your streak!"
            )}
          </p>
        </div>
      </header>

      {/* Key Metrics Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-gutter">
        {/* Metric 1: Total Interviews */}
        <div className="bg-surface-white rounded-xl card-ambient-shadow p-6 border border-surface-variant hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                forum
              </span>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Total Interviews
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-on-background">
              {totalInterviews}
            </span>
            {totalInterviews > 0 ? (
              <span className="font-body-sm text-body-sm text-primary font-medium flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-0.5">trending_up</span> 
                +{Math.min(totalInterviews, 3)} this week
              </span>
            ) : (
              <span className="font-body-sm text-body-sm text-secondary font-medium flex items-center">
                0 this week
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Average Score */}
        <div className="bg-surface-white rounded-xl card-ambient-shadow p-6 border border-surface-variant hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                military_tech
              </span>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Avg. Score
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-on-background">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface-variant">/10</span>
          </div>
        </div>

        {/* Metric 3: Streak */}
        <div className="bg-surface-white rounded-xl card-ambient-shadow p-6 border border-surface-variant hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Interview Streak
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-on-background">
              {currentStreak}
            </span>
            <span className="font-body-lg text-body-lg text-on-surface-variant">Days</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Recent Interviews List */}
        <div className="lg:col-span-2 bg-surface-white rounded-xl card-ambient-shadow border border-surface-variant overflow-hidden flex flex-col">
          <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-white/50">
            <h3 className="font-headline-sm text-headline-sm text-on-background">Recent Interviews</h3>
            <Link href="/dashboard/new" className="font-label-md text-label-md text-primary hover:text-surface-tint transition-colors">
              New Session
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            {totalInterviews === 0 ? (
              <div className="p-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-4">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">video_chat</span>
                <p className="font-body-lg text-body-lg">No assessment sessions generated yet.</p>
                <Link href="/dashboard/new" className="mt-2 bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-full hover:bg-surface-tint transition-all">
                  Configure Your First Assessment
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low font-label-md text-label-md text-on-surface-variant">
                    <th className="p-4 font-medium">Session Type</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {interviews.map((interview) => {
                    const ansCount = interview.userAnswers.length;
                    const ratingSum = interview.userAnswers.reduce((sum, a) => sum + a.rating, 0);
                    const avgScore = ansCount > 0 ? (ratingSum / ansCount).toFixed(1) : null;

                    // Deduce icon based on job position or mock
                    let iconName = "code";
                    if (interview.jobPosition.toLowerCase().includes("design") || interview.jobPosition.toLowerCase().includes("architect")) {
                      iconName = "architecture";
                    } else if (interview.jobPosition.toLowerCase().includes("manager") || interview.jobPosition.toLowerCase().includes("lead")) {
                      iconName = "psychology";
                    }

                    return (
                      <tr key={interview.id} className="hover:bg-surface-container-lowest transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center text-on-surface-variant">
                              <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                            </div>
                            <div>
                              <div className="font-body-md text-body-md text-on-background font-medium">
                                {interview.jobPosition}
                              </div>
                              <div className="font-body-sm text-body-sm text-on-surface-variant">
                                Experience: {interview.jobExperience} years
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-body-md text-body-md text-on-surface-variant">
                          {formatDate(interview.createdAt)}
                        </td>
                        <td className="p-4">
                          {avgScore ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-md text-label-md bg-primary-container/10 text-primary-container border border-primary-container/20">
                              {avgScore} / 10
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-md text-label-md bg-surface-variant text-on-surface-variant border border-outline-variant">
                              Incomplete
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            className="font-label-md text-label-md text-primary hover:underline group-hover:text-surface-tint"
                            href={avgScore ? `/interview/${interview.id}/feedback` : `/interview/${interview.id}`}
                          >
                            {avgScore ? "View Feedback" : "Resume Session"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Skill Matrix Column */}
        <div className="lg:col-span-1 bg-surface-white rounded-xl card-ambient-shadow border border-surface-variant p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-headline-sm text-on-background">Skill Matrix</h3>
          </div>
          
          {/* Recharts Radar Chart */}
          <div className="w-full my-2 relative">
            <SkillMatrix stats={stats} />
          </div>

          {/* Legend/Summary */}
          <div className="mt-4 pt-4 border-t border-surface-variant grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Strongest</span>
              <span className="font-label-md text-label-md text-on-background">{strongestArea}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Focus Area</span>
              <span className="font-label-md text-label-md text-primary">{focusArea}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
