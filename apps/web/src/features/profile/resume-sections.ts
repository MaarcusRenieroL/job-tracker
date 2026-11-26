import { z } from "zod";

export const basicsSectionSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(120),
  headline: z.string().trim().max(160),
  email: z
    .string()
    .trim()
    .refine(
      (value) => !value || z.email().safeParse(value).success,
      "Enter a valid email address.",
    ),
  phone: z.string().trim().max(40),
  location: z.string().trim().max(120),
  links: z.string().trim().max(400),
});

export const summarySectionSchema = z.object({
  summary: z.string().trim().max(2500),
});

export const experienceEntrySchema = z.object({
  company: z.string().trim().min(1, "Enter the company name.").max(120),
  role: z.string().trim().min(1, "Enter your role or title.").max(120),
  duration: z.string().trim().max(80),
  location: z.string().trim().max(120),
  highlights: z.string().trim().max(4000),
});

export const experienceSectionSchema = z.object({
  items: z.array(experienceEntrySchema).max(20),
});

export const skillsSectionSchema = z.object({
  skills: z.string().trim().max(2000),
});

export const projectEntrySchema = z.object({
  name: z.string().trim().min(1, "Enter the project name.").max(120),
  techStack: z.string().trim().max(240),
  link: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value || z.url({ protocol: /^https?$/ }).safeParse(value).success,
      "Enter a valid HTTP or HTTPS URL.",
    ),
  description: z.string().trim().max(2500),
});

export const projectsSectionSchema = z.object({
  items: z.array(projectEntrySchema).max(15),
});

export const educationEntrySchema = z.object({
  institution: z.string().trim().min(1, "Enter the school or university.").max(160),
  degree: z.string().trim().min(1, "Enter the degree or program.").max(160),
  duration: z.string().trim().max(80),
  details: z.string().trim().max(1000),
});

export const educationSectionSchema = z.object({
  items: z.array(educationEntrySchema).max(10),
});

export const certificationEntrySchema = z.object({
  title: z.string().trim().min(1, "Enter the certification or award.").max(160),
  issuer: z.string().trim().max(120),
  year: z.string().trim().max(40),
});

export const certificationsSectionSchema = z.object({
  items: z.array(certificationEntrySchema).max(20),
});

export type BasicsSection = z.infer<typeof basicsSectionSchema>;
export type SummarySection = z.infer<typeof summarySectionSchema>;
export type ExperienceSection = z.infer<typeof experienceSectionSchema>;
export type SkillsSection = z.infer<typeof skillsSectionSchema>;
export type ProjectsSection = z.infer<typeof projectsSectionSchema>;
export type EducationSection = z.infer<typeof educationSectionSchema>;
export type CertificationsSection = z.infer<typeof certificationsSectionSchema>;

export type StructuredResume = {
  basics: BasicsSection;
  summary: SummarySection;
  experience: ExperienceSection;
  skills: SkillsSection;
  projects: ProjectsSection;
  education: EducationSection;
  certifications: CertificationsSection;
};

type SectionKey =
  | "header"
  | "summary"
  | "experience"
  | "skills"
  | "projects"
  | "education"
  | "certifications";

const HEADING_PATTERNS: [SectionKey, RegExp][] = [
  [
    "summary",
    /^(?:professional\s+summary|executive\s+summary|summary|profile|about(?:\s+me)?|objective)\s*:?$/i,
  ],
  [
    "experience",
    /^(?:work\s+experience|professional\s+experience|experience|employment(?:\s+history)?|career\s+history)\s*:?$/i,
  ],
  [
    "skills",
    /^(?:technical\s+skills|core\s+skills|skills(?:\s*&\s*technologies)?|technologies|competencies)\s*:?$/i,
  ],
  [
    "projects",
    /^(?:projects|selected\s+projects|personal\s+projects|key\s+projects)\s*:?$/i,
  ],
  [
    "education",
    /^(?:education|academic\s+background|academics)\s*:?$/i,
  ],
  [
    "certifications",
    /^(?:certifications|certificates|licenses\s*&\s*certifications|awards(?:\s*&\s*certifications)?|achievements)\s*:?$/i,
  ],
];

