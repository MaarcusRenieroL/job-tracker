export type ResumeVersion = { id: string; resumeText: string; resumeHtml?: string; createdAt: string };
export type Profile = { name: string; resumeText: string; resumeHtml?: string; resumeVersions?: ResumeVersion[] };
