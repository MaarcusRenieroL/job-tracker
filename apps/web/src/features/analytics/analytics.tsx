import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { StageBadge } from "@/components/status-badges";
import { api } from "../../lib/api";
import { type Application } from "../../types/application";
import { calculateAnalytics } from "./analytics-data";

export function Analytics({
  jobs,
  token,
}: {
  jobs: Application[];
  token: string;
}) {
  const [missing, setMissing] = useState<{ skill: string; count: number }[]>();
  const [missingError, setMissingError] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ skills: { skill: string; count: number }[] }>(
      "/applications/missing-skills",
      token,
    )
      .then(({ skills }) => {
        if (active) setMissing(skills);
      })
      .catch(() => {
        if (active) setMissingError(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const { stageCounts, kpis, sourceRows, days, weeks, timing } =
    calculateAnalytics(jobs);

  return (
    <div className="flex flex-col gap-5">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Funnel &amp; Conversion Telemetry</CardFrameTitle>
          <CardFrameDescription>
            Computed from {jobs.length} tracked applications
          </CardFrameDescription>
        </CardFrameHeader>
        <CardFramePanel className="grid grid-cols-2 divide-x divide-y divide-border/70 md:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="flex flex-col gap-1 p-4">
              <span className="text-xs font-medium text-muted-foreground">
                {kpi.label}
              </span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {kpi.value}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {kpi.sub}
              </span>
            </div>
          ))}
        </CardFramePanel>
      </CardFrame>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <CardFrame className="lg:col-span-7">
          <CardFrameHeader>
            <CardFrameTitle>Pipeline Stage Distribution</CardFrameTitle>
            <CardFrameDescription>{jobs.length} roles</CardFrameDescription>
          </CardFrameHeader>
          <CardFramePanel className="p-4">
            {stageCounts.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No applications tracked yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {stageCounts.map(([stage, count]) => {
                  const share = jobs.length
                    ? Math.round((count / jobs.length) * 100)
                    : 0;
                  return (
                    <div key={stage} className="flex flex-col gap-1.5">
                      <Progress value={Math.max(share, 4)} className="gap-2">
                        <ProgressLabel>
                          <StageBadge stage={stage} />
                        </ProgressLabel>
                        <ProgressValue>
                          {() => `${count} (${share}%)`}
                        </ProgressValue>
                      </Progress>
                    </div>
                  );
                })}
              </div>
            )}
          </CardFramePanel>
        </CardFrame>

        <CardFrame className="lg:col-span-5">
          <CardFrameHeader>
            <CardFrameTitle>Sources by Interview Conversion</CardFrameTitle>
            <CardFrameDescription>
              {sourceRows.length} channels
            </CardFrameDescription>
          </CardFrameHeader>
          <CardFramePanel className="p-4">
            {sourceRows.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Log application dates and sources to compare channels.
              </p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {sourceRows.map(([source, stat]) => {
                  const rate = Math.round((stat.interviews / stat.total) * 100);
                  return (
                    <div key={source} className="flex flex-col gap-1.5">
                      <Progress value={Math.max(rate, 4)} className="gap-2">
                        <ProgressLabel className="text-xs font-medium">
                          {source}
                        </ProgressLabel>
                        <ProgressValue>
                          {() => `${rate}% · ${stat.interviews}/${stat.total}`}
                        </ProgressValue>
                      </Progress>
                    </div>
                  );
                })}
              </div>
            )}
          </CardFramePanel>
        </CardFrame>

        <CardFrame className="lg:col-span-4">
          <CardFrameHeader>
            <CardFrameTitle>Most Frequent Resume Skill Gaps</CardFrameTitle>
          </CardFrameHeader>
          <CardFramePanel className="divide-y divide-border/70">
            {missingError ? (
              <p className="p-4 text-xs text-muted-foreground">
                Could not load skill gaps.
              </p>
            ) : !missing ? (
              <p className="p-4 text-xs text-muted-foreground">
                Checking saved resumes…
              </p>
            ) : missing.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">
                No missing required skills across saved resumes.
              </p>
            ) : (
              missing.map(({ skill, count }) => (
                <div
                  key={skill}
                  className="flex items-center justify-between px-4 py-2.5 text-xs"
                >
                  <span className="font-medium text-foreground">{skill}</span>
                  <Badge variant="secondary" className="tabular-nums">
                    {count} {count === 1 ? "role" : "roles"}
                  </Badge>
                </div>
              ))
            )}
          </CardFramePanel>
        </CardFrame>

        <CardFrame className="lg:col-span-4">
          <CardFrameHeader>
            <CardFrameTitle>Stage Transition Velocity</CardFrameTitle>
          </CardFrameHeader>
          <CardFramePanel className="divide-y divide-border/70">
            {timing.size === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">
                Move applications across stages to measure cycle velocity.
              </p>
            ) : (
              [...timing].map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs"
                >
                  <span className="truncate font-medium text-foreground">
                    {key}
                  </span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {(value.sum / value.count).toFixed(1)} days
                  </span>
                </div>
              ))
            )}
          </CardFramePanel>
        </CardFrame>

        <CardFrame className="lg:col-span-4">
          <CardFrameHeader>
            <CardFrameTitle>Weekly &amp; Daily Cadence</CardFrameTitle>
          </CardFrameHeader>
          <CardFramePanel className="divide-y divide-border/70">
            {weeks.size === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">
                No submitted applications recorded yet.
              </p>
            ) : (
              [...weeks]
                .sort()
                .reverse()
                .slice(0, 6)
                .map(([week, count]) => (
                  <div
                    key={week}
                    className="flex items-center justify-between px-4 py-2.5 text-xs"
                  >
                    <span className="font-medium text-foreground tabular-nums">
                      Week of {week}
                    </span>
                    <Badge variant="outline" className="tabular-nums">
                      {count} applied
                    </Badge>
                  </div>
                ))
            )}
            {days.size > 0 && (
              <div className="bg-muted/30 px-4 py-2 text-xs text-muted-foreground tabular-nums">
                Active across {days.size} distinct application{" "}
                {days.size === 1 ? "day" : "days"}
              </div>
            )}
          </CardFramePanel>
        </CardFrame>
      </div>
    </div>
  );
}
