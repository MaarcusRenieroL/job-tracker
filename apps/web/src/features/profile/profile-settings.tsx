import { useState, type DragEvent } from "react";
import { ArrowLeft, FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../lib/api";
import type { Profile } from "./profile";
import { readResume } from "./read-resume";
import { ResumePdfPreview } from "./resume-pdf-preview";
import {
  BasicsSectionForm,
  CertificationsSectionForm,
  EducationSectionForm,
  ExperienceSectionForm,
  ProjectsSectionForm,
  SkillsSectionForm,
  SummarySectionForm,
} from "./resume-section-forms";
import {
  compileSectionsToResumeText,
  parseResumeIntoSections,
  type StructuredResume,
} from "./resume-sections";

export function ProfileSettings({
  token,
  profile,
  complete,
  back,
}: {
  token: string;
  profile: Profile;
  complete: (profile: Profile) => void;
  back: () => void;
}) {
  const [currentProfile, setCurrentProfile] = useState<Profile>(profile);
  const [sections, setSections] = useState<StructuredResume>(() =>
    parseResumeIntoSections(profile.resumeText, profile.name),
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );

  const compiledResumeText = compileSectionsToResumeText(sections);
  const sortedVersions = [...(currentProfile.resumeVersions ?? [])].reverse();

  async function persistSections(next: StructuredResume): Promise<Profile> {
    setError("");
    setSections(next);
    const resumeText = compileSectionsToResumeText(next);
    const name = next.basics.name.trim() || currentProfile.name;
    try {
      const response = await api<{ profile: Profile }>(
        "/profile",
        token,
        "PUT",
        { name, resumeText },
      );
      setCurrentProfile(response.profile);
      return response.profile;
    } catch (failure) {
      setError((failure as Error).message);
      throw failure;
    }
  }

  async function handleFileUpload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      setPdfFile(isPdf ? file : null);
      const extracted = (await readResume(file)).trim();
      if (!extracted) {
        throw new Error(
          "No text could be read from this file. Edit the section forms below directly.",
        );
      }
      setFileName(file.name);
      setSections(parseResumeIntoSections(extracted, sections.basics.name));
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFileUpload(event.dataTransfer.files[0]);
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              onPress={() => {
                if (currentProfile !== profile) {
                  complete(currentProfile);
                } else {
                  back();
                }
              }}
            >
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Button>
            <header className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Profile &amp; Sectioned Resume Studio
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload a PDF to inspect it on the right while editing each
                resume section independently on the left.
              </p>
            </header>
          </div>
          <Button
            type="button"
            size="sm"
            onPress={() =>
              void persistSections(sections)
                .then(complete)
                .catch(() => {})
            }
          >
            Save all &amp; return
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="flex flex-col gap-5">
            <CardFrame>
              <CardFrameHeader>
                <CardFrameTitle>Resume File &amp; Version History</CardFrameTitle>
              </CardFrameHeader>
              <CardFramePanel className="flex flex-col gap-4 p-4">
                <label
                  className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors focus-within:ring-2 focus-within:ring-ring ${
                    dragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/60 hover:bg-muted/40"
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  {fileName ? (
                    <FileText className="size-5 text-primary" aria-hidden />
                  ) : (
                    <UploadCloud
                      className="size-5 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <span className="text-xs font-medium text-foreground">
                    {uploading
                      ? "Reading and splitting resume into sections…"
                      : fileName || "Drop a PDF, DOCX, or TXT resume here, or browse"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF files render live on the right and auto-populate every
                    section form below.
                  </span>
                  <input
                    className="sr-only"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    aria-label="Upload resume"
                    onChange={(event) =>
                      void handleFileUpload(event.target.files?.[0])
                    }
                  />
                </label>

                {sortedVersions.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">
                      Restore a saved resume version
                    </Label>
                    <Select
                      aria-label="Previous resume versions"
                      placeholder="Select a saved version to load into sections…"
                      selectedKey={selectedVersionId}
                      onSelectionChange={(key) => {
                        if (key === null) return;
                        const id = String(key);
                        setSelectedVersionId(id);
                        const version = currentProfile.resumeVersions?.find(
                          (item) => item.id === id,
                        );
                        if (version) {
                          setSections(
                            parseResumeIntoSections(
                              version.resumeText,
                              currentProfile.name,
                            ),
                          );
                        }
                      }}
                      className="w-full"
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedVersions.map((version) => {
                          const stamp = new Date(
                            version.createdAt,
                          ).toLocaleString();
                          return (
                            <SelectItem
                              key={version.id}
                              id={version.id}
                              textValue={stamp}
                            >
                              <span className="tabular-nums">{stamp}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardFramePanel>
            </CardFrame>

            <BasicsSectionForm
              defaultValues={sections.basics}
              onSave={async (basics) => {
                await persistSections({ ...sections, basics });
              }}
            />

            <SummarySectionForm
              defaultValues={sections.summary}
              onSave={async (summary) => {
                await persistSections({ ...sections, summary });
              }}
            />

            <SkillsSectionForm
              defaultValues={sections.skills}
              onSave={async (skills) => {
                await persistSections({ ...sections, skills });
              }}
            />

            <ExperienceSectionForm
              defaultValues={sections.experience}
              onSave={async (experience) => {
                await persistSections({ ...sections, experience });
              }}
            />

            <ProjectsSectionForm
              defaultValues={sections.projects}
              onSave={async (projects) => {
                await persistSections({ ...sections, projects });
              }}
            />

            <EducationSectionForm
              defaultValues={sections.education}
              onSave={async (education) => {
                await persistSections({ ...sections, education });
              }}
            />

            <CertificationsSectionForm
              defaultValues={sections.certifications}
              onSave={async (certifications) => {
                await persistSections({ ...sections, certifications });
              }}
            />
          </div>

          <aside
            aria-label="Resume PDF preview"
            className="lg:sticky lg:top-6"
          >
            <ResumePdfPreview
              key={pdfFile ? `${pdfFile.name}-${pdfFile.lastModified}` : "live"}
              pdfFile={pdfFile}
              candidateName={sections.basics.name}
              resumeText={compiledResumeText}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
