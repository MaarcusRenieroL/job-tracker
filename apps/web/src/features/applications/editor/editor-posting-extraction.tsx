import { useState, type Dispatch, type SetStateAction } from "react";
import { CornerDownLeft, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextInput } from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { PostingSuggestions } from "@/types/application";
import { analyzeDescription } from "../text-analysis";

type EditableSuggestionDraft = {
  seniority: string;
  skills: string;
  responsibilities: string;
};

export function PostingExtractionCard({
  values,
  setValues,
  change,
  pending,
  run,
  token,
}: {
  values: Record<string, string>;
  setValues: Dispatch<SetStateAction<Record<string, string>>>;
  change: (key: string, value: string, html?: string) => void;
  pending: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  token: string;
}) {
  const [analysis, setAnalysis] =
    useState<ReturnType<typeof analyzeDescription>>();
  const [suggestions, setSuggestions] =
    useState<EditableSuggestionDraft | null>(null);
  const [suggestionsApplied, setSuggestionsApplied] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const canExtract = (values.description?.trim().length ?? 0) >= 20;

  function applySuggestions() {
    if (!suggestions) return;
    setValues((previous) => ({
      ...previous,
      ...(suggestions.seniority.trim()
        ? { seniority: suggestions.seniority.trim() }
        : {}),
      ...(suggestions.skills.trim()
        ? { skills: suggestions.skills.trim() }
        : {}),
      ...(suggestions.responsibilities.trim()
        ? { responsibilities: suggestions.responsibilities.trim() }
        : {}),
    }));
    setSuggestionsApplied(true);
  }

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Job Description &amp; Extraction</CardFrameTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="xs"
            isDisabled={!values.description?.trim()}
            onPress={() => {
              const result = analyzeDescription(
                values.description ?? "",
                values.resumeText ?? "",
              );
              setAnalysis(result);
              if (result.required.length && !values.skills?.trim()) {
                setValues((previous) => ({
                  ...previous,
                  skills: result.required.join(", "),
                }));
              }
            }}
          >
            Keyword check
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            isDisabled={pending || !canExtract}
            onPress={() =>
              void run(async () => {
                setExtracting(true);
                setSuggestionsApplied(false);
                try {
                  const result = await api<{ suggestions: PostingSuggestions }>(
                    "/applications/extract",
                    token,
                    "POST",
                    {
                      description: values.description ?? "",
                      ...(values.role?.trim()
                        ? { role: values.role.trim() }
                        : {}),
                    },
                  );
                  setSuggestions({
                    seniority: result.suggestions.seniority,
                    skills: result.suggestions.skills.join(", "),
                    responsibilities:
                      result.suggestions.responsibilities.join("\n"),
                  });
                } finally {
                  setExtracting(false);
                }
              })
            }
          >
            {extracting ? (
              <>
                <Loader2 className="size-3 animate-spin" /> Extracting…
              </>
            ) : (
              <>
                <Sparkles className="size-3" /> Extract with AI
              </>
            )}
          </Button>
        </div>
      </CardFrameHeader>
      <CardFramePanel className="flex flex-col gap-3.5 p-4">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="posting-description"
            className="text-xs font-medium text-foreground/85"
          >
            Job description
          </Label>
          <RichTextInput
            id="posting-description"
            label="Job description"
            text={values.description ?? ""}
            html={values.descriptionHtml}
            onChange={(text, html) => change("description", text, html)}
            placeholder="Paste the full job posting to extract required skills, responsibilities, and seniority…"
          />
          <p className="text-xs text-muted-foreground">
            Paste a posting (20+ characters) and select{" "}
            <span className="font-medium text-foreground/85">
              Extract with AI
            </span>{" "}
            to get editable suggestions before applying them to the form.
          </p>
        </div>

        {suggestions && (
          <div
            role="region"
            aria-label="Extracted posting suggestions"
            className="flex flex-col gap-3.5 rounded-xl border border-border/80 bg-muted/30 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Editable Posting Suggestions
                </div>
                <p className="text-xs text-muted-foreground">
                  Adjust any suggested values below, then apply them to your
                  posting fields.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Dismiss suggestions"
                onPress={() => setSuggestions(null)}
              >
                <X className="size-3.5 text-muted-foreground" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="suggested-seniority"
                  className="text-xs font-medium text-foreground/85"
                >
                  Suggested seniority
                </Label>
                <Input
                  id="suggested-seniority"
                  value={suggestions.seniority}
                  placeholder="e.g. Senior, Staff, Mid-level"
                  onChange={(e) => {
                    setSuggestionsApplied(false);
                    setSuggestions((prev) =>
                      prev ? { ...prev, seniority: e.target.value } : prev,
                    );
                  }}
                  className="bg-background"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label
                  htmlFor="suggested-skills"
                  className="text-xs font-medium text-foreground/85"
                >
                  Suggested required skills (comma-separated)
                </Label>
                <Input
                  id="suggested-skills"
                  value={suggestions.skills}
                  placeholder="TypeScript, React, PostgreSQL…"
                  onChange={(e) => {
                    setSuggestionsApplied(false);
                    setSuggestions((prev) =>
                      prev ? { ...prev, skills: e.target.value } : prev,
                    );
                  }}
                  className="bg-background"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label
                  htmlFor="suggested-responsibilities"
                  className="text-xs font-medium text-foreground/85"
                >
                  Suggested responsibilities (one per line)
                </Label>
                <Textarea
                  id="suggested-responsibilities"
                  value={suggestions.responsibilities}
                  placeholder="Key role responsibilities…"
                  onChange={(e) => {
                    setSuggestionsApplied(false);
                    setSuggestions((prev) =>
                      prev
                        ? { ...prev, responsibilities: e.target.value }
                        : prev,
                    );
                  }}
                  className="min-h-24 bg-background"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
              <span className="text-xs text-muted-foreground">
                {suggestionsApplied
                  ? "Applied to Role & Posting Details below. Save changes when ready."
                  : "Applying updates Seniority, Required skills, and Key responsibilities below."}
              </span>
              <Button type="button" size="xs" onPress={applySuggestions}>
                <CornerDownLeft className="size-3" /> Apply suggestions
              </Button>
            </div>
          </div>
        )}

        {analysis && (
          <div
            className="flex flex-col gap-1 rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs"
            role="status"
          >
            {analysis.score === null ? (
              <p className="text-muted-foreground">
                No built-in keywords detected. Use{" "}
                <span className="font-medium text-foreground">
                  Extract with AI
                </span>{" "}
                or enter required skills manually below.
              </p>
            ) : (
              <>
                <p className="font-semibold text-foreground tabular-nums">
                  {analysis.score}% quick keyword overlap
                </p>
                <p className="text-muted-foreground">
                  Matched: {analysis.matched.join(", ") || "None"} · Missing:{" "}
                  {analysis.missing.join(", ") || "None"}
                </p>
              </>
            )}
          </div>
        )}
      </CardFramePanel>
    </CardFrame>
  );
}
