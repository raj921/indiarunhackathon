import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { createInterface } from "node:readline";
import { scoresToCsv, toDashboardRows } from "./csv";
import { compareScores, scoreCandidate } from "./scoring";
import type { Candidate, CandidateScore, RankingStats } from "./types";

export interface RankOptions {
  candidatesPath: string;
  outCsvPath: string;
  outJsonPath?: string;
  outStatsPath?: string;
  shortlistSize?: number;
}

export async function rankCandidates(options: RankOptions): Promise<{
  rows: CandidateScore[];
  stats: RankingStats;
}> {
  const started = Date.now();
  const shortlistSize = options.shortlistSize ?? 100;
  const keepSize = Math.max(500, shortlistSize * 6);
  const top: CandidateScore[] = [];
  let candidateCount = 0;

  const reader = createInterface({
    input: createReadStream(options.candidatesPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of reader) {
    if (!line.trim()) continue;
    const candidate = JSON.parse(line) as Candidate;
    const scored = scoreCandidate(candidate);
    candidateCount += 1;
    top.push(scored);

    if (top.length > keepSize * 2) {
      top.sort(compareScores);
      top.length = keepSize;
    }
  }

  top.sort(compareScores);
  const rows = top.slice(0, shortlistSize);
  const csv = scoresToCsv(rows);
  const jsonPath = options.outJsonPath ?? options.outCsvPath.replace(/\.csv$/i, ".json");
  const statsPath = options.outStatsPath ?? options.outCsvPath.replace(/\.csv$/i, ".stats.json");
  const dashboardRows = toDashboardRows(rows);

  await mkdir(dirname(options.outCsvPath), { recursive: true });
  await writeFile(options.outCsvPath, csv, "utf8");
  const publicCsvPath = join(process.cwd(), "public", "submission.csv");
  await mkdir(dirname(publicCsvPath), { recursive: true });
  await writeFile(publicCsvPath, csv, "utf8");
  await writeFile(jsonPath, `${JSON.stringify(dashboardRows, null, 2)}\n`, "utf8");
  await writeFile(join(process.cwd(), "public", "top_candidates.json"), `${JSON.stringify(dashboardRows, null, 2)}\n`, "utf8");

  const stats: RankingStats = {
    candidateCount,
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - started,
    outputCsv: relative(process.cwd(), options.outCsvPath),
    outputJson: relative(process.cwd(), jsonPath),
  };

  await writeFile(statsPath, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
  await writeFile(join(process.cwd(), "public", "ranking_stats.json"), `${JSON.stringify(stats, null, 2)}\n`, "utf8");
  return { rows, stats };
}
