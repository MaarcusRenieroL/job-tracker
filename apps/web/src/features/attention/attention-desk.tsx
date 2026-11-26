import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Bell } from "lucide-react";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Application } from "../../types/application";
import {
  buildAttentionItems,
  type AttentionSeverity,
} from "./attention-data";

const severityTone: Record<AttentionSeverity, string> = {
  high: "border-destructive/40 bg-destructive/10 text-destructive",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  low: "border-border bg-muted/40 text-muted-foreground",
};

export function AttentionDesk({
  jobs,
  onSelectApplication,
}: {
  jobs: Application[];
  onSelectApplication: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<"all" | AttentionSeverity>("all");
  const [category, setCategory] = useState("all");
  const items = useMemo(() => buildAttentionItems(jobs), [jobs]);

  const categories = useMemo(
    () => ["all", ...new Set(items.map((item) => item.category))],
    [items],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (severity !== "all" && item.severity !== severity) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!needle) return true;
      return (
        item.label.toLowerCase().includes(needle) ||
        item.detail.toLowerCase().includes(needle) ||
        item.company.toLowerCase().includes(needle) ||
        item.role.toLowerCase().includes(needle)
      );
    });
  }, [items, query, severity, category]);

  const counts = useMemo(
    () => ({
      high: items.filter((item) => item.severity === "high").length,
      medium: items.filter((item) => item.severity === "medium").length,
      low: items.filter((item) => item.severity === "low").length,
    }),
    [items],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["high", "medium", "low"] as AttentionSeverity[]).map((level) => (
          <CardFrame key={level}>
            <CardFramePanel className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium capitalize">{level} priority</span>
              </div>
              <span className="text-2xl font-semibold tabular-nums">{counts[level]}</span>
            </CardFramePanel>
          </CardFrame>
        ))}
      </div>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>
            Needs Attention <Badge variant="secondary">{items.length}</Badge>
          </CardFrameTitle>
        </CardFrameHeader>
        <CardFramePanel className="flex flex-col gap-3 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input
              value={query}
              placeholder="Search alerts…"
              onChange={(event) => setQuery(event.target.value)}
              className="bg-background"
            />
            <Select
              selectedKey={severity}
              onSelectionChange={(key) => {
                if (key === null) return;
                setSeverity(String(key) as "all" | AttentionSeverity);
              }}
              className="w-full"
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem id="all" textValue="All severities">
                  All severities
                </SelectItem>
                <SelectItem id="high" textValue="High">
                  High
                </SelectItem>
                <SelectItem id="medium" textValue="Medium">
                  Medium
                </SelectItem>
                <SelectItem id="low" textValue="Low">
                  Low
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              selectedKey={category}
              onSelectionChange={(key) => {
                if (key === null) return;
                setCategory(String(key));
              }}
              className="w-full"
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item} id={item} textValue={item}>
                    {item === "all" ? "All categories" : item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bell />
                </EmptyMedia>
                <EmptyTitle>No alerts right now</EmptyTitle>
                <EmptyDescription>
                  Follow-ups, deadlines, interviews, assessments, referrals, and
                  stale or ghosted applications will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col divide-y divide-border/70">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severityTone[item.severity]}`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.company} · {item.role}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => onSelectApplication(item.applicationId)}
                  >
                    Open <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardFramePanel>
      </CardFrame>
    </div>
  );
}
