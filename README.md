# Redrob Talent Intelligence Ranker

Deterministic, no-LLM candidate ranking system for the India Runs / Redrob Data & AI challenge.

The ranker is built for the released Senior AI Engineer founding-team JD. It does not call OpenRouter, OpenAI, Gemini, Claude, or any hosted model in the submission path. The official ranking command streams `candidates.jsonl`, scores candidates from local evidence, and writes the required top-100 CSV.

## Why This Approach

The JD says the trap clearly: the right answer is not "count AI keywords." A strong match needs production retrieval/ranking/search evidence, product engineering judgment, evaluation maturity, and enough platform activity that a recruiter can actually reach them.

This system scores five dimensions:

- `35%` production search, retrieval, matching, recommendation, vector/hybrid infrastructure
- `20%` applied ML and product engineering depth
- `15%` ranking evaluation maturity: NDCG, MRR, MAP, A/B tests, offline benchmarks
- `15%` availability and logistics: location, experience band, response rate, notice, open-to-work
- `15%` profile trust and anti-trap consistency

It then subtracts penalties for keyword stuffing, non-engineering profiles with AI-heavy skill lists, pure research without deployment, consulting-only backgrounds, CV/speech/robotics-only focus, stale activity, long notice, and inconsistent role/skill durations.

## Setup

```bash
npm install
```

The challenge data folder should be present at:

```text
India_runs_data_and_ai_challenge/
```

The full `candidates.jsonl` file is intentionally not required to be committed to GitHub.

## Generate Submission CSV

```bash
npm run rank -- --candidates India_runs_data_and_ai_challenge/candidates.jsonl --out outputs/submission.csv
```

This writes:

- `outputs/submission.csv`
- `outputs/top_candidates.json`
- `outputs/ranking_stats.json`

## Validate Submission

```bash
npm run validate -- --csv outputs/submission.csv --candidates India_runs_data_and_ai_challenge/candidates.jsonl
```

The validator checks the required header, 100 data rows, ranks 1-100 exactly once, unique valid candidate IDs, non-increasing scores, and useful reasoning.

## Run the Recruiter Dashboard

```bash
npm run dev
```

Open `http://localhost:3000`. The dashboard reads `outputs/top_candidates.json`, shows the shortlist, score breakdowns, evidence tags, concerns, runtime stats, and CSV download.

## Generate Deck PDF

```bash
npm run deck
```

This writes:

- `docs/approach_deck.html`
- `docs/approach_deck.pdf` when a local Chrome/Brave browser is available

## Verification Commands

```bash
npm run typecheck
npm run test
npm run build
npm run rank
npm run validate
npm run deck
```

## AI Tool Declaration

AI tools may be used during development, but the submitted ranker itself uses no LLM calls, no network calls, no GPU, and no model downloads.
