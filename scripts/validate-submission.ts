import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { validateSubmission } from "../src/lib/validator";

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return fallback;
}

const csvPath = resolve(argValue("--csv", "outputs/submission.csv"));
const candidatesPath = resolve(
  argValue("--candidates", "India_runs_data_and_ai_challenge/candidates.jsonl"),
);

const result = await validateSubmission(csvPath, candidatesPath);
const resultPath = resolve("outputs/validation_result.json");
await mkdir(dirname(resultPath), { recursive: true });
await writeFile(resultPath, `${JSON.stringify({ ...result, validatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
await writeFile(resolve("public/validation_result.json"), `${JSON.stringify({ ...result, validatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");

if (!result.ok) {
  console.error(`Submission validation failed with ${result.errors.length} error(s):`);
  for (const error of result.errors.slice(0, 40)) {
    console.error(`- ${error}`);
  }
  if (result.errors.length > 40) {
    console.error(`...${result.errors.length - 40} more`);
  }
  process.exit(1);
}

console.log(`Submission validation passed: ${result.rowCount} ranked candidates.`);
