import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import Sidebar from "@/app/dashboard/Sidebar";
import InterviewClient from "./InterviewClient";

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const interview = await db.interview.findUnique({
    where: { id },
  });

  if (!interview) {
    notFound();
  }

  // Parse JSON if it's a string, or use directly if it's already an array
  let mockQuestions = [];
  try {
    mockQuestions = typeof interview.jsonMockResp === 'string' 
      ? JSON.parse(interview.jsonMockResp) 
      : interview.jsonMockResp;
  } catch (error) {
    console.error("Failed to parse mock questions", error);
  }

  const typeMatch = interview.jobDesc.match(/^\[Type:\s*([^\]]+)\]/);
  const interviewType = typeMatch ? typeMatch[1] : "dsa";

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="bg-surface-cream text-on-surface font-body-md min-h-screen flex selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Sidebar Navigation */}
      <Sidebar user={session.user} onSignOut={handleSignOut} />

      {/* Main Content Canvas */}
      <main className="w-full md:ml-64 p-margin-mobile md:p-margin-desktop pt-24 md:pt-margin-desktop min-h-screen flex flex-col max-w-container-max mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Live Assessment Workspace</h1>
          <p className="text-gray-500 mt-2">
            Role: {interview.jobPosition} • Format: {interviewType.toUpperCase()} • Experience: {interview.jobExperience} years
          </p>
        </div>
        <InterviewClient interviewId={interview.id} questions={mockQuestions} interviewType={interviewType} />
      </main>
    </div>
  );
}
