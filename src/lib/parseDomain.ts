import type { Domain } from "./domainStats";

// Maps the interviewType string (stored in jobDesc prefix) → canonical Domain
export function parseDomainFromType(interviewType: string): Domain {
  const t = interviewType.toLowerCase();
  if (t.startsWith("system_design")) return "SYSTEM_DESIGN";
  if (t.startsWith("behavioral")) return "BEHAVIORAL";
  if (t === "mcq" || t.startsWith("cs_core")) return "CS_CORE";
  if (t.startsWith("dsa") || t === "code") return "DSA";
  return "DSA"; // safe default for unrecognised values
}

// Extracts interviewType from the jobDesc prefix "[Type: system_design] ..."
export function parseDomainFromJobDesc(jobDesc: string): Domain | null {
  const match = jobDesc.match(/^\[Type:\s*([^\]]+)\]/);
  if (!match) return null;
  return parseDomainFromType(match[1].trim());
}
