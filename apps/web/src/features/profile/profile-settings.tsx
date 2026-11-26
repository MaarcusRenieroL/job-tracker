import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import type { Profile } from "./profile";
import { ProfileForm } from "./profile-form";
import { ResumePdfPreview } from "./resume-pdf-preview";

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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [draft, setDraft] = useState({
    name: profile.name,
    resumeText: profile.resumeText,
  });

  const handleDraftChange = useCallback(
    (next: { name: string; resumeText: string }) => {
      setDraft(next);
    },
    [],
  );

  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5">
        <div>
          <Button variant="ghost" size="sm" className="mb-3" onPress={back}>
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Button>
          <header className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Profile and resume
            </h1>
            <p className="text-sm text-muted-foreground">
              Inspect your uploaded PDF side by side while editing your resume
              text, name, or saved versions.
            </p>
          </header>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <section aria-label="Profile settings">
            <CardFrame>
              <CardFrameHeader>
                <CardFrameTitle>Profile &amp; Editable Content</CardFrameTitle>
              </CardFrameHeader>
              <CardFramePanel className="p-5 sm:p-6">
                <ProfileForm
                  token={token}
                  initialProfile={profile}
                  complete={complete}
                  submitLabel="Save profile"
                  onPdfFile={setPdfFile}
                  onDraftChange={handleDraftChange}
                />
              </CardFramePanel>
            </CardFrame>
          </section>

          <aside
            aria-label="Resume PDF preview"
            className="lg:sticky lg:top-6"
          >
            <ResumePdfPreview
              key={pdfFile ? `${pdfFile.name}-${pdfFile.lastModified}` : "live"}
              pdfFile={pdfFile}
              candidateName={draft.name}
              resumeText={draft.resumeText}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
