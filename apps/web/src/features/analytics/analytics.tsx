import {
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import type { Application } from "@/types/application";
import { calculateAnalytics } from "./analytics-data";
import { PipelineDistribution, SourceConversion } from "./pipeline-cards";
import { SkillGaps } from "./skill-gaps";
import { ApplicationCadence, StageTiming } from "./velocity-cards";

export function Analytics({
  jobs,
  token,
}: {
  jobs: Application[];
  token: string;
}) {
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
        <PipelineDistribution stageCounts={stageCounts} total={jobs.length} />
        <SourceConversion sourceRows={sourceRows} />
        <SkillGaps token={token} />
        <StageTiming timing={timing} />
        <ApplicationCadence days={days} weeks={weeks} />
      </div>
    </div>
  );
}
