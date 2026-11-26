import type { Application } from "../../../types/application";

const SYSTEM_FIELDS = new Set([
  "_id",
  "version",
  "history",
  "createdAt",
  "updatedAt",
  "ownerId",
]);

function csvEscape(value: unknown) {
  const text =
    value === undefined || value === null
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toJson(jobs: Application[]) {
  return JSON.stringify(jobs, null, 2);
}

export function toCsv(jobs: Application[]) {
  const keys = [
    "company",
    "role",
    "stage",
    "priority",
    "location",
    "workModel",
    "salaryRange",
    "source",
    "appliedAt",
    "followUp",
    "deadline",
    "resumeVersion",
    "tags",
    "skills",
    "responsibilities",
    "notes",
    "rejectionReason",
  ] as const;
  const header = keys.join(",");
  const rows = jobs.map((job) =>
    keys
      .map((key) => {
        const raw = (job as Record<string, unknown>)[key];
        if (Array.isArray(raw)) return csvEscape(raw.join(";"));
        return csvEscape(raw);
      })
      .join(","),
  );
  return [header, ...rows].join("\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function stripSystemFields(record: Record<string, unknown>) {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SYSTEM_FIELDS.has(key)) continue;
    next[key] = value;
  }
  return next;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
    } else if (char === "\r") {
      // ignore
    } else {
      current += char;
    }
  }
  if (current.length) lines.push(current);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const values: string[] = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        values.push(field);
        field = "";
      } else {
        field += char;
      }
    }
    values.push(field);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });
    rows.push(record);
  }
  return rows;
}

export function parseImportRecords(text: string, filename: string): Record<string, unknown>[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    return parseCsv(text).map((row) => {
      const next: Record<string, unknown> = { ...row };
      if (row.tags) next.tags = row.tags.split(";").map((s) => s.trim()).filter(Boolean);
      if (row.skills) next.skills = row.skills.split(";").map((s) => s.trim()).filter(Boolean);
      if (row.responsibilities) next.responsibilities = row.responsibilities.split(";").map((s) => s.trim()).filter(Boolean);
      return stripSystemFields(next);
    });
  }
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.applications)
      ? parsed.applications
      : [];
  return list.map((item: unknown) =>
    stripSystemFields((item ?? {}) as Record<string, unknown>),
  );
}
