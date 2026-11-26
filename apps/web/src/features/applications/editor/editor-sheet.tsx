import type { Profile } from "../../profile/profile";
import { EditorHistory } from "./editor-history";
import {
  CompanyAvatar,
  PriorityBadge,
  StageBadge,
} from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useState } from "react";
import type {
  Application,
  FitExplanation,
  InterviewPrep,
  Match,
  Priority,
  Stage,
} from "../../../types/application";
import { EditorMatch } from "./editor-match";
import { EditorAssessments } from "./editor-assessments";
import { EditorOffer } from "./editor-offer";
import { EditorOverview } from "./editor-overview";
import { EditorReferrals } from "./editor-referrals";
import { applicationPayload } from "./editor-form";
import { useEditorForm } from "./use-editor-form";

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
  const {
    handleSubmit,
    values,
    setValues,
    assessments,
    setAssessments,
    referrals,
    setReferrals,
    interviews,
    setInterviews,
    compensation,
    setCompensation,
  } = useEditorForm(job, profile);
  const [match, setMatch] = useState<Match>();
  const [explanation, setExplanation] = useState<FitExplanation>();
  const [prep, setPrep] = useState<InterviewPrep>();
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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

  const submit = handleSubmit(
    (input) => run(() => save(applicationPayload({ job, ...input }))),
    (issues) => {
      setActiveTab("overview");
      const message = issues.values?.message;
      setError(
        typeof message === "string"
          ? message
          : "Check the application details and try again.",
      );
    },
  );

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
        noValidate
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
            <EditorOverview job={job} values={values} setValues={setValues} pending={pending} run={run} token={token} resumeVersions={profile.resumeVersions} />

            <EditorAssessments
              job={job}
              assessments={assessments}
              setAssessments={setAssessments}
              interviews={interviews}
              setInterviews={setInterviews}
              prep={prep}
              setPrep={setPrep}
              pending={pending}
              run={run}
              token={token}
            />

            <EditorReferrals job={job} referrals={referrals} setReferrals={setReferrals} draft={draft} setDraft={setDraft} pending={pending} run={run} token={token} />

            <EditorOffer compensation={compensation} setCompensation={setCompensation} />

            {job && (
              <EditorMatch
                job={job}
                pending={pending}
                run={run}
                setMatch={setMatch}
                match={match}
                explanation={explanation}
                setExplanation={setExplanation}
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