function detectHeading(line: string): SectionKey | null {
  const cleaned = line.replace(/^#+\s*/, "").trim();
  if (!cleaned || cleaned.length > 50) return null;
  for (const [key, pattern] of HEADING_PATTERNS) {
    if (pattern.test(cleaned)) return key;
  }
  return null;
}

function splitBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) {
        blocks.push(current);
        current = [];
      }
      continue;
    }
    current.push(line.trim());
  }
  if (current.length) blocks.push(current);
  return blocks;
}

export function parseResumeIntoSections(
  resumeText: string,
  fallbackName = "",
): StructuredResume {
  const buckets: Record<SectionKey, string[]> = {
    header: [],
    summary: [],
    experience: [],
    skills: [],
    projects: [],
    education: [],
    certifications: [],
  };

  let current: SectionKey = "header";
  for (const rawLine of resumeText.split(/\r?\n/)) {
    const heading = detectHeading(rawLine);
    if (heading) {
      current = heading;
      continue;
    }
    buckets[current].push(rawLine);
  }

  const headerLines = buckets.header.map((l) => l.trim()).filter(Boolean);
  const fullHeader = headerLines.join(" ");
  const emailMatch = fullHeader.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phoneMatch = fullHeader.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
  const urlMatches: string[] = fullHeader.match(/https?:\/\/\S+/gi) ?? [];

  const nonContactLines = headerLines.filter(
    (line) =>
      line !== emailMatch?.[0] &&
      line !== phoneMatch?.[0] &&
      !urlMatches.includes(line),
  );

  const inferredName = fallbackName.trim() || nonContactLines[0] || "";
  const remainingHeader = nonContactLines.filter(
    (line) => line.toLowerCase() !== inferredName.toLowerCase(),
  );

  const basics: BasicsSection = {
    name: inferredName,
    headline: remainingHeader[0]?.slice(0, 160) ?? "",
    email: emailMatch?.[0] ?? "",
    phone: phoneMatch?.[0]?.trim() ?? "",
    location: remainingHeader[1]?.slice(0, 120) ?? "",
    links: urlMatches.join(", ").slice(0, 400),
  };

  const summaryText = buckets.summary
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
  const fallbackSummary =
    !summaryText &&
    !buckets.experience.some((l) => l.trim()) &&
    !buckets.skills.some((l) => l.trim()) &&
    remainingHeader.length > 2
      ? remainingHeader.slice(2).join("\n")
      : summaryText;

  const experienceItems = splitBlocks(buckets.experience).map((block) => {
    const first = block[0] ?? "";
    const parts = first.split(/\s+[|—–-]\s+|\s+at\s+/i);
    const role = (parts[0] ?? first).slice(0, 120);
    const company = (parts[1] ?? "Company").slice(0, 120);
    const duration = (parts[2] ?? "").slice(0, 80);
    const highlights = block
      .slice(1)
      .map((l) => l.replace(/^[-*•]\s*/, ""))
      .join("\n")
      .slice(0, 4000);
    return {
      company: company || "Company",
      role: role || "Role",
      duration,
      location: "",
      highlights,
    };
  });

  const skillsText = buckets.skills
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .join(", ")
    .slice(0, 2000);

  const projectItems = splitBlocks(buckets.projects).map((block) => {
    const first = block[0] ?? "";
    const linkMatch = block.join(" ").match(/https?:\/\/\S+/i);
    const [namePart = first, techPart = ""] = first.split(/\s+[|—–-]\s+/);
    return {
      name: namePart.slice(0, 120) || "Project",
      techStack: techPart.slice(0, 240),
      link: linkMatch?.[0] ?? "",
      description: block
        .slice(1)
        .map((l) => l.replace(/^[-*•]\s*/, ""))
        .join("\n")
        .slice(0, 2500),
    };
  });

  const educationItems = splitBlocks(buckets.education).map((block) => {
    const first = block[0] ?? "";
    const [degreePart = first, schoolPart = "", durationPart = ""] =
      first.split(/\s+[|—–-]\s+/);
    return {
      institution: (schoolPart || block[1] || "Institution").slice(0, 160),
      degree: (degreePart || "Degree").slice(0, 160),
      duration: durationPart.slice(0, 80),
      details: block.slice(schoolPart ? 1 : 2).join("\n").slice(0, 1000),
    };
  });

  const certificationItems = buckets.certifications
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const [title = line, issuer = "", year = ""] = line.split(/\s+[|—–-]\s+/);
      return {
        title: title.slice(0, 160),
        issuer: issuer.slice(0, 120),
        year: year.slice(0, 40),
      };
    });

  return {
    basics,
    summary: { summary: fallbackSummary.slice(0, 2500) },
    experience: { items: experienceItems },
    skills: { skills: skillsText },
    projects: { items: projectItems },
    education: { items: educationItems },
    certifications: { items: certificationItems },
  };
}

