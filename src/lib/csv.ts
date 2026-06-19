import type { CandidateScore, RankedCandidateOutput } from "./types";

export const SUBMISSION_HEADER = ["candidate_id", "rank", "score", "reasoning"] as const;

export function escapeCsv(value: string | number): string {
  const raw = String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function scoresToCsv(rows: CandidateScore[]): string {
  const lines = [SUBMISSION_HEADER.join(",")];
  rows.forEach((row, index) => {
    lines.push(
      [
        row.candidateId,
        index + 1,
        row.score.toFixed(4),
        row.reasoning,
      ]
        .map(escapeCsv)
        .join(","),
    );
  });
  return `${lines.join("\n")}\n`;
}

export function toDashboardRows(rows: CandidateScore[]): RankedCandidateOutput[] {
  return rows.map((row, index) => ({
    candidate_id: row.candidateId,
    rank: index + 1,
    score: Number(row.score.toFixed(4)),
    reasoning: row.reasoning,
    profile: {
      title: row.candidate.profile.current_title,
      company: row.candidate.profile.current_company,
      industry: row.candidate.profile.current_industry,
      location: row.candidate.profile.location,
      country: row.candidate.profile.country,
      years: row.candidate.profile.years_of_experience,
    },
    dimensions: row.dimensions,
    evidence: row.evidence,
    concerns: row.concerns,
    signals: {
      openToWork: row.candidate.redrob_signals.open_to_work_flag,
      responseRate: row.candidate.redrob_signals.recruiter_response_rate,
      noticeDays: row.candidate.redrob_signals.notice_period_days,
      lastActiveDate: row.candidate.redrob_signals.last_active_date,
      githubActivity: row.candidate.redrob_signals.github_activity_score,
      savedByRecruiters30d: row.candidate.redrob_signals.saved_by_recruiters_30d,
    },
  }));
}

export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}
