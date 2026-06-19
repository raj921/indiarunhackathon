import { resolve } from "node:path";
import { rankCandidates } from "../src/lib/ranker";

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return fallback;
}

const candidatesPath = resolve(
  argValue("--candidates", "India_runs_data_and_ai_challenge/candidates.jsonl"),
);
const outCsvPath = resolve(argValue("--out", "outputs/submission.csv"));
const outJsonPath = resolve(argValue("--json", "outputs/top_candidates.json"));
const outStatsPath = resolve(argValue("--stats", "outputs/ranking_stats.json"));

const { rows, stats } = await rankCandidates({
  candidatesPath,
  outCsvPath,
  outJsonPath,
  outStatsPath,
});

console.log(`Ranked ${stats.candidateCount.toLocaleString()} candidates in ${(stats.elapsedMs / 1000).toFixed(2)}s`);
console.log(`Wrote ${rows.length} rows to ${stats.outputCsv}`);
console.log(`Top candidate: ${rows[0]?.candidateId ?? "none"} (${rows[0]?.score.toFixed(4) ?? "n/a"})`);
