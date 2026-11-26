import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { TabsContent } from "@/components/ui/tabs";
import type { Application } from "../../../types/application";
import { buildTimeline, type TimelineEvent } from "./editor-timeline";

const kindTone: Record<string, string> = {
  stage: "bg-primary/70",
  interview: "bg-sky-500",
  assessment: "bg-amber-500",
  referral: "bg-violet-500",
  offer: "bg-emerald-500",
  "follow-up": "bg-cyan-500",
  system: "bg-muted-foreground/50",
};

function TimelineRow({ event }: { event: TimelineEvent }) {
  return (
    <div className="flex gap-3 py-3">
      <div className="flex flex-col items-center">
        <span
          className={`mt-1.5 size-2.5 shrink-0 rounded-full ${kindTone[event.kind] ?? "bg-muted-foreground/50"}`}
        />
        <span className="mt-1 h-full w-px bg-border/70" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">
            {event.title}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {new Date(event.at).toLocaleString()}
          </span>
        </div>
        {event.detail && (
          <span className="text-xs text-muted-foreground">{event.detail}</span>
        )}
      </div>
    </div>
  );
}

export function EditorHistory({ job }: { job: Application }) {
  const events = job ? buildTimeline(job) : [];
  return (
    <TabsContent id="history" className="flex flex-col gap-4">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Activity Timeline</CardFrameTitle>
        </CardFrameHeader>
        <CardFramePanel className="px-4">
          {events.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No activity recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {events.map((event) => (
                <TimelineRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardFramePanel>
      </CardFrame>
    </TabsContent>
  );
}
