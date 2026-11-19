-- Migration: add InterviewDraft table for autosave
-- Run this in your Supabase SQL Editor

CREATE TABLE "InterviewDraft" (
    "id"            TEXT NOT NULL,
    "interviewId"   TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "draftAnswer"   TEXT NOT NULL,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewDraft_pkey" PRIMARY KEY ("id")
);

-- Composite unique constraint: one draft per question per interview
CREATE UNIQUE INDEX "InterviewDraft_interviewId_questionIndex_key"
    ON "InterviewDraft"("interviewId", "questionIndex");

-- Foreign key: cascade delete drafts when interview is deleted
ALTER TABLE "InterviewDraft"
    ADD CONSTRAINT "InterviewDraft_interviewId_fkey"
    FOREIGN KEY ("interviewId")
    REFERENCES "Interview"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
