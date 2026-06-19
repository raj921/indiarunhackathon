import type { Candidate, CandidateScore, ScoreDimensions } from "./types";
import { clamp, daysBetween, matchingLabels, monthsBetween, normalizeText, scoreTerms, unique, type WeightedTerm } from "./text";

const REFERENCE_DATE = new Date("2026-06-01T00:00:00Z");

const RETRIEVAL_TERMS: WeightedTerm[] = [
  { term: "hybrid retrieval", weight: 2.2, label: "hybrid retrieval" },
  { term: "candidate-jd matching", weight: 2.2, label: "candidate-JD matching" },
  { term: "matching pipeline", weight: 1.8, label: "matching pipeline" },
  { term: "semantic search", weight: 1.7, label: "semantic search" },
  { term: "vector search", weight: 1.7, label: "vector search" },
  { term: "information retrieval", weight: 1.6, label: "information retrieval" },
  { term: "ranking system", weight: 1.6, label: "ranking system" },
  { term: "recommendation system", weight: 1.5, label: "recommendation system" },
  { term: "recommender", weight: 1.4, label: "recommender systems" },
  { term: "search relevance", weight: 1.4, label: "search relevance" },
  { term: "dense vector", weight: 1.4, label: "dense vector recall" },
  { term: "embeddings", weight: 1.2, label: "embeddings" },
  { term: "retrieval", weight: 1.0, label: "retrieval" },
  { term: "ranking", weight: 1.0, label: "ranking" },
  { term: "search", weight: 0.8, label: "search" },
  { term: "rag", weight: 0.7, label: "RAG" },
];

const INFRA_TERMS: WeightedTerm[] = [
  { term: "faiss", weight: 1.3, label: "FAISS" },
  { term: "pinecone", weight: 1.3, label: "Pinecone" },
  { term: "qdrant", weight: 1.3, label: "Qdrant" },
  { term: "weaviate", weight: 1.3, label: "Weaviate" },
  { term: "milvus", weight: 1.2, label: "Milvus" },
  { term: "elasticsearch", weight: 1.2, label: "Elasticsearch" },
  { term: "opensearch", weight: 1.2, label: "OpenSearch" },
  { term: "bm25", weight: 1.2, label: "BM25" },
  { term: "pgvector", weight: 1.0, label: "pgvector" },
  { term: "sentence transformers", weight: 1.0, label: "sentence-transformers" },
  { term: "bge", weight: 0.8, label: "BGE embeddings" },
  { term: "e5", weight: 0.8, label: "E5 embeddings" },
];

const PRODUCTION_TERMS: WeightedTerm[] = [
  { term: "production", weight: 1.4, label: "production deployment" },
  { term: "deployed", weight: 1.2, label: "deployed systems" },
  { term: "shipped", weight: 1.2, label: "shipped product" },
  { term: "launched", weight: 1.0, label: "launched system" },
  { term: "owned", weight: 1.0, label: "owned system" },
  { term: "led", weight: 0.9, label: "led implementation" },
  { term: "rebuilt", weight: 0.9, label: "rebuilt system" },
  { term: "real users", weight: 1.1, label: "real users" },
  { term: "latency", weight: 0.9, label: "latency/scale" },
  { term: "scale", weight: 0.8, label: "scale" },
  { term: "on-call", weight: 0.8, label: "operational ownership" },
  { term: "monitoring", weight: 0.7, label: "monitoring" },
  { term: "regression", weight: 0.7, label: "quality regression handling" },
];

const EVALUATION_TERMS: WeightedTerm[] = [
  { term: "ndcg", weight: 2.0, label: "NDCG" },
  { term: "mrr", weight: 1.7, label: "MRR" },
  { term: "map", weight: 1.5, label: "MAP" },
  { term: "precision@", weight: 1.3, label: "precision@k" },
  { term: "recall@", weight: 1.3, label: "recall@k" },
  { term: "offline benchmark", weight: 1.5, label: "offline benchmark" },
  { term: "offline-online", weight: 1.5, label: "offline-online calibration" },
  { term: "a/b", weight: 1.5, label: "A/B testing" },
  { term: "ab test", weight: 1.5, label: "A/B testing" },
  { term: "evaluation harness", weight: 1.5, label: "evaluation harness" },
  { term: "eval framework", weight: 1.3, label: "evaluation framework" },
  { term: "recruiter feedback", weight: 1.3, label: "recruiter feedback loops" },
  { term: "ranking evaluation", weight: 1.2, label: "ranking evaluation" },
];

