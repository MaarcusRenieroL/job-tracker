import { useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { CardFrame, CardFrameHeader, CardFramePanel, CardFrameTitle } from "@/components/ui/card-frame";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { RichTextInput } from "@/components/ui/rich-text-editor";
import { api } from "../../../lib/api";
import type { Application } from "../../../types/application";
import { analyzeDescription } from "../text-analysis";
import { FieldGrid } from "./editor-controls";
import { editorFieldValues } from "./editor-form";
import { applicationFields, postingFields } from "./editor-fields";

export function EditorOverview({ job, values, setValues, pending, run, token }: { job?: Application; values: Record<string, string>; setValues: Dispatch<SetStateAction<Record<string, string>>>; pending: boolean; run: (action: () => Promise<void>) => Promise<void>; token: string }) {
  const [importUrl, setImportUrl] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeDescription>>();
  const change = (key: string, value: string, html?: string) =>
    setValues((previous) => ({ ...previous, ...editorFieldValues(key, value, html) }));
  return (
            <TabsContent id="overview" className="flex flex-col gap-5">
              {!job && (
                <CardFrame>
                  <CardFrameHeader>
                    <CardFrameTitle>Import from job URL</CardFrameTitle>
                  </CardFrameHeader>
                  <CardFramePanel className="flex flex-col gap-2 p-4">
                    <label
                      htmlFor="import-job-url"
                      className="text-xs font-medium"
                    >
                      Job posting URL
                    </label>
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
                              for (const [key, value] of Object.entries(
                                imported,
                              )) {
                                if (value && !next[key]?.trim())
                                  next[key] = value;
                              }
                              return next;
                            });
                            setImportMessage(
                              "Posting imported. Review the fields below before saving.",
                            );
                          })
                        }
                      >
                        Import
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Imports available details into empty fields. Review them
                      before saving.
                    </p>
                    {importMessage && (
                      <p
                        role="status"
                        className="text-xs text-muted-foreground"
                      >
                        {importMessage}
                      </p>
                    )}
                  </CardFramePanel>
                </CardFrame>
              )}
              {!job && (
                <CardFrame>
                  <CardFrameHeader>
                    <CardFrameTitle>Analyze a job description</CardFrameTitle>
                  </CardFrameHeader>
                  <CardFramePanel className="flex flex-col gap-3 p-4">
                    <label
                      htmlFor="quick-description"
                      className="text-xs font-medium"
                    >
                      Paste job description
                    </label>
                    <RichTextInput
                      id="quick-description"
                      label="Paste job description"
                      text={values.description ?? ""}
                      html={values.descriptionHtml}
                      onChange={(text, html) => change("description", text, html)}
                      placeholder="Paste the job posting here…"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="self-start"
                      isDisabled={!values.description?.trim()}
                      onPress={() => {
                        const result = analyzeDescription(
                          values.description,
                          values.resumeText,
                        );
                        setAnalysis(result);
                        setValues((previous) => ({
                          ...previous,
                          skills: result.required.join(", "),
                        }));
                      }}
                    >
                      Analyze text
                    </Button>
                    {analysis && (
                      <div className="space-y-1 text-sm" role="status">
                        {analysis.score === null ? (
                          <p>
                            No recognized skills found. Add required skills
                            below.
                          </p>
                        ) : (
                          <>
                            <p className="font-semibold">
                              {analysis.score}% keyword coverage
                            </p>
                            <p>
                              Matched: {analysis.matched.join(", ") || "None"}
                            </p>
                            <p>
                              Missing: {analysis.missing.join(", ") || "None"}
                            </p>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Based on recognized keywords in the job description
                          and resume. Review the required skills below.
                        </p>
                      </div>
                    )}
                  </CardFramePanel>
                </CardFrame>
              )}
              <CardFrame>
                <CardFrameHeader>
                  <CardFrameTitle>Role &amp; Posting Details</CardFrameTitle>
                </CardFrameHeader>
                <CardFramePanel className="p-4">
                  <FieldGrid
                    fields={postingFields}
                    values={values}
                    change={change}
                    idPrefix="posting"
                  />
                </CardFramePanel>
              </CardFrame>

              <CardFrame>
                <CardFrameHeader>
                  <CardFrameTitle>
                    Pipeline &amp; Application Materials
                  </CardFrameTitle>
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
            </TabsContent>

  );
}
