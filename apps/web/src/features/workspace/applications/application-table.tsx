import { CompanyAvatar, PriorityBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatRelativeDays } from "@/lib/format";
import { ExternalLink } from "lucide-react";
import { type Application, type Stage } from "@/types/application";
import type { EditorTab } from "../../applications/editor/editor-sheet";
import {
  ApplicationActions,
  ApplicationStagePicker,
} from "./application-controls";

export function ApplicationTable({
  visible,
  openEditor,
  openApplicationById,
  move,
  deleteJob,
}: {
  visible: Application[];
  openEditor: (job: Application, tab?: EditorTab) => void;
  openApplicationById: (id: string) => void;
  move: (job: Application, stage: Stage) => Promise<void>;
  deleteJob: (job: Application) => Promise<void>;
}) {
  return (
    <div className="hidden md:block">
      <Table aria-label="Job applications" onRowAction={(key) => openApplicationById(String(key))}>
        <TableHeader className="bg-muted/40">
          <TableHead
            isRowHeader
            className="px-3.5 text-xs text-muted-foreground"
          >
            Role &amp; company
          </TableHead>
          <TableHead className="px-2.5 text-xs text-muted-foreground">
            Stage
          </TableHead>
          <TableHead className="px-2.5 text-xs text-muted-foreground">
            Priority &amp; tags
          </TableHead>
          <TableHead className="px-2.5 text-xs text-muted-foreground">
            Location
          </TableHead>
          <TableHead className="px-2.5 text-xs text-muted-foreground">
            Signals &amp; deadlines
          </TableHead>
          <TableHead className="w-10 px-2.5 text-right text-xs text-muted-foreground">
            Actions
          </TableHead>
        </TableHeader>
        <TableBody items={visible}>
          {(job) => {
            const pendingOa = (job.assessments ?? []).filter(
              (a) =>
                a.status === "Not started" ||
                a.status === "In progress",
            ).length;
            const scheduledRounds = (
              job.interviews ?? []
            ).filter((r) => r.result === "Scheduled").length;

            return (
              <TableRow key={job._id} id={job._id} className="cursor-pointer">
                <TableCell className="px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <CompanyAvatar
                      company={job.company}
                      size="default"
                    />
                    <div className="flex min-w-0 flex-col">
                      <button
                        type="button"
                        onClick={() => openEditor(job)}
                        className="max-w-56 truncate text-left text-sm font-semibold text-foreground hover:underline underline-offset-3 xl:max-w-68"
                      >
                        {job.role}
                      </button>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate font-medium text-foreground/80">
                          {job.company}
                        </span>
                        {job.source && (
                          <span className="truncate">
                            · {job.source}
                          </span>
                        )}
                        {job.jobUrl && (
                          <a
                            href={job.jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${job.role} posting`}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-2.5 py-3">
                  <ApplicationStagePicker
                    job={job}
                    move={move}
                    variant="table"
                  />
                </TableCell>

                <TableCell className="px-2.5 py-3">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <PriorityBadge priority={job.priority} />
                    {(job.tags ?? []).slice(0, 1).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="h-5 rounded-md px-1.5 text-xs font-normal"
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {(job.tags?.length ?? 0) > 1 && (
                      <Badge
                        variant="outline"
                        className="h-5 rounded-md px-1.5 text-xs tabular-nums"
                      >
                        +{(job.tags?.length ?? 0) - 1}
                      </Badge>
                    )}
                    {!job.priority && !job.tags?.length && (
                      <span className="text-xs text-muted-foreground">
                        —
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="max-w-44 truncate px-2.5 py-3 text-xs text-muted-foreground">
                  {job.location ? (
                    <span>
                      <span className="text-foreground/85">
                        {job.location}
                      </span>
                      {job.workModel
                        ? ` · ${job.workModel}`
                        : ""}
                    </span>
                  ) : (
                    job.workModel || "—"
                  )}
                </TableCell>

                <TableCell className="px-2.5 py-3">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    {scheduledRounds > 0 && (
                      <Badge
                        variant="outline"
                        className="h-5 rounded-md px-1.5 text-xs tabular-nums"
                      >
                        {scheduledRounds}{" "}
                        {scheduledRounds === 1
                          ? "round"
                          : "rounds"}
                      </Badge>
                    )}
                    {pendingOa > 0 && (
                      <Badge
                        variant="outline"
                        className="h-5 rounded-md border-amber-300/80 bg-amber-50/70 px-1.5 text-xs text-amber-800 tabular-nums dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                      >
                        {pendingOa} OA due
                      </Badge>
                    )}
                    {job.offer && (
                      <Badge
                        variant="outline"
                        className="h-5 rounded-md border-emerald-300/80 bg-emerald-50/70 px-1.5 text-xs font-semibold text-emerald-800 tabular-nums dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                      >
                        {formatCurrency(
                          (job.offer.base ?? 0) +
                            (job.offer.bonus ?? 0) +
                            (job.offer.equity ?? 0),
                          job.offer.currency,
                        )}
                      </Badge>
                    )}
                    {(job.followUp || job.deadline) && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {job.followUp
                          ? `Follow-up ${formatRelativeDays(job.followUp)}`
                          : `Due ${formatRelativeDays(job.deadline!)}`}
                      </span>
                    )}
                    {!scheduledRounds &&
                      !pendingOa &&
                      !job.offer &&
                      !job.followUp &&
                      !job.deadline && (
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                  </div>
                </TableCell>

                <TableCell className="px-2.5 py-3 text-right">
                  <ApplicationActions
                    job={job}
                    openEditor={openEditor}
                    deleteJob={deleteJob}
                  />
                </TableCell>
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    </div>
  );
}