const ENGINEERING_TERMS: WeightedTerm[] = [
  { term: "python", weight: 1.2, label: "Python" },
  { term: "backend", weight: 0.9, label: "backend engineering" },
  { term: "api", weight: 0.7, label: "API engineering" },
  { term: "data pipeline", weight: 0.9, label: "data pipelines" },
  { term: "feature pipeline", weight: 0.9, label: "feature pipelines" },
  { term: "spark", weight: 0.8, label: "Spark" },
  { term: "airflow", weight: 0.8, label: "Airflow" },
  { term: "kafka", weight: 0.8, label: "Kafka" },
  { term: "mlops", weight: 0.8, label: "MLOps" },
  { term: "kubernetes", weight: 0.7, label: "Kubernetes" },
  { term: "docker", weight: 0.7, label: "Docker" },
  { term: "system design", weight: 0.7, label: "system design" },
];

const TARGET_TITLES = [
  "senior ai engineer",
  "senior machine learning engineer",
  "machine learning engineer",
  "applied ml engineer",
  "search engineer",
  "recommendation systems engineer",
  "nlp engineer",
  "senior nlp engineer",
  "ai engineer",
  "ml engineer",
  "senior software engineer (ml)",
  "senior data scientist",
  "data scientist",
];

const NON_ENGINEERING_TITLES = [
  "hr manager",
  "marketing manager",
  "graphic designer",
  "content writer",
  "mechanical engineer",
  "civil engineer",
  "accountant",
  "sales executive",
  "operations manager",
  "customer support",
  "business analyst",
  "project manager",
];

const PRODUCT_INDUSTRIES = new Set([
  "software",
  "saas",
  "ai/ml",
  "fintech",
  "e-commerce",
  "food delivery",
  "edtech",
  "healthtech",
  "healthtech ai",
  "conversational ai",
  "internet",
  "adtech",
  "gaming",
  "transportation",
  "insurance tech",
  "voice ai",
  "consumer electronics",
  "media",
]);

const SERVICE_COMPANIES = new Set([
  "tcs",
  "infosys",
  "wipro",
  "accenture",
  "cognizant",
  "capgemini",
  "mindtree",
  "ltimindtree",
  "hcl",
  "tech mahindra",
]);

const FOCUS_MISMATCH_TERMS = [
  "computer vision",
  "image classification",
  "speech recognition",
  "tts",
  "robotics",
  "gan",
  "gans",
];

function allText(candidate: Candidate): string {
  return [
    candidate.profile.headline,
    candidate.profile.summary,
    candidate.profile.current_title,
    candidate.profile.current_company,
    candidate.profile.current_industry,
    ...candidate.career_history.flatMap((role) => [
      role.title,
      role.company,
      role.industry,
      role.description,
    ]),
    ...candidate.skills.map((skill) => skill.name),
  ].join(" ");
}

function careerText(candidate: Candidate): string {
  return candidate.career_history
    .map((role) => `${role.title} ${role.company} ${role.industry} ${role.description}`)
    .join(" ");
}

function skillText(candidate: Candidate): string {
  return candidate.skills.map((skill) => skill.name).join(" ");
}

function titleScore(title: string): number {
  const normalized = normalizeText(title);
  if (TARGET_TITLES.some((target) => normalized.includes(target))) {
    return 1;
  }
  if (/(data engineer|analytics engineer|backend engineer|senior software engineer|software engineer|cloud engineer|devops engineer)/i.test(title)) {
    return 0.55;
  }
  return 0.1;
}

function experienceScore(years: number): number {
  if (years >= 5 && years <= 9) return 1;
  if (years >= 4 && years < 5) return 0.72;
  if (years > 9 && years <= 10.5) return 0.72;
  if (years >= 3 && years < 4) return 0.45;
  if (years > 10.5 && years <= 12) return 0.38;
  return 0.12;
}

