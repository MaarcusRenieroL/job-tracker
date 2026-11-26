import { PriorityBadge } from "@/components/status-badges";
import { CardFrame, CardFramePanel } from "@/components/ui/card-frame";

export function ApplicationSummary({
  total,
  highPriorityCount,
  activeCount,
  upcomingInterviews,
  activeAssessments,
  offersCount,
  agendaCount,
}: {
  total: number;
  highPriorityCount: number;
  activeCount: number;
  upcomingInterviews: number;
  activeAssessments: number;
  offersCount: number;
  agendaCount: number;
}) {
  return (
    <CardFrame>
      <CardFramePanel className="grid grid-cols-2 divide-x divide-y divide-border/70 lg:grid-cols-4 lg:divide-y-0">
        <div className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Tracked roles
            </span>
            {highPriorityCount > 0 && (
              <PriorityBadge priority="High" />
            )}
          </div>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {total}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {highPriorityCount} high priority
          </span>
        </div>

        <div className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Active funnel
          </span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {activeCount}
          </span>
          <span className="text-xs text-muted-foreground">
            Applied through Final Interview
          </span>
        </div>

        <div className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Interviews &amp; OAs
          </span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {upcomingInterviews}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {activeAssessments} open{" "}
            {activeAssessments === 1 ? "assessment" : "assessments"}
          </span>
        </div>

        <div className="flex flex-col gap-1 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            Offers &amp; agenda
          </span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {offersCount}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {agendaCount} upcoming agenda{" "}
            {agendaCount === 1 ? "item" : "items"}
          </span>
        </div>
      </CardFramePanel>
    </CardFrame>
  );
}
