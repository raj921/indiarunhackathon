import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { parseCsvLine, SUBMISSION_HEADER } from "./csv";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  rowCount: number;
}

async function loadCandidateIds(candidatesPath: string): Promise<Set<string>> {
  const ids = new Set<string>();
  const reader = createInterface({
    input: createReadStream(candidatesPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of reader) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line) as { candidate_id?: string };
    if (parsed.candidate_id) ids.add(parsed.candidate_id);
  }

  return ids;
}

export async function validateSubmission(csvPath: string, candidatesPath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const candidateIds = await loadCandidateIds(candidatesPath);
  const content = await readFile(csvPath, "utf8");
  const lines = content.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0] ? parseCsvLine(lines[0]) : [];
  const seenRanks = new Set<number>();
  const seenCandidates = new Set<string>();
  let previousScore = Number.POSITIVE_INFINITY;

  if (header.join(",") !== SUBMISSION_HEADER.join(",")) {
    errors.push(`Header must be exactly ${SUBMISSION_HEADER.join(",")}`);
  }

  if (lines.length !== 101) {
    errors.push(`Expected 100 data rows plus header; found ${Math.max(0, lines.length - 1)} data rows`);
  }

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const row = parseCsvLine(lines[lineIndex]);
    const rowNumber = lineIndex + 1;
    if (row.length !== 4) {
      errors.push(`Row ${rowNumber} has ${row.length} columns; expected 4`);
      continue;
    }

    const [candidateId, rankRaw, scoreRaw, reasoning] = row;
    const rank = Number(rankRaw);
    const score = Number(scoreRaw);

    if (!candidateIds.has(candidateId)) {
      errors.push(`Row ${rowNumber} references unknown candidate_id ${candidateId}`);
    }
    if (seenCandidates.has(candidateId)) {
      errors.push(`Duplicate candidate_id ${candidateId}`);
    }
    seenCandidates.add(candidateId);

    if (!Number.isInteger(rank) || rank < 1 || rank > 100) {
      errors.push(`Row ${rowNumber} rank must be an integer from 1 through 100`);
    }
    if (seenRanks.has(rank)) {
      errors.push(`Duplicate rank ${rank}`);
    }
    seenRanks.add(rank);

    if (!Number.isFinite(score)) {
      errors.push(`Row ${rowNumber} score must be numeric`);
    } else if (score > previousScore + 1e-9) {
      errors.push(`Row ${rowNumber} score increases from previous row`);
    }
    previousScore = score;

    if (reasoning.trim().length < 40) {
      errors.push(`Row ${rowNumber} reasoning is too short to be useful`);
    }
  }

  for (let rank = 1; rank <= 100; rank += 1) {
    if (!seenRanks.has(rank)) {
      errors.push(`Missing rank ${rank}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    rowCount: Math.max(0, lines.length - 1),
  };
}
