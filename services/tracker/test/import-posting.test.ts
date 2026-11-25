import assert from "node:assert/strict";
import { test } from "node:test";
import {
  importPosting,
  linkedInJobUrl,
  parsePosting,
} from "../src/applications/import-posting.js";

test("extracts a job posting from a JSON-LD graph and preserves readable text", () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@graph": [
      { "@type": "Organization" },
      {
        "@type": "JobPosting",
        title: "Backend Engineer",
        hiringOrganization: { name: "Northstar" },
        description: "<p>Build APIs &amp; services.</p><p>Use TypeScript.</p>",
        jobLocation: {
          address: { addressLocality: "Pune", addressCountry: "IN" },
        },
        jobLocationType: "TELECOMMUTE",
        validThrough: "2026-12-20T12:00:00Z",
        baseSalary: {
          currency: "INR",
          value: { minValue: 100, maxValue: 200, unitText: "YEAR" },
        },
      },
    ],
  })}</script>`;
  const posting = parsePosting(html, "https://example.com/job");
  assert.equal(posting.company, "Northstar");
  assert.equal(posting.role, "Backend Engineer");
  assert.match(
    posting.description!,
    /Build APIs & services\.\s+Use TypeScript\./,
  );
  assert.equal(posting.location, "Pune, IN");
  assert.equal(posting.workModel, "Remote");
  assert.equal(posting.deadline, "2026-12-20");
  assert.equal(posting.salaryRange, "INR 100 – 200 YEAR");
});

test("rejects nonpublic URLs and pages without job structured data", async () => {
  await assert.rejects(
    importPosting("http://127.0.0.1:3001/health"),
    /public address/,
  );
  await assert.rejects(importPosting("http://[::1]/"), /public address/);
  await assert.rejects(
    importPosting("http://169.254.169.254/"),
    /public address/,
  );
  await assert.rejects(
    importPosting("http://user:pass@example.com/"),
    /public HTTP/,
  );
  assert.throws(
    () => parsePosting("<html></html>", "https://example.com"),
    /No structured job posting/,
  );
});

test("normalizes LinkedIn job links and safely ignores other hosts", () => {
  for (const url of [
    "https://www.linkedin.com/jobs/view/1234567890/?tracking=abc",
    "https://in.linkedin.com/jobs/view/engineer-at-example-1234567890",
    "https://www.linkedin.com/jobs/collections/recommended/?currentJobId=1234567890",
  ]) {
    assert.match(
      linkedInJobUrl(new URL(url))!.href,
      /\/jobs\/view\/1234567890\/$/,
    );
  }
  assert.equal(
    linkedInJobUrl(
      new URL("https://linkedin.com.example.org/jobs/view/1234567890"),
    ),
    undefined,
  );
  assert.equal(
    linkedInJobUrl(
      new URL("https://linkedin.com/jobs/search/?currentJobId=abc"),
    ),
    undefined,
  );
});

test("extracts public LinkedIn page content when JSON-LD is unavailable", () => {
  const html = `<h1 class="top-card-layout__title"> Software Engineer </h1>
    <a class="topcard__org-name-link">Example Co</a>
    <span class="topcard__flavor--bullet">Pune, India</span>
    <section class="description__text"><div class="show-more-less-html__markup">
      <p>Build APIs &amp; services.</p><p>Use TypeScript.</p>
    </div></section>`;
  const result = parsePosting(
    html,
    "https://www.linkedin.com/jobs/view/1234567890/",
  );
  assert.equal(result.company, "Example Co");
  assert.equal(result.role, "Software Engineer");
  assert.equal(result.location, "Pune, India");
  assert.equal(result.source, "LinkedIn");
  assert.match(
    result.description!,
    /Build APIs & services\.\s+Use TypeScript\./,
  );
  assert.throws(
    () =>
      parsePosting(
        "<h1>Sign in</h1>",
        "https://www.linkedin.com/jobs/view/1234567890/",
      ),
    /full public posting/,
  );
});
