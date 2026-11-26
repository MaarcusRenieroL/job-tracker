import {
  CompanyAvatar,
  PriorityBadge,
  StageDot,
  StageSelectTone,
} from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import {
  Award,
  BriefcaseBusiness,
  ExternalLink,
  FileCheck2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { stages, type Application, type Stage } from "@/types/application";
import type { EditorTab } from "../applications/editor";

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

              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${job.role}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
                <DropdownMenu
                  placement="bottom end"
                  className="min-w-44"
                >
                  <DropdownMenuItem
                    textValue="Inspect and edit"
                    onAction={() => openEditor(job, "overview")}
                  >
                    <BriefcaseBusiness className="size-4" />
                    Inspect &amp; edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    textValue="Resume skill match"
                    onAction={() => openEditor(job, "match")}
                  >
                    <FileCheck2 className="size-4" />
                    Resume skill match
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    textValue="Offer package"
                    onAction={() => openEditor(job, "offer")}
                  >
                    <Award className="size-4" />
                    Offer package
                  </DropdownMenuItem>
                  {job.jobUrl && (
                    <DropdownMenuItem
                      textValue="Open job posting"
                      onAction={() =>
                        window.open(
                          job.jobUrl,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <ExternalLink className="size-4" />
                      Open job posting
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    textValue="Delete application"
                    variant="destructive"
                    onAction={() => void deleteJob(job)}
                  >
                    <Trash2 className="size-4" />
                    Delete application
                  </DropdownMenuItem>
                </DropdownMenu>
              </DropdownMenuTrigger>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <StageSelectTone stage={job.stage}>
                <Select
                  aria-label={`Stage for ${job.role} at ${job.company}`}
                  selectedKey={job.stage}
                  onSelectionChange={(key) => {
                    if (key) void move(job, key as Stage);
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-6.5 border-inherit bg-transparent text-xs font-medium text-inherit dark:bg-transparent dark:hover:bg-white/5"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((value) => (
                      <SelectItem
                        key={value}
                        id={value}
                        textValue={value}
                      >
                        <span className="inline-flex items-center gap-2">
                          <StageDot stage={value} />
                          {value}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </StageSelectTone>

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
