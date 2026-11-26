import { load } from "cheerio";
import { ImportError } from "./errors.js";

type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}
function findPosting(value: unknown): JsonObject | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPosting(item);
      if (found) return found;
    }
    return;
  }
  const item = object(value);
  if (!item) return;
  if (
    item["@type"] === "JobPosting" ||
    (Array.isArray(item["@type"]) && item["@type"].includes("JobPosting"))
  )
    return item;
  return findPosting(item["@graph"]);
}
function cleanText(value: unknown, limit: number) {
  if (typeof value !== "string") return undefined;
  const fragment = load(
    value.replace(/<\/(p|li|div|h[1-6])\s*>|<br\s*\/?>/gi, "\n"),
  );
  fragment("script,style").remove();
  const result = fragment
    .text()
    .replace(/\r/g, "")
    .replace(/\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return result ? result.slice(0, limit) : undefined;
}

export function linkedInJobUrl(url: URL): URL | undefined {
  const host = url.hostname.toLowerCase();
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return;
  const pathMatch = url.pathname.match(/^\/jobs\/view\/(?:[^/]*-)?(\d+)\/?$/i);
  const queryId = url.pathname.startsWith("/jobs/")
    ? url.searchParams.get("currentJobId")
    : null;
  const id = pathMatch?.[1] ?? (/^\d+$/.test(queryId ?? "") ? queryId : null);
  if (!id) return;
  return new URL(`https://${host}/jobs/view/${id}/`);
}

export function parsePosting(html: string, sourceUrl: string) {
  const page = load(html);
  let posting: JsonObject | undefined;
  page('script[type="application/ld+json"]').each((_index, element) => {
    if (posting) return;
    try {
      posting = findPosting(JSON.parse(page(element).html() ?? ""));
    } catch {
      /* Ignore unrelated invalid JSON-LD. */
    }
  });
  const source = new URL(sourceUrl);
  const isLinkedIn =
    source.hostname.toLowerCase() === "linkedin.com" ||
    source.hostname.toLowerCase().endsWith(".linkedin.com");
  if (!posting && isLinkedIn) {
    const role = cleanText(
      page("h1.top-card-layout__title, h1.topcard__title").first().text(),
      120,
    );
    const company = cleanText(
      page(".topcard__org-name-link, .topcard__flavor-row .topcard__flavor a")
        .first()
        .text(),
      120,
    );
    const descriptionElement = page(
      ".description__text .show-more-less-html__markup, .show-more-less-html__markup",
    ).first();
    const description = cleanText(descriptionElement.html(), 24000);
    const location = cleanText(
      page(".topcard__flavor--bullet").first().text(),
      3000,
    );
    if (role && company && description)
      return {
        jobUrl: sourceUrl,
        company,
        role,
        description,
        location,
        source: "LinkedIn",
      };
    throw new ImportError(
      "LinkedIn didn’t provide the full public posting. Try the employer’s page or paste the job description.",
    );
  }
  if (!posting)
    throw new ImportError(
      "No structured job posting found. Try the employer's job page or enter the details manually.",
    );
  const locationValue = Array.isArray(posting.jobLocation)
    ? posting.jobLocation[0]
    : posting.jobLocation;
  const address = object(object(locationValue)?.address);
  const location = [
    address?.addressLocality,
    address?.addressRegion,
    address?.addressCountry,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : undefined))
    .filter(Boolean)
    .join(", ");
  const organization = object(posting.hiringOrganization);
  const rawDeadline =
    typeof posting.validThrough === "string"
      ? posting.validThrough.slice(0, 10)
      : "";
  const salary = object(posting.baseSalary);
  const amount = object(salary?.value);
  const amounts = [amount?.minValue ?? amount?.value, amount?.maxValue]
    .filter((value) => typeof value === "number" || typeof value === "string")
    .map(String);
  const salaryRange = amounts.length
    ? [salary?.currency, amounts.join(" – "), amount?.unitText]
        .filter(Boolean)
        .join(" ")
    : undefined;
  return {
    jobUrl: sourceUrl,
    ...(isLinkedIn ? { source: "LinkedIn" } : {}),
    company: cleanText(organization?.name, 120),
    role: cleanText(posting.title, 120),
    description: cleanText(posting.description, 24000),
    location: location || undefined,
    workModel:
      posting.jobLocationType === "TELECOMMUTE"
        ? ("Remote" as const)
        : undefined,
    deadline:
      /^\d{4}-\d{2}-\d{2}$/.test(rawDeadline) &&
      !Number.isNaN(Date.parse(rawDeadline))
        ? rawDeadline
        : undefined,
    salaryRange,
  };
}
