import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { Badge } from "@/components/ui/badge";
import type { calculateAnalytics } from "./analytics-data";

type AnalyticsData = ReturnType<typeof calculateAnalytics>;

export function StageTiming({ timing }: { timing: AnalyticsData["timing"] }) {
  return (
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
  );
}

export function ApplicationCadence({ days, weeks }: { days: AnalyticsData["days"]; weeks: AnalyticsData["weeks"] }) {
  return (
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
  );
}
