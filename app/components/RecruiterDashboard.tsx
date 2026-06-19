"use client";

import clsx from "clsx";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck2,
  Gauge,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import type { RankedCandidateOutput, RankingStats, ValidationOutput } from "@/src/lib/types";

interface RecruiterDashboardProps {
  candidates?: RankedCandidateOutput[];
  stats?: RankingStats | null;
  validation?: ValidationOutput | null;
}

type ScoreTone = "excellent" | "strong" | "viable" | "borderline";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function scoreTone(score: number): ScoreTone {
  if (score >= 0.82) return "excellent";
  if (score >= 0.68) return "strong";
  if (score >= 0.55) return "viable";
  return "borderline";
}

const TONE_BADGE: Record<ScoreTone, string> = {
  excellent: "bg-accent/15 text-accent-strong ring-accent/25",
  strong: "bg-emerald-600/12 text-emerald-700 ring-emerald-600/20",
  viable: "bg-warn/12 text-warn ring-warn/20",
  borderline: "bg-danger/10 text-danger ring-danger/20",
};

function barTone(value: number): string {
  if (value >= 0.7) return "bg-accent";
  if (value >= 0.4) return "bg-warn";
  return "bg-danger/70";
}

export function RecruiterDashboard({
  candidates: initialCandidates = [],
  stats: initialStats = null,
  validation: initialValidation = null,
}: RecruiterDashboardProps = {}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [stats, setStats] = useState(initialStats);
  const [validation, setValidation] = useState(initialValidation);
  const [selectedId, setSelectedId] = useState(initialCandidates[0]?.candidate_id ?? "");

  useEffect(() => {
    async function loadArtifacts() {
      const [candidateResult, statsResult, validationResult] = await Promise.allSettled([
        fetch("/top_candidates.json", { cache: "no-store" }).then((response) => (response.ok ? response.json() : [])),
        fetch("/ranking_stats.json", { cache: "no-store" }).then((response) => (response.ok ? response.json() : null)),
        fetch("/validation_result.json", { cache: "no-store" }).then((response) => (response.ok ? response.json() : null)),
      ]);

      if (candidateResult.status === "fulfilled") {
        const rows = candidateResult.value as RankedCandidateOutput[];
        setCandidates(rows);
        setSelectedId((current) => current || rows[0]?.candidate_id || "");
      }
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value as RankingStats | null);
      }
      if (validationResult.status === "fulfilled") {
        setValidation(validationResult.value as ValidationOutput | null);
      }
    }

    void loadArtifacts();
  }, []);

  const selected = useMemo(
    () => candidates.find((candidate) => candidate.candidate_id === selectedId) ?? candidates[0],
    [candidates, selectedId],
  );

  const topTenAverage =
    candidates.slice(0, 10).reduce((sum, candidate) => sum + candidate.score, 0) /
    Math.max(1, Math.min(10, candidates.length));

  return (
    <main className="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-10">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[22rem_1fr]">
        {/* ---------------- Sidebar ---------------- */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-2xl border border-line bg-paper/95 p-6 shadow-sm ring-1 ring-line/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-strong">
                  Redrob challenge
                </p>
                <h1 className="mt-3 font-[var(--font-serif)] text-[2.6rem] leading-[0.95] text-ink">
                  Talent intelligence ranker
                </h1>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
            </div>

            <div className="mt-6 space-y-3 text-sm leading-6 text-stone-700">
              <p>
                Deterministic shortlist for a founding Senior AI Engineer role. Reads the full candidate
                profile, career evidence, platform signals, and consistency checks.
              </p>
              <p className="font-semibold text-ink">No LLM, no network, no GPU in the submission path.</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric icon={Search} label="Candidates" value={stats ? stats.candidateCount.toLocaleString() : "—"} accent />
              <Metric icon={Gauge} label="Runtime" value={stats ? `${(stats.elapsedMs / 1000).toFixed(2)}s` : "—"} accent />
              <Metric icon={FileCheck2} label="Shortlist" value={String(candidates.length)} />
              <Metric icon={Target} label="Top-10 avg" value={candidates.length ? topTenAverage.toFixed(3) : "—"} />
            </div>

            <div className="mt-4">
              <Metric
                icon={CheckCircle2}
                label="Validation"
                value={validation?.ok ? "passed" : "pending"}
                tone={validation?.ok ? "good" : "idle"}
                wide
              />
            </div>

            <a
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              href="/submission.csv"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download submission CSV
            </a>
          </div>

          {/* JD interpretation */}
          <div className="rounded-2xl border border-line bg-paper/95 p-6 shadow-sm ring-1 ring-line/40">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-strong">
              JD interpretation
            </p>
            <h2 className="mt-2 text-xl font-black">What a strong recruiter weighs</h2>
            <div className="mt-4 grid gap-3">
              <EvidenceCard title="Search systems" text="Production retrieval, ranking, matching, recommender, vector/hybrid search." />
              <EvidenceCard title="Shipping judgment" text="Python, backend/data infra, product-company ownership, scale and operations." />
              <EvidenceCard title="Hireability" text="Recent activity, response rate, notice period, relocation, verification, consistency." />
            </div>
          </div>
        </aside>

        {/* ---------------- Main column ---------------- */}
        <section className="grid gap-6">
          {/* Ranked shortlist — card-wrapped table (21st.dev CustomersTableCard pattern) */}
          <div className="overflow-hidden rounded-2xl border border-line bg-paper/95 shadow-sm ring-1 ring-line/40">
            <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden />
                  Ranked shortlist
                </h2>
                <p className="mt-0.5 text-sm text-stone-600">Top 100 candidates, scored from profile evidence.</p>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent-strong ring-1 ring-accent/20">
                {candidates.length} rows
              </span>
            </header>

            {candidates.length === 0 ? (
              <div className="p-8 text-sm text-stone-700">
                Run <code className="rounded bg-stone-200 px-1.5 py-0.5">npm run rank</code> to generate
                <code className="ml-1 rounded bg-stone-200 px-1.5 py-0.5">outputs/top_candidates.json</code>.
              </div>
            ) : (
              <div className="max-h-[46rem] overflow-auto">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-[#ece2d0]/95 text-xs uppercase tracking-[0.12em] text-stone-600 backdrop-blur supports-[backdrop-filter]:bg-[#ece2d0]/80">
                    <tr>
                      <th className="w-14 px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="w-28 px-4 py-3">Score</th>
                      <th className="w-48 px-4 py-3">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate) => {
                      const tone = scoreTone(candidate.score);
                      const active = candidate.candidate_id === selected?.candidate_id;
                      return (
                        <tr
                          key={candidate.candidate_id}
                          onClick={() => setSelectedId(candidate.candidate_id)}
                          className={clsx(
                            "cursor-pointer border-t border-line/70 transition-colors",
                            active ? "bg-white ring-inset" : "hover:bg-white/70",
                          )}
                        >
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                "inline-flex size-7 items-center justify-center rounded-lg text-xs font-black tabular-nums",
                                candidate.rank <= 3
                                  ? "bg-accent text-white"
                                  : "bg-stone-200/70 text-stone-700",
                              )}
                            >
                              {candidate.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-ink">{candidate.profile.title}</div>
                            <div className="mt-1 truncate text-xs text-stone-600">
                              {candidate.candidate_id} · {candidate.profile.company} · {candidate.profile.years.toFixed(1)} yrs
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-black tabular-nums">{candidate.score.toFixed(4)}</div>
                            <span
                              className={clsx(
                                "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                                TONE_BADGE[tone],
                              )}
                            >
                              {tone}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {candidate.evidence.slice(0, 2).map((item) => (
                                <span
                                  key={item}
                                  className="rounded-md border border-accent/20 bg-accent/5 px-1.5 py-0.5 text-[11px] font-semibold text-accent-strong"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <footer className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-stone-500">
              <span>
                Showing <strong className="text-stone-700">{candidates.length}</strong> ranked candidates
              </span>
              <span>Click a row to inspect the score breakdown</span>
            </footer>
          </div>

          {/* Candidate detail panel */}
          <CandidatePanel candidate={selected} />
        </section>
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent = false,
  tone = "neutral",
  wide = false,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
  accent?: boolean;
  tone?: "neutral" | "good" | "idle";
  wide?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-white/60 p-3",
        wide && "col-span-2",
        tone === "good" ? "border-emerald-500/25" : tone === "idle" ? "border-warn/25" : "border-line",
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
        <span
          className={clsx(
            "flex size-6 items-center justify-center rounded-md",
            accent ? "bg-accent/12 text-accent" : "bg-stone-200/70 text-stone-600",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        {label}
      </div>
      <div className="mt-2 text-lg font-black tabular-nums">{value}</div>
    </div>
  );
}

function EvidenceCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/55 p-3.5">
      <h3 className="text-sm font-black text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-6 text-stone-700">{text}</p>
    </div>
  );
}

function CandidatePanel({ candidate }: { candidate?: RankedCandidateOutput }) {
  if (!candidate) {
    return (
      <aside className="rounded-2xl border border-line bg-paper/95 p-6 text-sm text-stone-700 shadow-sm ring-1 ring-line/40">
        No candidate selected yet.
      </aside>
    );
  }

  const dimensionRows = [
    ["Production search", candidate.dimensions.productionSearch],
    ["Applied engineering", candidate.dimensions.appliedEngineering],
    ["Evaluation maturity", candidate.dimensions.evaluationMaturity],
    ["Availability/logistics", candidate.dimensions.availabilityLogistics],
    ["Trust consistency", candidate.dimensions.trustConsistency],
  ] as const;

  const tone = scoreTone(candidate.score);

  return (
    <aside className="rounded-2xl border border-line bg-paper/95 p-6 shadow-sm ring-1 ring-line/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-strong">Score evidence</p>
          <h2 className="mt-2 text-2xl font-black">{candidate.profile.title}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-stone-600">
            <MapPin className="h-4 w-4" aria-hidden />
            {candidate.profile.location} · {candidate.profile.country}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="rounded-xl bg-ink px-3 py-2 text-right text-white">
            <div className="text-[10px] uppercase tracking-[0.12em] opacity-70">Rank</div>
            <div className="text-xl font-black">#{candidate.rank}</div>
          </div>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
              TONE_BADGE[tone],
            )}
          >
            {candidate.score.toFixed(4)} · {tone}
          </span>
        </div>
      </div>

      <p className="mt-5 rounded-xl border border-line bg-white/55 p-3.5 text-sm leading-6 text-stone-800">
        {candidate.reasoning}
      </p>

      {/* Score dimensions — animated bars (21st.dev AnimatedProgressCard pattern, CSS-only) */}
      <div className="mt-5 space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">Score dimensions</h3>
        {dimensionRows.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-xs font-bold tracking-wide text-stone-600">
              <span>{label}</span>
              <span className="tabular-nums">{pct(value)}</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-stone-200/80"
              role="progressbar"
              aria-valuenow={Math.round(value * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={label}
            >
              <div
                className={clsx("h-full rounded-full transition-[width] duration-700 ease-out", barTone(value))}
                style={{ width: pct(value) }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">
            <Activity className="h-3.5 w-3.5 text-accent" aria-hidden />
            Platform signals
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Signal label="Open" value={candidate.signals.openToWork ? "Yes" : "No"} />
            <Signal label="Response" value={`${Math.round(candidate.signals.responseRate * 100)}%`} />
            <Signal label="Notice" value={`${candidate.signals.noticeDays}d`} />
            <Signal label="Saved" value={`${candidate.signals.savedByRecruiters30d}`} />
          </dl>
        </div>
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">Evidence tags</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {candidate.evidence.map((item) => (
              <span
                key={item}
                className="rounded-md border border-accent/20 bg-accent/5 px-1.5 py-0.5 text-[11px] font-semibold text-accent-strong"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {candidate.concerns.length > 0 && (
        <div className="mt-5 rounded-xl border border-warn/25 bg-warn/10 p-3.5">
          <h3 className="flex items-center gap-2 text-sm font-black text-warn">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            Concerns
          </h3>
          <ul className="mt-2 list-inside list-disc text-sm leading-6 text-stone-800">
            {candidate.concerns.map((concern) => (
              <li key={concern}>{concern}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white/55 p-2">
      <dt className="text-[10px] uppercase tracking-[0.12em] text-stone-500">{label}</dt>
      <dd className="mt-1 font-black">{value}</dd>
    </div>
  );
}
