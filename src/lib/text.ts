export interface WeightedTerm {
  term: string | RegExp;
  weight: number;
  label?: string;
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[^a-z0-9+#@./ -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreTerms(text: string, terms: WeightedTerm[], target = 10): number {
  const normalized = normalizeText(text);
  let score = 0;

  for (const item of terms) {
    const matched =
      typeof item.term === "string"
        ? normalized.includes(normalizeText(item.term))
        : item.term.test(text);

    if (matched) {
      score += item.weight;
    }
  }

  return clamp(score / target);
}

export function matchingLabels(text: string, terms: WeightedTerm[], limit = 8): string[] {
  const normalized = normalizeText(text);
  const labels: string[] = [];

  for (const item of terms) {
    const matched =
      typeof item.term === "string"
        ? normalized.includes(normalizeText(item.term))
        : item.term.test(text);

    if (matched) {
      labels.push(item.label ?? String(item.term));
    }

    if (labels.length >= limit) {
      break;
    }
  }

  return labels;
}

export function daysBetween(referenceDate: Date, dateValue: string): number {
  const date = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return 365;
  }
  return Math.max(0, Math.floor((referenceDate.getTime() - date.getTime()) / 86_400_000));
}

export function monthsBetween(startValue: string, endValue: string | null, referenceDate: Date): number {
  const start = new Date(`${startValue}T00:00:00Z`);
  const end = endValue ? new Date(`${endValue}T00:00:00Z`) : referenceDate;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
}

export function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
