export type Proficiency = "beginner" | "intermediate" | "advanced" | "expert";

export interface CandidateProfile {
  anonymized_name: string;
  headline: string;
  summary: string;
  location: string;
  country: string;
  years_of_experience: number;
  current_title: string;
  current_company: string;
  current_company_size: string;
  current_industry: string;
}

export interface CareerRole {
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
  duration_months: number;
  is_current: boolean;
  industry: string;
  company_size: string;
  description: string;
}

export interface CandidateSkill {
  name: string;
  proficiency: Proficiency;
  endorsements: number;
  duration_months?: number;
}

export interface RedrobSignals {
  profile_completeness_score: number;
  signup_date: string;
  last_active_date: string;
  open_to_work_flag: boolean;
  profile_views_received_30d: number;
  applications_submitted_30d: number;
  recruiter_response_rate: number;
  avg_response_time_hours: number;
  skill_assessment_scores: Record<string, number>;
  connection_count: number;
  endorsements_received: number;
  notice_period_days: number;
  expected_salary_range_inr_lpa: {
    min: number;
    max: number;
  };
  preferred_work_mode: "remote" | "hybrid" | "onsite" | "flexible";
  willing_to_relocate: boolean;
  github_activity_score: number;
  search_appearance_30d: number;
  saved_by_recruiters_30d: number;
  interview_completion_rate: number;
  offer_acceptance_rate: number;
  verified_email: boolean;
  verified_phone: boolean;
  linkedin_connected: boolean;
}

export interface Candidate {
  candidate_id: string;
  profile: CandidateProfile;
  career_history: CareerRole[];
  education: unknown[];
  skills: CandidateSkill[];
  certifications: unknown[];
  languages: unknown[];
  redrob_signals: RedrobSignals;
}

export interface ScoreDimensions {
  productionSearch: number;
  appliedEngineering: number;
  evaluationMaturity: number;
  availabilityLogistics: number;
  trustConsistency: number;
}

export interface CandidateScore {
  candidateId: string;
  rawScore: number;
  score: number;
  dimensions: ScoreDimensions;
  evidence: string[];
  concerns: string[];
  reasoning: string;
  candidate: Candidate;
}

export interface RankedCandidateOutput {
  candidate_id: string;
  rank: number;
  score: number;
  reasoning: string;
  profile: {
    title: string;
    company: string;
    industry: string;
    location: string;
    country: string;
    years: number;
  };
  dimensions: ScoreDimensions;
  evidence: string[];
  concerns: string[];
  signals: {
    openToWork: boolean;
    responseRate: number;
    noticeDays: number;
    lastActiveDate: string;
    githubActivity: number;
    savedByRecruiters30d: number;
  };
}

export interface RankingStats {
  candidateCount: number;
  generatedAt: string;
  elapsedMs: number;
  outputCsv: string;
  outputJson: string;
  validation?: {
    ok: boolean;
    errors: string[];
  };
}

export interface ValidationOutput {
  ok: boolean;
  errors: string[];
  rowCount: number;
  validatedAt: string;
}
