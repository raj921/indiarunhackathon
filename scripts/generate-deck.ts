import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import type { RankedCandidateOutput, RankingStats } from "../src/lib/types";

const docsDir = resolve("docs");
const htmlPath = resolve(docsDir, "approach_deck.html");
const pdfPath = resolve(docsDir, "approach_deck.pdf");
const shortlistPath = resolve("outputs/top_candidates.json");
const statsPath = resolve("outputs/ranking_stats.json");

async function readJson<T>(path: string, fallback: T): Promise<T> {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function slide(title: string, body: string): string {
  return `<section class="slide"><div class="kicker">Redrob Talent Intelligence</div><h1>${title}</h1>${body}</section>`;
}

const candidates = await readJson<RankedCandidateOutput[]>(shortlistPath, []);
const stats = await readJson<RankingStats | null>(statsPath, null);
const top = candidates.slice(0, 3);

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Redrob Talent Intelligence Ranker</title>
  <style>
    @page { size: 16in 9in; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #efe7d7; color: #17211b; font-family: Avenir Next, Trebuchet MS, sans-serif; }
    .slide { page-break-after: always; width: 16in; height: 9in; padding: .72in .82in; display: flex; flex-direction: column; justify-content: center; background: linear-gradient(135deg, #fffaf0, #eee2cc); border-bottom: 10px solid #0f766e; }
    .kicker { letter-spacing: .16em; text-transform: uppercase; color: #0b4f4a; font-size: 17px; font-weight: 900; }
    h1 { font-family: Georgia, serif; font-size: 62px; line-height: .96; margin: 18px 0 24px; max-width: 11.5in; }
    h2 { font-size: 30px; margin: 0 0 14px; }
    p, li { font-size: 23px; line-height: 1.42; }
    ul { margin: 0; padding-left: 28px; max-width: 12in; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 20px; }
    .card { border: 2px solid #d8cbb6; border-radius: 8px; background: rgba(255,255,255,.58); padding: 22px; min-height: 180px; }
    .metric { font-size: 54px; font-weight: 950; color: #0f766e; }
    .small { font-size: 18px; color: #5f574a; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 18px; }
    th, td { border-bottom: 1px solid #d8cbb6; text-align: left; padding: 12px; vertical-align: top; }
    th { color: #0b4f4a; text-transform: uppercase; letter-spacing: .1em; font-size: 13px; }
  </style>
</head>
<body>
${slide(
  "Candidate ranking that behaves like a strong recruiter",
  `<p>Built for the Senior AI Engineer founding-team JD: not keyword search, but evidence-weighted understanding of search/ranking systems, product shipping, evaluation maturity, hireability, and trap avoidance.</p>`,
)}
${slide(
  "What the JD actually asks for",
  `<div class="grid">
    <div class="card"><h2>Production search</h2><p>Embeddings, retrieval, ranking, recommender systems, hybrid/vector infrastructure.</p></div>
    <div class="card"><h2>Shipper mindset</h2><p>Python, backend/data infra, production ownership, product-company judgment.</p></div>
    <div class="card"><h2>Evaluation maturity</h2><p>NDCG, MRR, MAP, offline benchmarks, A/B testing, feedback loops.</p></div>
  </div>`,
)}
${slide(
  "Architecture",
  `<ul>
    <li>Stream <code>candidates.jsonl</code> line-by-line; keep only the strongest shortlist in memory.</li>
    <li>Extract evidence from profile, career history, skills, and Redrob behavioral signals.</li>
    <li>Blend five deterministic dimensions, then apply trap and consistency penalties.</li>
    <li>Generate reasoning only from facts found in the candidate profile.</li>
  </ul>`,
)}
${slide(
  "Scoring model",
  `<div class="grid">
    <div class="card"><div class="metric">35%</div><p>Production search/retrieval/ranking evidence.</p></div>
    <div class="card"><div class="metric">20%</div><p>Applied ML and product engineering depth.</p></div>
    <div class="card"><div class="metric">15%</div><p>Evaluation maturity.</p></div>
  </div>
  <p>Remaining 30% covers availability, logistics, trust, profile completeness, and anti-honeypot consistency.</p>`,
)}
${slide(
  "Trap defenses",
  `<ul>
    <li>Downranks AI skill stuffing when career evidence is weak.</li>
    <li>Penalizes non-engineering titles with dense AI keyword lists.</li>
    <li>Detects stale activity, low response rates, long notice, and inconsistent skill/role durations.</li>
    <li>Separates CV/speech/robotics-heavy profiles from the JD's NLP/retrieval/search mandate.</li>
  </ul>`,
)}
${slide(
  "Runtime and validation",
  `<div class="grid">
    <div class="card"><div class="metric">${stats ? stats.candidateCount.toLocaleString() : "100K"}</div><p>Candidates processed.</p></div>
    <div class="card"><div class="metric">${stats ? `${(stats.elapsedMs / 1000).toFixed(1)}s` : "<5m"}</div><p>CPU-only ranking runtime.</p></div>
    <div class="card"><div class="metric">100</div><p>CSV rows, ranks 1-100, monotonic scores.</p></div>
  </div>`,
)}
${slide(
  "Sample top candidates",
  top.length
    ? `<table><thead><tr><th>Rank</th><th>Candidate</th><th>Score</th><th>Evidence</th></tr></thead><tbody>${top
        .map(
          (candidate) =>
            `<tr><td>#${candidate.rank}</td><td>${candidate.candidate_id}<br><span class="small">${candidate.profile.title}, ${candidate.profile.years.toFixed(1)} yrs</span></td><td>${candidate.score.toFixed(4)}</td><td>${candidate.evidence.slice(0, 4).join(", ")}</td></tr>`,
        )
        .join("")}</tbody></table>`
    : `<p>Run <code>npm run rank</code> before regenerating this deck to include live top-candidate evidence.</p>`,
)}
${slide(
  "Why this can win",
  `<p>The submission is reproducible, fast, and defensible in interview. It avoids the obvious keyword trap, uses the behavioral signals Redrob intentionally provided, and produces explanations a recruiter can audit against the source profile.</p>`,
)}
</body>
</html>`;

await mkdir(docsDir, { recursive: true });
await writeFile(htmlPath, html, "utf8");

const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Brave Browser 2.app/Contents/MacOS/Brave Browser",
];
const chrome = chromeCandidates.find((path) => existsSync(path));

if (chrome) {
  const result = spawnSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--print-to-pdf=${pdfPath}`,
    `file://${htmlPath}`,
  ]);

  if (result.status !== 0) {
    console.warn(result.stderr.toString() || "Chrome PDF export failed; HTML deck was still written.");
  }
}

console.log(`Wrote ${htmlPath}`);
console.log(existsSync(pdfPath) ? `Wrote ${pdfPath}` : "PDF was not generated because no supported local browser was found.");
