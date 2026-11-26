import { useState, type DragEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { FileText, UploadCloud } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextInput } from "@/components/ui/rich-text-editor";
import { api } from "../../lib/api";
import type { Profile } from "./profile";
import { readResume } from "./read-resume";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  resumeText: z.string().trim().min(1, "Add your resume or describe your experience.").max(24000),
  resumeHtml: z.string().max(100000).optional(),
});

export function Onboarding({
  token, initialName, complete, signOut,
}: {
  token: string;
  initialName?: string;
  complete: (profile: Profile) => void;
  signOut: () => void;
}) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const { register, control, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<Profile>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName ?? "", resumeText: "", resumeHtml: "" },
  });
  const resumeText = useWatch({ control, name: "resumeText" }) ?? "";
  const resumeHtml = useWatch({ control, name: "resumeHtml" }) ?? "";

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const text = (await readResume(file)).trim();
      if (!text) throw new Error("No text could be read. Paste your resume details below.");
      if (text.length > 24000) throw new Error("Resume text exceeds 24,000 characters. Paste a shorter version.");
      setValue("resumeText", text, { shouldDirty: true, shouldValidate: true });
      setValue("resumeHtml", "", { shouldDirty: true });
      setFileName(file.name);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files[0]);
  }

  const submit = handleSubmit(async (data) => {
    setError("");
    try {
      const response = await api<{ profile: Profile }>("/profile", token, "PUT", data);
      complete(response.profile);
    } catch (failure) {
      setError((failure as Error).message);
    }
  });

  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:py-12">
      <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-7 space-y-2">
          <p className="text-sm font-medium text-primary">Job Tracker</p>
          <h1 className="text-2xl font-semibold">Set up your profile</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">Add your resume or describe your experience. We’ll use it when comparing jobs.</p>
        </div>
        <form className="flex flex-col gap-6" onSubmit={(event) => void submit(event)} noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="profile-name" className="text-sm font-medium">Your name</label>
            <Input id="profile-name" autoComplete="name" maxLength={120} aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p role="alert" className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Upload your resume <span className="font-normal text-muted-foreground">(optional)</span></span>
            <label className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40"}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={drop}>
              {fileName ? <FileText className="size-6 text-primary" aria-hidden /> : <UploadCloud className="size-6 text-muted-foreground" aria-hidden />}
              <span className="text-sm font-medium">{fileName || "Drop your resume here, or browse"}</span>
              <span className="text-xs text-muted-foreground">PDF, DOCX, or TXT · Up to 5 MB</span>
              <input className="sr-only" type="file" accept=".pdf,.docx,.txt" aria-label="Upload resume" onChange={(event) => void upload(event.target.files?.[0])} />
            </label>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-sm font-medium">Resume text or skills and experience</span>
            <RichTextInput label="Resume text or skills and experience" text={resumeText} html={resumeHtml} placeholder="Paste your resume, or describe your skills and experience…" onChange={(text, html) => {
              setValue("resumeText", text, { shouldDirty: true, shouldValidate: true });
              setValue("resumeHtml", html, { shouldDirty: true });
            }} />
            {errors.resumeText && <p role="alert" className="text-xs text-destructive">{errors.resumeText.message}</p>}
            <p className="text-xs text-muted-foreground">Review the text after uploading. It stays in your local database.</p>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" isDisabled={uploading || isSubmitting}>{uploading ? "Reading resume…" : isSubmitting ? "Saving…" : "Continue to dashboard"}</Button>
            <Button type="button" variant="ghost" onPress={signOut}>Sign out</Button>
          </div>
        </form>
      </section>
    </main>
  );
}
