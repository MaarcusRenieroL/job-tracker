import { useState, type Dispatch, type SetStateAction } from "react";
import { Check, Copy, CornerDownLeft, Sparkles, X } from "lucide-react";
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
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../lib/api";
import type { Application, PostingSuggestions } from "../../../types/application";
import { analyzeDescription } from "../text-analysis";
import { FieldGrid } from "./editor-controls";
import { applicationFields, postingFields } from "./editor-fields";
import { editorFieldValues } from "./editor-form";

type EditableSuggestionDraft = {
  seniority: string;
  skills: string;
  responsibilities: string;
};

type OutreachKind = "cover-letter" | "follow-up";

const detailPostingFields = postingFields.filter(
  (field) => field.name !== "description",
);

export function EditorOverview({
  job,
  values,
  setValues,
  pending,
  run,
  token,
}: {
  job?: Application;
  values: Record<string, string>;
  setValues: Dispatch<SetStateAction<Record<string, string>>>;
  pending: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  token: string;
}) {
  const [importUrl, setImportUrl] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [analysis, setAnalysis] =
    useState<ReturnType<typeof analyzeDescription>>();
  const [suggestions, setSuggestions] =
    useState<EditableSuggestionDraft | null>(null);
  const [suggestionsApplied, setSuggestionsApplied] = useState(false);

  const [outreachKind, setOutreachKind] = useState<OutreachKind | null>(null);
  const [outreachDraft, setOutreachDraft] = useState("");
  const [outreachDraftHtml, setOutreachDraftHtml] = useState("");
  const [followUpRecipient, setFollowUpRecipient] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [copiedDraft, setCopiedDraft] = useState(false);

  const change = (key: string, value: string, html?: string) =>
    setValues((previous) => ({
      ...previous,
      ...editorFieldValues(key, value, html),
    }));

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

  async function copyOutreachDraft() {
    if (!outreachDraft.trim()) return;
    await navigator.clipboard.writeText(outreachDraft);
    setCopiedDraft(true);
    window.setTimeout(() => setCopiedDraft(false), 1800);
  }

  return (
    <TabsContent id="overview" className="flex flex-col gap-5">
      {!job && (
        <CardFrame>
          <CardFrameHeader>
            <CardFrameTitle>Import from Job URL</CardFrameTitle>
          </CardFrameHeader>
          <CardFramePanel className="flex flex-col gap-2 p-4">
            <Label htmlFor="import-job-url" className="text-xs font-medium">
              Job posting URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="import-job-url"
                type="url"
                placeholder="https://company.com/jobs/…"
                value={importUrl}
                onChange={(event) => setImportUrl(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                isDisabled={pending || !importUrl.trim()}
                onPress={() =>
                  void run(async () => {
                    setImportMessage("");
                    const imported = await api<
                      Record<string, string | undefined>
                    >("/applications/import", token, "POST", {
                      url: importUrl.trim(),
                    });
                    setValues((previous) => {
                      const next = { ...previous };
                      for (const [key, value] of Object.entries(imported)) {
                        if (value && !next[key]?.trim()) next[key] = value;
                      }
                      return next;
                    });
                    setImportMessage(
                      "Posting imported. Review or extract structured details below before saving.",
                    );
                  })
                }
              >
                Import
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Imports available details into empty fields. Review them before
              saving.
            </p>
            {importMessage && (
              <p role="status" className="text-xs text-muted-foreground">
                {importMessage}
              </p>
            )}
          </CardFramePanel>
        </CardFrame>
      )}

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
                  setSuggestionsApplied(false);
                  const result = await api<{ suggestions: PostingSuggestions }>(
                    "/applications/extract",
                    token,
                    "POST",
                    {
                      description: values.description ?? "",
                      ...(values.role?.trim() ? { role: values.role.trim() } : {}),
                    },
                  );
                  setSuggestions({
                    seniority: result.suggestions.seniority,
                    skills: result.suggestions.skills.join(", "),
                    responsibilities:
                      result.suggestions.responsibilities.join("\n"),
                  });
                })
              }
            >
              <Sparkles className="size-3" /> Extract with AI
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
                <Button
                  type="button"
                  size="xs"
                  onPress={applySuggestions}
                >
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

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Role &amp; Posting Details</CardFrameTitle>
        </CardFrameHeader>
        <CardFramePanel className="p-4">
          <FieldGrid
            fields={detailPostingFields}
            values={values}
            change={change}
            idPrefix="posting"
          />
        </CardFramePanel>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Pipeline &amp; Application Materials</CardFrameTitle>
        </CardFrameHeader>
        <CardFramePanel className="p-4">
          <FieldGrid
            fields={applicationFields}
            values={values}
            change={change}
            idPrefix="application"
          />
        </CardFramePanel>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>
            Tailored Cover Letter &amp; Follow-Up Drafts
          </CardFrameTitle>
          {job && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                isDisabled={pending}
                onPress={() =>
                  void run(async () => {
                    const result = await api<{ draft: string }>(
                      `/applications/${job._id}/cover-letter/draft`,
                      token,
                      "POST",
                    );
                    setOutreachKind("cover-letter");
                    setOutreachDraft(result.draft);
                    setOutreachDraftHtml("");
                  })
                }
              >
                <Sparkles className="size-3" /> Draft cover letter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                isDisabled={pending}
                onPress={() =>
                  void run(async () => {
                    const result = await api<{ draft: string }>(
                      `/applications/${job._id}/follow-up/draft`,
                      token,
                      "POST",
                      {
                        ...(followUpRecipient.trim()
                          ? { recipient: followUpRecipient.trim() }
                          : {}),
                        ...(followUpNote.trim()
                          ? { note: followUpNote.trim() }
                          : {}),
                      },
                    );
                    setOutreachKind("follow-up");
                    setOutreachDraft(result.draft);
                    setOutreachDraftHtml("");
                  })
                }
              >
                <Sparkles className="size-3" /> Draft follow-up
              </Button>
            </div>
          )}
        </CardFrameHeader>
        <CardFramePanel className="flex flex-col gap-3.5 p-4">
          {!job ? (
            <p className="text-xs text-muted-foreground">
              Save this application first to generate tailored cover-letter and
              follow-up drafts from your saved resume and posting facts.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="followup-recipient"
                    className="text-xs font-medium text-foreground/85"
                  >
                    Follow-up recipient (optional)
                  </Label>
                  <Input
                    id="followup-recipient"
                    value={followUpRecipient}
                    placeholder="e.g. Jordan Lee, Recruiting"
                    onChange={(e) => setFollowUpRecipient(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="followup-note"
                    className="text-xs font-medium text-foreground/85"
                  >
                    Follow-up context (optional)
                  </Label>
                  <Input
                    id="followup-note"
                    value={followUpNote}
                    placeholder="e.g. Checking in one week after technical round"
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              {outreachKind ? (
                <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-muted/25 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {outreachKind === "cover-letter"
                          ? "Editable Cover Letter Draft"
                          : "Editable Follow-Up Draft"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Built strictly from your saved facts. Edit freely —
                        nothing is sent automatically.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        isDisabled={!outreachDraft.trim()}
                        onPress={() => void copyOutreachDraft()}
                      >
                        {copiedDraft ? (
                          <>
                            <Check className="size-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" /> Copy text
                          </>
                        )}
                      </Button>
                      {outreachKind === "cover-letter" ? (
                        <Button
                          type="button"
                          size="xs"
                          isDisabled={!outreachDraft.trim()}
                          onPress={() =>
                            change(
                              "coverLetter",
                              outreachDraft,
                              outreachDraftHtml,
                            )
                          }
                        >
                          <CornerDownLeft className="size-3" /> Use as cover
                          letter
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="xs"
                          isDisabled={!outreachDraft.trim()}
                          onPress={() => {
                            const existing = values.notes?.trim();
                            const combined = existing
                              ? `${existing}\n\nFollow-up draft:\n${outreachDraft}`
                              : `Follow-up draft:\n${outreachDraft}`;
                            change("notes", combined, "");
                          }}
                        >
                          <CornerDownLeft className="size-3" /> Save to notes
                        </Button>
                      )}
                    </div>
                  </div>
                  <RichTextInput
                    label={
                      outreachKind === "cover-letter"
                        ? "Cover letter draft"
                        : "Follow-up message draft"
                    }
                    text={outreachDraft}
                    html={outreachDraftHtml}
                    onChange={(text, html) => {
                      setOutreachDraft(text);
                      setOutreachDraftHtml(html);
                    }}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Generate an editable cover letter or stage-aware follow-up
                  using your saved resume, posting requirements, and interview
                  timeline. You stay in full control of editing and sending.
                </p>
              )}
            </>
          )}
        </CardFramePanel>
      </CardFrame>
    </TabsContent>
  );
}
