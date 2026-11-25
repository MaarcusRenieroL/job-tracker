import { StageBadge } from "@/components/status-badges";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { TabsContent } from "@/components/ui/tabs";
import type { Application } from "../../types/application";

export function EditorHistory({ job }: { job: Application }) {
  return (
    <TabsContent id="history" className="flex flex-col gap-4">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Atomic Stage Transition Ledger</CardFrameTitle>
        </CardFrameHeader>
        <CardFramePanel className="divide-y divide-border/70">
          {job?.history.map((event, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs"
            >
              <div className="flex items-center gap-2">
                {event.from ? (
                  <>
                    <StageBadge stage={event.from} />
                    <span className="text-muted-foreground">→</span>
                    <StageBadge stage={event.to} />
                  </>
                ) : (
                  <StageBadge stage={event.to} />
                )}
              </div>
              <span className="text-muted-foreground tabular-nums">
                {new Date(event.at).toLocaleString()}
              </span>
            </div>
          ))}
        </CardFramePanel>
      </CardFrame>
    </TabsContent>
  );
}
