import { describe, expect, it } from "vitest";
import { scoreCandidate } from "../src/lib/scoring";
import type { Candidate } from "../src/lib/types";

type CandidateOverrides = Partial<Omit<Candidate, "profile" | "redrob_signals">> & {
  profile?: Partial<Candidate["profile"]>;
  redrob_signals?: Partial<Candidate["redrob_signals"]>;
};

function candidate(overrides: CandidateOverrides = {}): Candidate {
  const base: Candidate = {
    candidate_id: "CAND_TEST",
    profile: {
      anonymized_name: "Test Candidate",
      headline: "Senior AI Engineer",
      summary:
        "Senior AI engineer with production search, retrieval, ranking and recommender systems experience.",
      location: "Pune, Maharashtra",
      country: "India",
      years_of_experience: 6.8,
      current_title: "Senior AI Engineer",
      current_company: "ProductCo",
      current_company_size: "201-500",
      current_industry: "SaaS",
    },
    career_history: [
      {
        company: "ProductCo",
        title: "Senior AI Engineer",
        start_date: "2021-01-01",
        end_date: null,
        duration_months: 65,
        is_current: true,
        industry: "SaaS",
        company_size: "201-500",
        description:
          "Owned a production hybrid retrieval and ranking system using BM25, dense vector search, FAISS and Elasticsearch. Built an NDCG/MRR evaluation harness and ran A/B tests for real users.",
      },
    ],
    education: [],
    skills: [
      { name: "Python", proficiency: "advanced", endorsements: 12, duration_months: 72 },
      { name: "FAISS", proficiency: "advanced", endorsements: 8, duration_months: 36 },
      { name: "Information Retrieval", proficiency: "advanced", endorsements: 10, duration_months: 48 },
    ],
    certifications: [],
    languages: [],
    redrob_signals: {
      profile_completeness_score: 90,
      signup_date: "2025-01-01",
      last_active_date: "2026-05-28",
      open_to_work_flag: true,
      profile_views_received_30d: 80,
      applications_submitted_30d: 3,
      recruiter_response_rate: 0.72,
      avg_response_time_hours: 24,
      skill_assessment_scores: {},
      connection_count: 250,
      endorsements_received: 80,
      notice_period_days: 30,
      expected_salary_range_inr_lpa: { min: 35, max: 55 },
      preferred_work_mode: "hybrid",
      willing_to_relocate: true,
      github_activity_score: 45,
      search_appearance_30d: 180,
      saved_by_recruiters_30d: 15,
      interview_completion_rate: 0.92,
      offer_acceptance_rate: 0.7,
      verified_email: true,
      verified_phone: true,
      linkedin_connected: true,
    },
  };

  return {
    ...base,
    ...overrides,
    profile: { ...base.profile, ...overrides.profile },
    redrob_signals: { ...base.redrob_signals, ...overrides.redrob_signals },
    career_history: overrides.career_history ?? base.career_history,
    skills: overrides.skills ?? base.skills,
  };
}

describe("scoreCandidate", () => {
  it("rewards production retrieval and evaluation evidence", () => {
    const scored = scoreCandidate(candidate());

    expect(scored.score).toBeGreaterThan(0.75);
    expect(scored.dimensions.productionSearch).toBeGreaterThan(0.75);
    expect(scored.dimensions.evaluationMaturity).toBeGreaterThan(0.7);
    expect(scored.reasoning).toContain("Senior AI Engineer");
  });

  it("penalizes AI keyword stuffing on a non-engineering profile", () => {
    const stuffed = scoreCandidate(
      candidate({
        profile: {
          current_title: "Marketing Manager",
          summary: "Marketing leader curious about AI tools and prompt engineering.",
          current_industry: "Manufacturing",
        },
        career_history: [
          {
            company: "BrandCo",
            title: "Marketing Manager",
            start_date: "2020-01-01",
            end_date: null,
            duration_months: 76,
            is_current: true,
            industry: "Manufacturing",
            company_size: "1001-5000",
            description: "Ran campaigns and stakeholder reporting. Used AI tools for content drafts.",
          },
        ],
        skills: [
          { name: "RAG", proficiency: "expert", endorsements: 1, duration_months: 2 },
          { name: "LLMs", proficiency: "expert", endorsements: 1, duration_months: 2 },
          { name: "Pinecone", proficiency: "expert", endorsements: 1, duration_months: 2 },
          { name: "Semantic Search", proficiency: "expert", endorsements: 1, duration_months: 2 },
          { name: "Embeddings", proficiency: "expert", endorsements: 1, duration_months: 2 },
        ],
      }),
    );

    expect(stuffed.score).toBeLessThan(0.5);
    expect(stuffed.concerns.join(" ")).toMatch(/non-engineering|keyword/i);
  });
});
