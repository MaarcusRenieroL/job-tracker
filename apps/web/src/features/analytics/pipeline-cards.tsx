import {
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { StageBadge } from "@/components/status-badges";
import type { calculateAnalytics } from "./analytics-data";

type AnalyticsData = ReturnType<typeof calculateAnalytics>;

export function PipelineDistribution({ stageCounts, total }: { stageCounts: AnalyticsData["stageCounts"]; total: number }) {
  return (
    <CardFrame className="lg:col-span-7">
      <CardFrameHeader>
        <CardFrameTitle>Pipeline Stage Distribution</CardFrameTitle>
        <CardFrameDescription>{total} roles</CardFrameDescription>
      </CardFrameHeader>
      <CardFramePanel className="p-4">
        {stageCounts.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No applications tracked yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {stageCounts.map(([stage, count]) => {
              const share = total
                ? Math.round((count / total) * 100)
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
  );
}

export function SourceConversion({ sourceRows }: { sourceRows: AnalyticsData["sourceRows"] }) {
  return (
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
  );
}
