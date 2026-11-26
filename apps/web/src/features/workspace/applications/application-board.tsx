import { useState } from "react";

import {
  CompanyAvatar,
  PriorityBadge,
  StageDot,
} from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import {
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { formatCurrency } from "@/lib/format";
import { stages, type Application, type Stage } from "@/types/application";

export function ApplicationBoard({
  visible,
  stage,
  showAllBoardStages,
  openEditor,
  move,
}: {
  visible: Application[];
  stage: string;
  showAllBoardStages: boolean;
  openEditor: (job: Application) => void;
  move: (job: Application, stage: Stage) => Promise<void>;
}) {
  const [dragged, setDragged] = useState<Application>();
  const [dropStage, setDropStage] = useState<Stage>();

  const populatedBoardStages = stages.filter((s) =>
    visible.some((job) => job.stage === s),
  );

  const boardStages = stages.filter((s) => {
    if (stage) return s === stage;
    if (showAllBoardStages || dragged || populatedBoardStages.length === 0)
      return true;
    return populatedBoardStages.includes(s);
  });

  return (
    <div className="flex w-full max-w-full gap-3 overflow-x-auto pb-3">
      {boardStages.map((value) => {
        const columnJobs = visible.filter(
          (job) => job.stage === value,
        );
        const isDrop = dropStage === value;
        return (
          <CardFrame
            key={value}
            className={
              isDrop
                ? "w-72 shrink-0 ring-2 ring-ring bg-ring/10"
                : "w-72 shrink-0"
            }
            onDragOver={(event) => {
              if (dragged) {
                event.preventDefault();
                setDropStage(value);
              }
            }}
            onDragLeave={() => {
              if (dropStage === value) setDropStage(undefined);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragged) void move(dragged, value);
              setDragged(undefined);
              setDropStage(undefined);
            }}
          >
            <CardFrameHeader className="py-2">
              <CardFrameTitle>
                <StageDot stage={value} />
                <span>{value}</span>
              </CardFrameTitle>
              <Badge
                variant="secondary"
                className="h-4.5 px-1.5 text-xs tabular-nums"
              >
                {columnJobs.length}
              </Badge>
            </CardFrameHeader>

            <div className="flex min-h-72 flex-col gap-2 p-1.5 pt-0">
              {columnJobs.map((job) => (
                <button
                  key={job._id}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      "text/plain",
                      job._id,
                    );
                    setDragged(job);
                  }}
                  onDragEnd={() => {
                    setDragged(undefined);
                    setDropStage(undefined);
                  }}
                  onClick={() => openEditor(job)}
                  className="flex flex-col gap-2.5 rounded-xl bg-card p-3.5 text-left ring-1 ring-foreground/[0.07] shadow-2xs transition-all hover:ring-foreground/20 dark:ring-white/[0.08]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CompanyAvatar
                        company={job.company}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-foreground">
                          {job.company}
                        </div>
                        {job.location && (
                          <div className="truncate text-xs text-muted-foreground">
                            {job.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <PriorityBadge priority={job.priority} />
                  </div>

                  <div className="text-sm font-semibold leading-snug text-foreground">
                    {job.role}
                  </div>

                  {((job.tags && job.tags.length > 0) ||
                    job.offer) && (
                    <div className="flex flex-wrap items-center gap-1">
                      {job.offer && (
                        <Badge
                          variant="outline"
                          className="h-4.5 rounded px-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums"
                        >
                          {formatCurrency(
                            (job.offer.base ?? 0) +
                              (job.offer.bonus ?? 0) +
                              (job.offer.equity ?? 0),
                            job.offer.currency,
                          )}
                        </Badge>
                      )}
                      {(job.tags ?? []).slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="h-4.5 rounded px-1.5 text-xs font-normal"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardFrame>
        );
      })}
    </div>
  );
}