function locationScore(candidate: Candidate): number {
  const location = normalizeText(candidate.profile.location);
  const country = normalizeText(candidate.profile.country);
  const relocate = candidate.redrob_signals.willing_to_relocate;

  if (location.includes("pune") || location.includes("noida")) return 1;
  if (/(delhi|gurgaon|mumbai|bangalore|bengaluru|hyderabad)/.test(location)) return 0.86;
  if (country === "india") return relocate ? 0.78 : 0.64;
  return relocate ? 0.42 : 0.16;
}

function behaviorScore(candidate: Candidate): number {
  const signals = candidate.redrob_signals;
  const daysInactive = daysBetween(REFERENCE_DATE, signals.last_active_date);
  const recency = daysInactive <= 14 ? 1 : daysInactive <= 45 ? 0.72 : daysInactive <= 90 ? 0.35 : 0.08;
  const response = clamp(signals.recruiter_response_rate / 0.75);
  const responseTime = clamp(1 - signals.avg_response_time_hours / 240);
  const openToWork = signals.open_to_work_flag ? 1 : 0.25;
  const notice = signals.notice_period_days <= 30 ? 1 : signals.notice_period_days <= 60 ? 0.75 : signals.notice_period_days <= 90 ? 0.44 : 0.12;
  const recruiterInterest = clamp((signals.saved_by_recruiters_30d / 12) * 0.6 + (signals.profile_views_received_30d / 80) * 0.4);
  const interviewReliability = clamp(signals.interview_completion_rate);
  const verification = (signals.verified_email ? 0.34 : 0) + (signals.verified_phone ? 0.33 : 0) + (signals.linkedin_connected ? 0.33 : 0);
  const github = signals.github_activity_score < 0 ? 0.15 : clamp(signals.github_activity_score / 70);

  return clamp(
    0.18 * recency +
      0.2 * response +
      0.08 * responseTime +
      0.14 * openToWork +
      0.14 * notice +
      0.12 * recruiterInterest +
      0.08 * interviewReliability +
      0.04 * verification +
      0.02 * github,
  );
}

function productCompanyScore(candidate: Candidate): number {
  const roles = candidate.career_history.length ? candidate.career_history : [];
  const productRoles = roles.filter((role) => PRODUCT_INDUSTRIES.has(normalizeText(role.industry)));
  const currentProduct = PRODUCT_INDUSTRIES.has(normalizeText(candidate.profile.current_industry));
  const seniorOwnership = scoreTerms(careerText(candidate), PRODUCTION_TERMS, 6);
  return clamp((productRoles.length / Math.max(1, roles.length)) * 0.45 + (currentProduct ? 0.3 : 0) + seniorOwnership * 0.25);
}

function consistencyScore(candidate: Candidate, concerns: string[]): number {
  const years = candidate.profile.years_of_experience;
  const experienceMonths = years * 12;
  const careerMonths = candidate.career_history.reduce((sum, role) => sum + role.duration_months, 0);
  const impossibleSkillDurations = candidate.skills.filter((skill) => (skill.duration_months ?? 0) > experienceMonths + 24).length;
  const thinExpertSkills = candidate.skills.filter(
    (skill) => skill.proficiency === "expert" && (skill.duration_months ?? 0) < 12,
  ).length;
  const inflatedAdvancedSkills = candidate.skills.filter((skill) => ["advanced", "expert"].includes(skill.proficiency)).length;
  const durationMismatches = candidate.career_history.filter((role) => {
    const actual = monthsBetween(role.start_date, role.end_date, REFERENCE_DATE);
    return Math.abs(actual - role.duration_months) > 8;
  }).length;

  let score = 1;
  if (careerMonths > experienceMonths + 24) {
    score -= 0.22;
    concerns.push("career tenure exceeds stated experience");
  }
  if (impossibleSkillDurations > 0) {
    score -= Math.min(0.35, impossibleSkillDurations * 0.12);
    concerns.push("some skill durations exceed stated experience");
  }
  if (thinExpertSkills >= 2) {
    score -= 0.16;
    concerns.push("multiple expert skills have thin duration");
  }
  if (years < 3 && inflatedAdvancedSkills >= 10) {
    score -= 0.24;
    concerns.push("very junior profile lists many advanced skills");
  }
  if (durationMismatches >= 2) {
    score -= 0.18;
    concerns.push("role duration metadata is inconsistent");
  }

  return clamp(score);
}

