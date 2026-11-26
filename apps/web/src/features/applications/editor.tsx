import { analyzeDescription } from "./text-analysis";
import type { Profile } from "../onboarding/profile";
import { EditorHistory } from "./editor-history";
import {
  CompanyAvatar,
  PriorityBadge,
  StageBadge,
} from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Award,
  BriefcaseBusiness,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  History,
  Trash2,
  Users,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "../../lib/api";
import type {
  Application,
  Entry,
  Match,
  Priority,
  Stage,
} from "../../types/application";
import { FieldGrid } from "./editor-controls";
import {
  applicationFields,
  postingFields,
} from "./editor-fields";
import { EditorMatch } from "./editor-match";
import { EditorAssessments } from "./editor-assessments";
import { EditorOffer } from "./editor-offer";
import { EditorReferrals } from "./editor-referrals";
import { applicationPayload, initialFields, localDateTime } from "./editor-form";


export type EditorTab =
  "overview" | "assessments" | "referrals" | "offer" | "match" | "history";

export function EditorSheet({
  open,
  job,
  profile,
  initialTab = "overview",
  token,
  close,
  save,
  remove,
}: {
  open: boolean;
  job?: Application;
  profile: Profile;
  initialTab?: EditorTab;
  token: string;
  close: () => void;
  save: (body: unknown) => Promise<void>;
  remove: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
  const [values, setValues] = useState(() => {
    const fields = initialFields(job);
    if (!job) fields.resumeText = profile.resumeText;
    return fields;
  });
  const [assessments, setAssessments] = useState<Entry[]>(
    () => job?.assessments ?? [],
  );
  const [referrals, setReferrals] = useState<Entry[]>(
    () => job?.referrals ?? [],
  );
  const [interviews, setInterviews] = useState<Entry[]>(() =>
    (job?.interviews ?? []).map((entry) => ({
      ...entry,
      dateTime: entry.dateTime ? localDateTime(entry.dateTime) : "",
    })),
  );
  const [compensation, setCompensation] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(job?.offer ?? {}).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
  );
  const [match, setMatch] = useState<Match>();
  const [draft, setDraft] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [analysis, setAnalysis] =
    useState<ReturnType<typeof analyzeDescription>>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const change = (key: string, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError("");
    try {
      await action();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const body = applicationPayload({ job, values, assessments, referrals, interviews, compensation });
      await save(body);
    });
  }

  const parsedTagPreview = values.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);


  return (
    <Sheet
      isOpen={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close();
      }}
      side="right"
      className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
    >
      <form
        onSubmit={submit}
        className="flex h-full max-h-dvh flex-col overflow-hidden"
      >
        <SheetHeader className=" shrink-0 border-b border-border/80 bg-muted/35 px-6 pt-5 pb-4 pr-12">
          <div className="flex items-start gap-3.5">
            <CompanyAvatar
              company={values.company?.trim() || job?.company || "New"}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-lg font-semibold tracking-tight">
                {values.role?.trim() || job?.role || "New application"}
              </SheetTitle>
              <SheetDescription className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-foreground/80">
                  {values.company?.trim() ||
                    job?.company ||
                    "Enter company & role details"}
                </span>
                {values.location?.trim() && (
                  <span>· {values.location.trim()}</span>
                )}
              </SheetDescription>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <StageBadge stage={(values.stage as Stage) || "Saved"} />
                {values.priority && (
                  <PriorityBadge priority={values.priority as Priority} />
                )}
                {parsedTagPreview.slice(0, 4).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="h-5 rounded-md px-1.5 text-xs font-normal"
                  >
                    #{tag}
                  </Badge>
                ))}
                {job?.jobUrl && (
                  <LinkButton
                    href={job.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    size="xs"
                    className="ml-auto"
                  >
                    Job posting <ExternalLink className="size-3" />
                  </LinkButton>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as EditorTab)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="shrink-0 overflow-x-auto border-b border-border/80 bg-background px-6 pt-2">
            <TabsList
              variant="line"
              aria-label="Application sections"
              className="h-9 w-max min-w-full justify-start gap-4 pb-1"
            >
              <TabsTrigger id="overview" className="flex-none px-1 text-xs">
                <BriefcaseBusiness className="size-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger id="assessments" className="flex-none px-1 text-xs">
                <ClipboardCheck className="size-3.5" /> Rounds &amp; OAs
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-4 px-1 text-xs tabular-nums"
                >
                  {assessments.length + interviews.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger id="referrals" className="flex-none px-1 text-xs">
                <Users className="size-3.5" /> Referrals
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-4 px-1 text-xs tabular-nums"
                >
                  {referrals.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger id="offer" className="flex-none px-1 text-xs">
                <Award className="size-3.5" /> Offer
              </TabsTrigger>
              {job && (
                <TabsTrigger id="match" className="flex-none px-1 text-xs">
                  <FileCheck2 className="size-3.5" /> Resume Match
                </TabsTrigger>
              )}
              {Boolean(job?.history?.length) && (
                <TabsTrigger id="history" className="flex-none px-1 text-xs">
                  <History className="size-3.5" /> History
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
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
                    <Textarea
                      id="quick-description"
                      rows={6}
                      value={values.description ?? ""}
                      onChange={(event) =>
                        change("description", event.target.value)
                      }
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

            <EditorAssessments assessments={assessments} setAssessments={setAssessments} interviews={interviews} setInterviews={setInterviews} />

            <EditorReferrals job={job} referrals={referrals} setReferrals={setReferrals} draft={draft} setDraft={setDraft} pending={pending} run={run} token={token} />

            <EditorOffer compensation={compensation} setCompensation={setCompensation} />

            {job && (
              <EditorMatch
                job={job}
                pending={pending}
                run={run}
                setMatch={setMatch}
                match={match}
                token={token}
              />
            )}

            {Boolean(job?.history?.length) && job && (
              <EditorHistory job={job} />
            )}
          </div>
        </Tabs>

        {error && (
          <div
            role="alert"
            className="mx-6 mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2 text-xs font-medium text-destructive"
          >
            {error}
          </div>
        )}

        <SheetFooter className="shrink-0 flex-row flex-wrap items-center justify-between gap-2 border-t border-border/80 bg-muted/35 px-6 py-3.5">
          <div>
            {job && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isDisabled={pending}
                onPress={() =>
                  confirmDelete ? void run(remove) : setConfirmDelete(true)
                }
              >
                <Trash2 className="size-3.5" />
                {confirmDelete ? "Confirm deletion" : "Delete"}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onPress={close}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isDisabled={pending}>
              {pending
                ? "Saving…"
                : job
                  ? "Save changes"
                  : "Create application"}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </Sheet>
  );
}
