import assert from "node:assert/strict";
import { test } from "node:test";
import {
  importPosting,
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
