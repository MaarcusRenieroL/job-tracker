import { useState } from "react";
import { Check, Copy, CornerDownLeft, Loader2, Sparkles } from "lucide-react";
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
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { api } from "@/lib/api";
import type { Application } from "@/types/application";

type OutreachKind = "cover-letter" | "follow-up";

export function OutreachDraftsCard({
  job,
  values,
  change,
  pending,
  run,
  token,
}: {
  job?: Application;
  values: Record<string, string>;
  change: (key: string, value: string, html?: string) => void;
  pending: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  token: string;
}) {
  const [outreachKind, setOutreachKind] = useState<OutreachKind | null>(null);
  const [draftingKind, setDraftingKind] = useState<OutreachKind | null>(null);
  const [outreachDraft, setOutreachDraft] = useState("");
  const [outreachDraftHtml, setOutreachDraftHtml] = useState("");
  const [followUpRecipient, setFollowUpRecipient] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const { copied, copyText } = useCopyFeedback();

  return (
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
                  setDraftingKind("cover-letter");
                  try {
                    const result = await api<{ draft: string }>(
                      `/applications/${job._id}/cover-letter/draft`,
                      token,
                      "POST",
                    );
                    setOutreachKind("cover-letter");
                    setOutreachDraft(result.draft);
                    setOutreachDraftHtml("");
                  } finally {
                    setDraftingKind(null);
                  }
                })
              }
            >
              {draftingKind === "cover-letter" ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> Drafting…
                </>
              ) : (
                <>
                  <Sparkles className="size-3" /> Draft cover letter
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              isDisabled={pending}
              onPress={() =>
                void run(async () => {
                  setDraftingKind("follow-up");
                  try {
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
                  } finally {
                    setDraftingKind(null);
                  }
                })
              }
            >
              {draftingKind === "follow-up" ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> Drafting…
                </>
              ) : (
                <>
                  <Sparkles className="size-3" /> Draft follow-up
                </>
              )}
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
                      onPress={() => void copyText(outreachDraft)}
                    >
                      {copied ? (
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
                Generate an editable cover letter or stage-aware follow-up using
                your saved resume, posting requirements, and interview timeline.
                You stay in full control of editing and sending.
              </p>
            )}
          </>
        )}
      </CardFramePanel>
    </CardFrame>
  );
}
