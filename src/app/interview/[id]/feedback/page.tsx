import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import FeedbackClient from "./FeedbackClient";

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const interview = await db.interview.findUnique({
    where: { id },
    include: {
      userAnswers: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!interview || !interview.userAnswers || interview.userAnswers.length === 0) {
    notFound();
  }

  const answers = interview.userAnswers;
  const averageScore = Math.round(
    answers.reduce((acc: number, curr: any) => acc + curr.rating, 0) / answers.length
  );

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <FeedbackClient 
      interview={{
        id: interview.id,
        jobPosition: interview.jobPosition,
        jobExperience: interview.jobExperience,
        createdAt: interview.createdAt,
        jobDesc: interview.jobDesc
      }}
      answers={answers}
      averageScore={averageScore}
      user={session.user}
      onSignOut={handleSignOut}
    />
  );
}
