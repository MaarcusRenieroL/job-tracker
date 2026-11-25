import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../lib/api";
import type { Profile } from "./profile";
import { readResume } from "./read-resume";

export function Onboarding({
  token,
  complete,
  signOut,
}: {
  token: string;
  complete: (profile: Profile) => void;
  signOut: () => void;
}) {
  const [name, setName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const text = (await readResume(file)).trim();
      if (!text)
        throw new Error(
          "No text could be read. Paste your resume details below.",
        );
      if (text.length > 24000)
        throw new Error(
          "Resume text exceeds 24,000 characters. Paste a shorter version.",
        );
      setResumeText(text);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await api<{ profile: Profile }>(
        "/profile",
        token,
        "PUT",
        { name, resumeText },
      );
      complete(response.profile);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-10">
      <section className="mx-auto max-w-2xl space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-primary">Job Tracker</p>
          <h1 className="mt-2 text-2xl font-semibold">Set up your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your resume or enter your skills and experience. We’ll use it to
            compare your background with jobs you save.
          </p>
        </div>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <label className="block space-y-1 text-sm font-medium">
            Your name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Upload resume{" "}
            <span className="font-normal text-muted-foreground">
              (PDF, DOCX, or TXT)
            </span>
            <Input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => void upload(event.target.files?.[0])}
            />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Resume text or skills and experience
            <Textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              rows={12}
              maxLength={24000}
              required
              placeholder="Paste your resume, or describe your skills and experience…"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Review the text after uploading. It stays in your local database.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" isDisabled={busy}>
              {busy ? "Working…" : "Continue to dashboard"}
            </Button>
            <Button type="button" variant="ghost" onPress={signOut}>
              Sign out
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
