import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, FileCheck2, Sparkles } from "lucide-react";
import { api } from "../../../lib/api";
import type {
  Application,
  FitEvidenceItem,
  FitExplanation,
  Match,
} from "../../../types/application";

function EvidenceSection({
  title,
  tone,
  items,
  emptyLabel,
}: {
  title: string;
  tone: "emerald" | "rose" | "amber";
  items: FitEvidenceItem[];
  emptyLabel: string;
}) {
  const pillClasses =
    tone === "emerald"
      ? "border-emerald-200/90 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
      : tone === "rose"
        ? "border-rose-200/90 bg-rose-50/90 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
        : "border-amber-200/90 bg-amber-50/90 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300";

  const dotClasses =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "rose"
        ? "bg-rose-500"
        : "bg-amber-500";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex h-5.5 items-center gap-1.5 rounded-md border px-2 text-xs font-medium tabular-nums ${pillClasses}`}
        >
          <span className={`size-1.5 rounded-full ${dotClasses}`} />
          {title} ({items.length})
        </span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <div
              key={`${title}-${idx}`}
              className="flex flex-col gap-1 rounded-xl border border-border/80 bg-background px-3.5 py-2.5"
            >
              <span className="text-xs font-semibold text-foreground">
                {item.point}
              </span>
              <p className="text-xs text-muted-foreground">
                Evidence: {item.evidence}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorMatch({
  job,
  pending,
  run,
  setMatch,
  match,
  explanation,
  setExplanation,
  token,
}: {
  job: Application;
  pending: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  setMatch: (match: Match) => void;
  match?: Match;
  explanation?: FitExplanation;
  setExplanation: (explanation: FitExplanation) => void;
  token: string;
}) {
  const canEvaluate = Boolean(job.resumeText && job.skills?.length);

  async function requestExplanation() {
    const result = await api<{ match?: Match; explanation: FitExplanation }>(
      `/applications/${job._id}/match/explain`,
      token,
      "POST",
    );
    if (result.match) {
      setMatch(result.match);
    }
    setExplanation(result.explanation);
  }

  return (
    <TabsContent id="match" className="flex flex-col gap-5">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Deterministic Resume Skill Coverage</CardFrameTitle>
          <Button
            variant="outline"
            size="xs"
            type="button"
            isDisabled={pending || !canEvaluate}
            onPress={() =>
              void run(async () =>
                setMatch(await api(`/applications/${job._id}/match`, token)),
              )
            }
          >
            <CheckCircle2 className="size-3.5" /> Check saved resume
          </Button>
        </CardFrameHeader>
        <CardFramePanel className="p-4">
          {!match ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileCheck2 />
                </EmptyMedia>
                <EmptyTitle>Ready to evaluate skill alignment</EmptyTitle>
                <EmptyDescription>
                  {canEvaluate
                    ? "Run the deterministic matcher against your saved resume text and required skills."
                    : "Save both Required skills and Resume text in the Overview tab first, then run the matcher."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-muted/45 p-4 ring-1 ring-border/70">
                <Progress value={match.score ?? 0}>
                  <ProgressLabel className="text-sm font-semibold">
                    Weighted skill coverage
                  </ProgressLabel>
                  <ProgressValue className="tabular-nums">
                    {() => `${match.score ?? 0}%`}
                  </ProgressValue>
                </Progress>
                <p className="mt-2 text-xs text-muted-foreground">
                  Reproducible deterministic score across{" "}
                  <span className="tabular-nums">{match.keywords.length}</span>{" "}
                  required {match.keywords.length === 1 ? "skill" : "skills"}:{" "}
                  {match.keywords.join(", ")}
                </p>
              </div>

              {(match.location || match.seniority) && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {Object.entries({
                    Location: match.location,
                    Seniority: match.seniority,
                  }).map(([label, signal]) => {
                    if (!signal) return null;
                    return (
                      <div
                        key={label}
                        className="rounded-xl border border-border/80 bg-background p-3 text-xs"
                      >
                        <div className="font-semibold text-foreground">
                          {label}: {signal.target}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {signal.evidence ?? "No explicit evidence in resume"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {match.matches.map((item) => (
                  <div
                    key={item.skill}
                    className="flex flex-col gap-1 rounded-xl border border-border/80 bg-background px-3.5 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {item.skill}
                      </span>
                      <Badge
                        variant={
                          item.level === "strong"
                            ? "default"
                            : item.level === "partial"
                              ? "secondary"
                              : "destructive"
                        }
                        className="h-5 rounded-md px-1.5 text-xs"
                      >
                        {item.level}
                      </Badge>
                    </div>
                    {item.evidence && (
                      <p className="text-xs text-muted-foreground">
                        “{item.evidence}”
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {match.preparation.length > 0 && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <span className="font-semibold">
                    Deterministic gap list:{" "}
                  </span>
                  {match.preparation.join(", ")}
                </div>
              )}
            </div>
          )}
        </CardFramePanel>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>AI Job-Fit Explanation</CardFrameTitle>
          <Button
            type="button"
            variant="outline"
            size="xs"
            isDisabled={pending || !canEvaluate}
            onPress={() => void run(requestExplanation)}
          >
            <Sparkles className="size-3" /> Explain fit with AI
          </Button>
        </CardFrameHeader>
        <CardFramePanel className="p-4">
          {!explanation ? (
            <Empty className="py-6">
              <EmptyHeader>
                <EmptyTitle>Evidence-backed fit summary</EmptyTitle>
                <EmptyDescription>
                  {canEvaluate
                    ? "Summarize strengths, resume gaps, and interview prep priorities using your local Ollama model while keeping the deterministic coverage percentage reproducible."
                    : "Save Required skills and Resume text first to generate a job-fit explanation."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 rounded-xl bg-muted/45 p-4 ring-1 ring-border/70">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Role alignment summary
                  </span>
                  {match?.score !== null && match?.score !== undefined && (
                    <Badge
                      variant="secondary"
                      className="h-5 rounded-md px-2 text-xs tabular-nums"
                    >
                      Deterministic score: {match.score}%
                    </Badge>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {explanation.summary}
                </p>
              </div>

              <EvidenceSection
                title="Strengths"
                tone="emerald"
                items={explanation.strengths}
                emptyLabel="No explicit strengths cited from the saved resume."
              />

              <EvidenceSection
                title="Resume gaps"
                tone="rose"
                items={explanation.gaps}
                emptyLabel="No skill gaps identified against the saved requirements."
              />

              <EvidenceSection
                title="Interview prep priorities"
                tone="amber"
                items={explanation.preparation}
                emptyLabel="No specific preparation priorities flagged."
              />
            </div>
          )}
        </CardFramePanel>
      </CardFrame>
    </TabsContent>
  );
}
