"use client";

import { ChevronDown, ChevronUp, Download, Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RankedCandidateOutput, RankingStats, ValidationOutput } from "@/src/lib/types";

type ScoreTone = "excellent" | "strong" | "viable" | "borderline";

type SortField = "rank" | "score" | "productionSearch" | "appliedEngineering" | "evaluationMaturity" | "years";
type SortDirection = "asc" | "desc";

function toneFromScore(score: number): ScoreTone {
  if (score >= 0.82) return "excellent";
  if (score >= 0.68) return "strong";
  if (score >= 0.55) return "viable";
  return "borderline";
}

const SCORE_BADGE_TONE: Record<ScoreTone, string> = {
  excellent: "bg-emerald-600/10 text-emerald-700 border-emerald-600/20 hover:bg-emerald-600/15",
  strong: "bg-accent/10 text-accent-strong border-accent/20 hover:bg-accent/15",
  viable: "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/15",
  borderline: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
};

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-amber-500/20 text-amber-700 border-amber-500/30";
  if (rank === 2) return "bg-slate-400/20 text-slate-600 border-slate-400/30";
  if (rank === 3) return "bg-orange-600/20 text-orange-700 border-orange-600/30";
  return "bg-muted text-muted-foreground border-border";
}

function MiniBar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-xs font-medium tabular-nums">{Math.round(value * 100)}</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

export function CandidateRankingTable() {
  const [candidates, setCandidates] = useState<RankedCandidateOutput[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [validation, setValidation] = useState<ValidationOutput | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    async function load() {
      const [c, s, v] = await Promise.allSettled([
        fetch("/top_candidates.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch("/ranking_stats.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/validation_result.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (c.status === "fulfilled") setCandidates(c.value as RankedCandidateOutput[]);
      if (s.status === "fulfilled") setStats(s.value as RankingStats | null);
      if (v.status === "fulfilled") setValidation(v.value as ValidationOutput | null);
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      [c.candidate_id, c.profile.title, c.profile.company, c.profile.industry, c.profile.location, ...c.evidence]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [candidates, searchQuery]);

  const sorted = useMemo(() => {
    const mult = sortDirection === "asc" ? 1 : -1;
    const by = (a: RankedCandidateOutput, b: RankedCandidateOutput): number => {
      switch (sortField) {
        case "rank":
          return mult * (a.rank - b.rank);
        case "score":
          return mult * (a.score - b.score);
        case "productionSearch":
          return mult * (a.dimensions.productionSearch - b.dimensions.productionSearch);
        case "appliedEngineering":
          return mult * (a.dimensions.appliedEngineering - b.dimensions.appliedEngineering);
        case "evaluationMaturity":
          return mult * (a.dimensions.evaluationMaturity - b.dimensions.evaluationMaturity);
        case "years":
          return mult * (a.profile.years - b.profile.years);
      }
    };
    return [...filtered].sort(by);
  }, [filtered, sortField, sortDirection]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function toggleAll() {
    if (selectedIds.size === sorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((c) => c.candidate_id)));
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="ml-1 inline h-4 w-4" /> : <ChevronDown className="ml-1 inline h-4 w-4" />;
  };

  const sortableHead = (label: string, field: SortField) => (
    <TableHead className="cursor-pointer select-none font-semibold" onClick={() => toggleSort(field)}>
      {label}
      <SortIcon field={field} />
    </TableHead>
  );

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Candidate Rankings</h1>
              <p className="mt-1 text-muted-foreground">
                Deterministic, evidence-weighted shortlist for the Senior AI Engineer role — no LLM in the scoring path.
              </p>
            </div>
            <div className="flex gap-2">
              {stats && (
                <Badge variant="secondary" className="px-3 py-1">
                  {stats.candidateCount.toLocaleString()} processed · {(stats.elapsedMs / 1000).toFixed(2)}s
                </Badge>
              )}
              {validation && (
                <Badge variant={validation.ok ? "default" : "destructive"} className="px-3 py-1">
                  {validation.ok ? "Validation passed" : "Validation failed"}
                </Badge>
              )}
              <Button asChild variant="outline" size="sm">
                <a href="/submission.csv">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </a>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search candidates, positions, skills, evidence…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            {selectedIds.size > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {selectedIds.size} selected
              </Badge>
            )}
          </div>
        </div>

        {/* Ranked table */}
        <Card className="overflow-hidden border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox checked={sorted.length > 0 && selectedIds.size === sorted.length} onCheckedChange={toggleAll} />
                </TableHead>
                {sortableHead("Rank", "rank")}
                <TableHead className="font-semibold">Candidate</TableHead>
                {sortableHead("Score", "score")}
                {sortableHead("Prod. search", "productionSearch")}
                {sortableHead("Eng.", "appliedEngineering")}
                {sortableHead("Eval.", "evaluationMaturity")}
                {sortableHead("Yrs", "years")}
                <TableHead className="font-semibold">Evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c) => {
                const selected = selectedIds.has(c.candidate_id);
                const tone = toneFromScore(c.score);
                return (
                  <TableRow
                    key={c.candidate_id}
                    data-state={selected ? "selected" : undefined}
                    className={cn(selected && "bg-primary/5")}
                  >
                    <TableCell>
                      <Checkbox checked={selected} onCheckedChange={() => toggleRow(c.candidate_id)} />
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex h-9 w-10 items-center justify-center rounded-lg border text-sm font-bold tabular-nums", rankBadgeClass(c.rank))}>
                        #{c.rank}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">{c.profile.title}</span>
                        <span className="text-xs text-muted-foreground">{c.profile.company}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.candidate_id} · {c.profile.location}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("px-3 py-1 text-base font-semibold", SCORE_BADGE_TONE[tone])}>
                        {c.score.toFixed(4)}
                      </Badge>
                    </TableCell>
                    <TableCell><MiniBar value={c.dimensions.productionSearch} tone="bg-accent" /></TableCell>
                    <TableCell><MiniBar value={c.dimensions.appliedEngineering} tone="bg-accent" /></TableCell>
                    <TableCell><MiniBar value={c.dimensions.evaluationMaturity} tone="bg-accent" /></TableCell>
                    <TableCell className="text-sm font-medium">{c.profile.years.toFixed(1)}</TableCell>
                    <TableCell>
                      <div className="flex max-w-[16rem] flex-wrap gap-1">
                        {c.evidence.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="bg-secondary/60 px-2 py-0.5 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No candidates match “{searchQuery}”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {sorted.length} of {candidates.length} candidates
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
