import { useState, type Dispatch, type SetStateAction } from "react";
import { Check, Copy, CornerDownLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { TabsContent } from "@/components/ui/tabs";
import { RichTextInput } from "@/components/ui/rich-text-editor";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { api } from "../../../lib/api";
import type { Application, Entry } from "../../../types/application";
import { EntryCollection } from "./editor-controls";
import { referralFields } from "./editor-fields";

export function EditorReferrals({
  job,
  referrals,
  setReferrals,
  draft,
  setDraft,
  pending,
  run,
  token,
}: {
  job?: Application;
  referrals: Entry[];
  setReferrals: Dispatch<SetStateAction<Entry[]>>;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  pending: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  token: string;
}) {
  const [draftHtml, setDraftHtml] = useState("");
  const [targetReferralId, setTargetReferralId] = useState<string | null>(null);
  const { copied, copyText } = useCopyFeedback();

  const targetReferral = referrals.find((item) => item.id === targetReferralId);

  function applyToReferral() {
    if (!targetReferralId) return;
    setReferrals((previous) =>
      previous.map((item) =>
        item.id === targetReferralId
          ? {
              ...item,
              message: draft,
              ...(draftHtml ? { messageHtml: draftHtml } : { messageHtml: "" }),
            }
          : item,
      ),
    );
  }

  return (
    <TabsContent id="referrals" className="flex flex-col gap-5">
      <EntryCollection
        title="Referral Contacts"
        emptyTitle="No referral contacts added"
        emptyDescription="Save employees or hiring contacts, track follow-ups, and draft outreach with your local Ollama model."
        addLabel="Add referral"
        entries={referrals}
        setEntries={setReferrals}
        fields={referralFields}
        idPrefix="referral"
        defaults={{ status: "Identified" }}
        extra={
          job
            ? (entry) => {
                const isSaved = job.referrals?.some(
                  (saved) => saved.id === entry.id,
                );
                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
                    <span className="text-xs text-muted-foreground">
                      {isSaved
                        ? "Generate an editable referral message from saved facts via local Ollama."
                        : "Save the application first to enable AI referral drafting."}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      isDisabled={pending || !isSaved}
                      onPress={() =>
                        void run(async () => {
                          const result = await api<{ draft: string }>(
                            `/applications/${job._id}/referrals/${entry.id}/draft`,
                            token,
                            "POST",
                          );
                          setDraft(result.draft);
                          setDraftHtml("");
                          setTargetReferralId(entry.id);
                        })
                      }
                    >
                      <Sparkles className="size-3" /> Draft with AI
                    </Button>
                  </div>
                );
              }
            : undefined
        }
      />

      {(targetReferralId !== null || Boolean(draft)) && (
        <CardFrame>
          <CardFrameHeader>
            <CardFrameTitle>
              AI Referral Draft
              {targetReferral?.employee ? ` · ${targetReferral.employee}` : ""}
            </CardFrameTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                isDisabled={!draft.trim()}
                onPress={() => void copyText(draft)}
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
              {targetReferral && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  isDisabled={!draft.trim()}
                  onPress={applyToReferral}
                >
                  <CornerDownLeft className="size-3" /> Use in contact message
                </Button>
              )}
            </div>
          </CardFrameHeader>
          <CardFramePanel className="flex flex-col gap-2.5 p-4">
            <p className="text-xs text-muted-foreground">
              Review and edit before sending yourself. Nothing is sent
              automatically.
            </p>
            <RichTextInput
              label="Referral message draft"
              text={draft}
              html={draftHtml}
              onChange={(text, html) => {
                setDraft(text);
                setDraftHtml(html);
              }}
            />
          </CardFramePanel>
        </CardFrame>
      )}
    </TabsContent>
  );
}
