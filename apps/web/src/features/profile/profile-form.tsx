import { useEffect, useState, type DragEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, UploadCloud } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextInput } from "@/components/ui/rich-text-editor";
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

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  resumeText: z
    .string()
    .trim()
    .min(1, "Add your resume or describe your experience.")
    .max(24000),
  resumeHtml: z.string().max(100000).optional(),
});

export function ProfileForm({
  token,
  initialName,
  initialProfile,
  complete,
  submitLabel,
  secondaryAction,
  onPdfFile,
  onDraftChange,
}: {
  token: string;
  initialName?: string;
  initialProfile?: Profile;
  complete: (profile: Profile) => void;
  submitLabel: string;
  secondaryAction?: { label: string; run: () => void };
  onPdfFile?: (file: File | null) => void;
  onDraftChange?: (draft: { name: string; resumeText: string }) => void;
}) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Profile>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialProfile?.name ?? initialName ?? "",
      resumeText: initialProfile?.resumeText ?? "",
      resumeHtml: initialProfile?.resumeHtml ?? "",
    },
  });
  const name = useWatch({ control, name: "name" }) ?? "";
  const resumeText = useWatch({ control, name: "resumeText" }) ?? "";
  const resumeHtml = useWatch({ control, name: "resumeHtml" }) ?? "";

  useEffect(() => {
    onDraftChange?.({ name, resumeText });
  }, [name, resumeText, onDraftChange]);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      onPdfFile?.(isPdf ? file : null);
      const text = (await readResume(file)).trim();
      if (!text) {
        throw new Error(
          "No text could be read. Paste your resume details below.",
        );
      }
      if (text.length > 24000) {
        throw new Error(
          "Resume text exceeds 24,000 characters. Paste a shorter version.",
        );
      }
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
      const response = await api<{ profile: Profile }>(
        "/profile",
        token,
        "PUT",
        data,
      );
      complete(response.profile);
    } catch (failure) {
      setError((failure as Error).message);
    }
  });

  const sortedVersions = [...(initialProfile?.resumeVersions ?? [])].reverse();

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name" className="text-sm font-medium">
          Your name
        </Label>
        <Input
          id="profile-name"
          autoComplete="name"
          maxLength={120}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <p role="alert" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {sortedVersions.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            Previous resume versions
          </Label>
          <Select
            aria-label="Previous resume versions"
            placeholder="Select a saved version to load…"
            selectedKey={selectedVersionId}
            onSelectionChange={(key) => {
              if (key === null) return;
              const id = String(key);
              setSelectedVersionId(id);
              const version = initialProfile?.resumeVersions?.find(
                (item) => item.id === id,
              );
              if (version) {
                setValue("resumeText", version.resumeText, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue("resumeHtml", version.resumeHtml ?? "", {
                  shouldDirty: true,
                });
              }
            }}
            className="w-full"
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortedVersions.map((version) => {
                const stamp = new Date(version.createdAt).toLocaleString();
                return (
                  <SelectItem key={version.id} id={version.id} textValue={stamp}>
                    <span className="tabular-nums">{stamp}</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selecting a version loads it for editing. Saving creates a new
            version.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Upload your resume{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <label
          className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/60 hover:bg-muted/40"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
        >
          {fileName ? (
            <FileText className="size-6 text-primary" aria-hidden />
          ) : (
            <UploadCloud className="size-6 text-muted-foreground" aria-hidden />
          )}
          <span className="text-sm font-medium">
            {fileName || "Drop your resume here, or browse"}
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, DOCX, or TXT · Up to 5 MB
          </span>
          <input
            className="sr-only"
            type="file"
            accept=".pdf,.docx,.txt"
            aria-label="Upload resume"
            onChange={(event) => void upload(event.target.files?.[0])}
          />
        </label>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-sm font-medium">
          Resume text or skills and experience
        </span>
        <RichTextInput
          label="Resume text or skills and experience"
          text={resumeText}
          html={resumeHtml}
          placeholder="Paste your resume, or describe your skills and experience…"
          onChange={(text, html) => {
            setValue("resumeText", text, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setValue("resumeHtml", html, { shouldDirty: true });
          }}
        />
        {errors.resumeText && (
          <p role="alert" className="text-xs text-destructive">
            {errors.resumeText.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Review the text after uploading. It stays in your local database.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isDisabled={uploading || isSubmitting}>
          {uploading
            ? "Reading resume…"
            : isSubmitting
              ? "Saving…"
              : submitLabel}
        </Button>
        {secondaryAction && (
          <Button type="button" variant="ghost" onPress={secondaryAction.run}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </form>
  );
}
