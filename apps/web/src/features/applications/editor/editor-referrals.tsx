import type { Dispatch, SetStateAction } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFrame, CardFrameHeader, CardFramePanel, CardFrameTitle } from "@/components/ui/card-frame";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../lib/api";
import type { Application, Entry } from "../../../types/application";
import { EntryCollection } from "./editor-controls";
import { referralFields } from "./editor-fields";

export function EditorReferrals({ job, referrals, setReferrals, draft, setDraft, pending, run, token }: { job?: Application; referrals: Entry[]; setReferrals: Dispatch<SetStateAction<Entry[]>>; draft: string; setDraft: Dispatch<SetStateAction<string>>; pending: boolean; run: (action: () => Promise<void>) => Promise<void>; token: string }) {
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
                                ? "Generate a tailored referral message via local Ollama."
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

              {draft && (
                <CardFrame>
                  <CardFrameHeader>
                    <CardFrameTitle>
                      AI Referral Draft (Review before sending)
                    </CardFrameTitle>
                  </CardFrameHeader>
                  <CardFramePanel className="p-4">
                    <Textarea
                      rows={6}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      aria-label="Referral message draft"
                    />
                  </CardFramePanel>
                </CardFrame>
              )}
            </TabsContent>

  );
}
