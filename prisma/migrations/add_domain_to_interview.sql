-- Migration: add domain column to Interview table
-- Run this in your Supabase SQL Editor

ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "domain" TEXT NOT NULL DEFAULT 'DSA';

-- Backfill domain from the [Type: ...] prefix in jobDesc for existing rows
UPDATE "Interview"
SET "domain" = CASE
  WHEN "jobDesc" ILIKE '[Type: system_design%' THEN 'SYSTEM_DESIGN'
  WHEN "jobDesc" ILIKE '[Type: behavioral%'    THEN 'BEHAVIORAL'
  WHEN "jobDesc" ILIKE '[Type: mcq%'           THEN 'CS_CORE'
  WHEN "jobDesc" ILIKE '[Type: cs_core%'       THEN 'CS_CORE'
  WHEN "jobDesc" ILIKE '[Type: dsa%'           THEN 'DSA'
  ELSE 'DSA'  -- rows without a prefix stay DSA
END
WHERE "domain" = 'DSA';  -- only touch rows still at the default
