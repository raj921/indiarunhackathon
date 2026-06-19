import { describe, expect, it } from "vitest";
import { escapeCsv, parseCsvLine } from "../src/lib/csv";

describe("csv helpers", () => {
  it("escapes quoted reasoning", () => {
    const escaped = escapeCsv('Built "hybrid search", shipped ranking.');
    expect(escaped).toBe('"Built ""hybrid search"", shipped ranking."');
  });

  it("parses quoted commas", () => {
    expect(parseCsvLine('CAND_1,1,0.9,"Senior AI Engineer, Pune"')).toEqual([
      "CAND_1",
      "1",
      "0.9",
      "Senior AI Engineer, Pune",
    ]);
  });
});