function penaltyScore(candidate: Candidate, coreEvidence: number, concerns: string[]): number {
  const text = normalizeText(allText(candidate));
  const title = normalizeText(candidate.profile.current_title);
  const skills = candidate.skills.map((skill) => normalizeText(skill.name));
  let penalty = 0;

  const nonEngineeringTitle = NON_ENGINEERING_TITLES.some((badTitle) => title.includes(badTitle));
  const aiSkillCount = skills.filter((skill) =>
    /(llm|rag|embedding|vector|nlp|fine-tuning|lora|qlora|pinecone|qdrant|weaviate|milvus|faiss|semantic search|recommendation|information retrieval)/.test(skill),
  ).length;

  if (nonEngineeringTitle && aiSkillCount >= 4) {
    penalty += 0.22;
    concerns.push("AI-heavy skills conflict with a non-engineering title");
  }

  if (aiSkillCount >= 8 && coreEvidence < 0.35) {
    penalty += 0.18;
    concerns.push("AI keyword density is stronger than career evidence");
  }

  if (/(academic lab|phd research|research-only|pure research)/.test(text) && !/(production|deployed|shipped|real users)/.test(text)) {
    penalty += 0.14;
    concerns.push("research-heavy profile lacks production deployment evidence");
  }

  if (/(langchain|openai|chatgpt|prompt engineering)/.test(text) && coreEvidence < 0.4) {
    penalty += 0.12;
    concerns.push("AI exposure looks recent/framework-led rather than systems-led");
  }

  const roles = candidate.career_history;
  const serviceOnly =
    roles.length > 0 &&
    roles.every((role) => normalizeText(role.industry) === "it services" || SERVICE_COMPANIES.has(normalizeText(role.company)));
  const hasProduct = roles.some((role) => PRODUCT_INDUSTRIES.has(normalizeText(role.industry)));
  if (serviceOnly && !hasProduct) {
    penalty += 0.11;
    concerns.push("consulting/services-heavy career with limited product-company signal");
  }

  const mismatchHits = FOCUS_MISMATCH_TERMS.filter((term) => text.includes(term)).length;
  const retrievalHit = /(retrieval|ranking|search|recommendation|information retrieval|semantic search|vector search|bm25)/.test(text);
  if (mismatchHits >= 3 && !retrievalHit) {
    penalty += 0.12;
    concerns.push("ML focus appears outside NLP/retrieval/search");
  }

  const daysInactive = daysBetween(REFERENCE_DATE, candidate.redrob_signals.last_active_date);
  if (daysInactive > 120) {
    penalty += 0.1;
    concerns.push("stale platform activity");
  }
  if (candidate.redrob_signals.recruiter_response_rate < 0.18) {
    penalty += 0.08;
    concerns.push("low recruiter response rate");
  }
  if (candidate.redrob_signals.notice_period_days > 120) {
    penalty += 0.06;
    concerns.push("long notice period");
  }

  if (normalizeText(candidate.profile.country) !== "india") {
    if (candidate.redrob_signals.willing_to_relocate) {
      penalty += 0.05;
      concerns.push("outside India but willing to relocate");
    } else {
      penalty += 0.12;
      concerns.push("outside India and not willing to relocate");
    }
  }

  return clamp(penalty, 0, 0.55);
}

