import { CompanyAvatar, PriorityBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { type Application, type Stage } from "@/types/application";
import type { EditorTab } from "../../applications/editor/editor-sheet";
import {
  ApplicationActions,
  ApplicationStagePicker,
} from "./application-controls";

export function ApplicationCards({
  visible,
  openEditor,
  move,
  deleteJob,
}: {
  visible: Application[];
  openEditor: (job: Application, tab?: EditorTab) => void;
  move: (job: Application, stage: Stage) => Promise<void>;
  deleteJob: (job: Application) => Promise<void>;
}) {
  return (
    <div className="divide-y divide-border/70 md:hidden">
      {visible.map((job) => {
        const pendingOa = (job.assessments ?? []).filter(
          (a) =>
            a.status === "Not started" ||
            a.status === "In progress",
        ).length;
        const scheduledRounds = (job.interviews ?? []).filter(
          (r) => r.result === "Scheduled",
        ).length;

        return (
          <div
            key={job._id}
            className="flex flex-col gap-3 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <CompanyAvatar
                  company={job.company}
                  size="default"
                />
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openEditor(job)}
                    className="block truncate text-left text-sm font-semibold text-foreground hover:underline underline-offset-3"
                  >
                    {job.role}
                  </button>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {job.company}
                    </span>
                    {job.location ? ` · ${job.location}` : ""}
                    {job.workModel ? ` (${job.workModel})` : ""}
                  </div>
                </div>
              </div>

              <ApplicationActions

                job={job}

                openEditor={openEditor}

                deleteJob={deleteJob}

              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <ApplicationStagePicker
                job={job}
                move={move}
                variant="compact"
              />

              <PriorityBadge priority={job.priority} />

              {job.offer && (
                <Badge
                  variant="outline"
                  className="h-5.5 rounded-md border-emerald-300/80 bg-emerald-50/70 px-1.5 text-xs font-semibold text-emerald-800 tabular-nums dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                >
                  {formatCurrency(
                    (job.offer.base ?? 0) +
                      (job.offer.bonus ?? 0) +
                      (job.offer.equity ?? 0),
                    job.offer.currency,
                  )}
                </Badge>
              )}
              {scheduledRounds > 0 && (
                <Badge
                  variant="outline"
                  className="h-5.5 rounded-md px-1.5 text-xs tabular-nums"
                >
                  {scheduledRounds}{" "}
                  {scheduledRounds === 1 ? "round" : "rounds"}
                </Badge>
              )}
              {pendingOa > 0 && (
                <Badge
                  variant="outline"
                  className="h-5.5 rounded-md border-amber-300/80 bg-amber-50/70 px-1.5 text-xs text-amber-800 tabular-nums dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                >
                  {pendingOa} OA due
                </Badge>
              )}
              {(job.tags ?? []).slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="h-5.5 rounded-md px-1.5 text-xs font-normal"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
