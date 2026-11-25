const skills = [
  "TypeScript",
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "C++",
  "C#",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "AWS",
  "Azure",
  "Google Cloud",
  "Docker",
  "Kubernetes",
  "Git",
  "GraphQL",
  "REST",
  "Kafka",
  "Linux",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Next.js",
  "Express",
  "Hono",
  "Fastify",
  "Spring",
  "Django",
  "Flask",
  "Terraform",
  "System design",
  "Machine learning",
  "Data analysis",
  "Communication",
  "Project management",
  "Product management",
];

function contains(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}+#])${escaped}(?=$|[^\\p{L}\\p{N}+#])`,
    "iu",
  ).test(text);
}

export function analyzeDescription(description: string, resume: string) {
  const required = skills.filter((skill) => contains(description, skill));
  const matched = required.filter((skill) => contains(resume, skill));
  return {
    required,
    matched,
    missing: required.filter((skill) => !matched.includes(skill)),
    score: required.length
      ? Math.round((matched.length / required.length) * 100)
      : null,
  };
}