function buildReasoning(candidate: Candidate, evidence: string[], concerns: string[]): string {
  const profile = candidate.profile;
  const signals = candidate.redrob_signals;
  const primaryEvidence = evidence.slice(0, 3).join(", ");
  const activity = `${signals.open_to_work_flag ? "open to work" : "not marked open"}; ${Math.round(
    signals.recruiter_response_rate * 100,
  )}% recruiter response; ${signals.notice_period_days}d notice`;
  const concern = concerns[0] ? ` Concern: ${concerns[0]}.` : "";

  return `${profile.current_title} with ${profile.years_of_experience.toFixed(1)} years at ${profile.current_company} (${profile.current_industry}); evidence includes ${primaryEvidence || "applied engineering signals"} tied to the JD's search/ranking mandate. Platform fit: ${activity}.${concern}`;
}

export function scoreCandidate(candidate: Candidate): CandidateScore {
  const text = allText(candidate);
  const career = careerText(candidate);
  const skills = skillText(candidate);
  const concerns: string[] = [];

  const careerRetrieval = scoreTerms(career, RETRIEVAL_TERMS, 7.5);
  const skillRetrieval = scoreTerms(skills, RETRIEVAL_TERMS, 6);
  const infra = clamp(scoreTerms(`${career} ${skills}`, INFRA_TERMS, 5.5));
  const production = scoreTerms(career, PRODUCTION_TERMS, 5.5);
  const targetTitle = titleScore(candidate.profile.current_title);
  const evaluation = scoreTerms(career, EVALUATION_TERMS, 4.8);
  const engineering = scoreTerms(`${career} ${candidate.profile.summary} ${skills}`, ENGINEERING_TERMS, 6.2);
  const productCompany = productCompanyScore(candidate);
  const experience = experienceScore(candidate.profile.years_of_experience);
  const location = locationScore(candidate);
  const behavior = behaviorScore(candidate);
  const consistency = consistencyScore(candidate, concerns);

  const productionSearch = clamp(
    0.42 * careerRetrieval +
      0.2 * skillRetrieval +
      0.18 * infra +
      0.12 * production +
      0.08 * targetTitle,
  );
  const appliedEngineering = clamp(
    0.3 * targetTitle +
      0.25 * engineering +
      0.25 * productCompany +
      0.12 * production +
      0.08 * experience,
  );
  const evaluationMaturity = clamp(0.78 * evaluation + 0.14 * production + 0.08 * careerRetrieval);
  const availabilityLogistics = clamp(0.38 * behavior + 0.28 * experience + 0.22 * location + 0.12 * (candidate.redrob_signals.willing_to_relocate ? 1 : 0.45));
  const trustConsistency = clamp(
    0.48 * consistency +
      0.18 * clamp(candidate.redrob_signals.profile_completeness_score / 90) +
      0.14 * (candidate.redrob_signals.verified_email ? 1 : 0) +
      0.1 * (candidate.redrob_signals.verified_phone ? 1 : 0) +
      0.1 * (candidate.redrob_signals.github_activity_score < 0 ? 0.25 : clamp(candidate.redrob_signals.github_activity_score / 60)),
  );

  const dimensions: ScoreDimensions = {
    productionSearch,
    appliedEngineering,
    evaluationMaturity,
    availabilityLogistics,
    trustConsistency,
  };

  const base =
    0.35 * productionSearch +
    0.2 * appliedEngineering +
    0.15 * evaluationMaturity +
    0.15 * availabilityLogistics +
    0.15 * trustConsistency;
  const penalty = penaltyScore(candidate, productionSearch, concerns);
  const rawScore = clamp(base - penalty);

  const evidence = unique([
    ...matchingLabels(career, RETRIEVAL_TERMS, 4),
    ...matchingLabels(`${career} ${skills}`, INFRA_TERMS, 3),
    ...matchingLabels(career, EVALUATION_TERMS, 2),
    ...matchingLabels(`${career} ${skills}`, ENGINEERING_TERMS, 2),
  ]);

  return {
    candidateId: candidate.candidate_id,
    rawScore,
    score: Math.round(rawScore * 10_000) / 10_000,
    dimensions,
    evidence,
    concerns: unique(concerns).slice(0, 4),
    reasoning: buildReasoning(candidate, evidence, concerns),
    candidate,
  };
}

export function compareScores(a: CandidateScore, b: CandidateScore): number {
  if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
  return a.candidateId.localeCompare(b.candidateId);
}
