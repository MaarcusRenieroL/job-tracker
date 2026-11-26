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
import { CheckCircle2, FileCheck2 } from "lucide-react";
import { api } from "../../../lib/api";
import { type Application, type Match } from "../../../types/application";

export function EditorMatch({
  job,
  pending,
  run,
  setMatch,
  match,
  token,
}: {
  job: Application;
  pending: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  setMatch: (match: Match) => void;
  match?: Match;
  token: string;
}) {
  return (
    <TabsContent id="match" className="flex flex-col gap-5">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Deterministic Resume Skill Coverage</CardFrameTitle>
          <Button
            variant="outline"
            size="xs"
            type="button"
            isDisabled={pending || !job.resumeText || !job.skills?.length}
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
                  {job.resumeText && job.skills?.length
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
                  <ProgressValue>{() => `${match.score ?? 0}%`}</ProgressValue>
                </Progress>
                <p className="mt-2 text-xs text-muted-foreground">
                  Evaluated across {match.keywords.length} required{" "}
                  {match.keywords.length === 1 ? "skill" : "skills"}:{" "}
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
                    Recommended interview prep:{" "}
                  </span>
                  {match.preparation.join(", ")}
                </div>
              )}
            </div>
          )}
        </CardFramePanel>
      </CardFrame>
    </TabsContent>
  );
}
