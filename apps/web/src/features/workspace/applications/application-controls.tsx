import { StageDot, StageSelectTone } from "@/components/status-badges";
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
import { cn } from "@/lib/utils";
import { stages, type Application, type Stage } from "@/types/application";
import {
  Award,
  BriefcaseBusiness,
  ExternalLink,
  FileCheck2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import type { EditorTab } from "../../applications/editor/editor-sheet";

export function ApplicationActions({
  job,
  openEditor,
  deleteJob,
}: {
  job: Application;
  openEditor: (job: Application, tab?: EditorTab) => void;
  deleteJob: (job: Application) => Promise<void>;
}) {
  return (
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
  );
}

export function ApplicationStagePicker({
  job,
  move,
  variant,
}: {
  job: Application;
  move: (job: Application, stage: Stage) => Promise<void>;
  variant: "compact" | "table";
}) {
  return (
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
          className={cn(
          variant === "compact" ? "h-6.5" : "w-auto",
          "border-inherit bg-transparent text-xs font-medium text-inherit dark:bg-transparent dark:hover:bg-white/5",
        )}
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
  );
}