export function compileSectionsToResumeText(sections: StructuredResume): string {
  const parts: string[] = [];

  const headerLines = [
    sections.basics.name.trim(),
    sections.basics.headline.trim(),
    [
      sections.basics.location.trim(),
      sections.basics.email.trim(),
      sections.basics.phone.trim(),
      sections.basics.links.trim(),
    ]
      .filter(Boolean)
      .join(" | "),
  ].filter(Boolean);
  if (headerLines.length) parts.push(headerLines.join("\n"));

  if (sections.summary.summary.trim()) {
    parts.push(`SUMMARY\n${sections.summary.summary.trim()}`);
  }

  if (sections.skills.skills.trim()) {
    parts.push(`SKILLS\n${sections.skills.skills.trim()}`);
  }

  if (sections.experience.items.length) {
    const expBlocks = sections.experience.items.map((item) => {
      const heading = [
        item.role.trim(),
        item.company.trim(),
        item.duration.trim(),
        item.location.trim(),
      ]
        .filter(Boolean)
        .join(" — ");
      const bullets = item.highlights
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => (line.startsWith("-") ? line : `- ${line}`))
        .join("\n");
      return bullets ? `${heading}\n${bullets}` : heading;
    });
    parts.push(`EXPERIENCE\n${expBlocks.join("\n\n")}`);
  }

  if (sections.projects.items.length) {
    const projBlocks = sections.projects.items.map((item) => {
      const heading = [item.name.trim(), item.techStack.trim(), item.link.trim()]
        .filter(Boolean)
        .join(" — ");
      const desc = item.description.trim();
      return desc ? `${heading}\n${desc}` : heading;
    });
    parts.push(`PROJECTS\n${projBlocks.join("\n\n")}`);
  }

  if (sections.education.items.length) {
    const eduBlocks = sections.education.items.map((item) => {
      const heading = [
        item.degree.trim(),
        item.institution.trim(),
        item.duration.trim(),
      ]
        .filter(Boolean)
        .join(" — ");
      const details = item.details.trim();
      return details ? `${heading}\n${details}` : heading;
    });
    parts.push(`EDUCATION\n${eduBlocks.join("\n\n")}`);
  }

  if (sections.certifications.items.length) {
    const certLines = sections.certifications.items.map((item) =>
      [item.title.trim(), item.issuer.trim(), item.year.trim()]
        .filter(Boolean)
        .join(" — "),
    );
    parts.push(`CERTIFICATIONS\n${certLines.map((l) => `- ${l}`).join("\n")}`);
  }

  return parts.join("\n\n").slice(0, 24000);
}
