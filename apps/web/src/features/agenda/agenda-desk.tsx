import { AgendaKindBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { formatRelativeDays } from "@/lib/format";
import { CalendarClock } from "lucide-react";
import { type AgendaEvent } from "../../types/application";

export function AgendaDesk({
  events,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  onSelectApplication,
}: {
  events: AgendaEvent[];
  fromDate: string;
  toDate: string;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
  onSelectApplication: (applicationId: string) => void;
}) {
  function applyPreset(daysAhead?: number) {
    const start = new Date().toISOString().slice(0, 10);
    setFromDate(start);
    if (!daysAhead) {
      setToDate("");
      return;
    }
    const end = new Date();
    end.setUTCDate(end.getUTCDate() + daysAhead);
    setToDate(end.toISOString().slice(0, 10));
  }

  return (
    <div className="flex flex-col gap-4">
      <CardFrame>
        <CardFramePanel className="flex flex-wrap items-center justify-between gap-3 p-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="agenda-from"
                className="text-xs text-muted-foreground"
              >
                From
              </Label>
              <InputGroup className="h-8 w-38 bg-background">
                <InputGroupInput
                  id="agenda-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="agenda-to"
                className="text-xs text-muted-foreground"
              >
                To
              </Label>
              <InputGroup className="h-8 w-38 bg-background">
                <InputGroupInput
                  id="agenda-to"
                  type="date"
                  min={fromDate || undefined}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                onPress={() => applyPreset(14)}
              >
                Next 14d
              </Button>
              <Button
                variant="outline"
                size="xs"
                onPress={() => applyPreset(30)}
              >
                Next 30d
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onPress={() => applyPreset(undefined)}
              >
                All upcoming
              </Button>
            </div>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {events.length} scheduled {events.length === 1 ? "event" : "events"}
          </span>
        </CardFramePanel>
      </CardFrame>

      {events.length === 0 ? (
        <CardFrame>
          <CardFramePanel>
            <Empty className="py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarClock />
                </EmptyMedia>
                <EmptyTitle>
                  No upcoming deadlines in this date window
                </EmptyTitle>
                <EmptyDescription>
                  Scheduled interview rounds, active assessments, follow-ups,
                  and offer decision dates automatically appear here in
                  chronological order.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardFramePanel>
        </CardFrame>
      ) : (
        <CardFrame>
          <CardFrameHeader>
            <CardFrameTitle>Chronological Schedule</CardFrameTitle>
            <CardFrameDescription>
              Sorted earliest to latest
            </CardFrameDescription>
          </CardFrameHeader>
          <CardFramePanel className="divide-y divide-border/70">
            {events.map((event) => {
              const parsed = new Date(
                event.dateTime ?? `${event.date}T00:00:00`,
              );
              const month = parsed.toLocaleDateString(undefined, {
                month: "short",
              });
              const day = parsed.toLocaleDateString(undefined, {
                day: "2-digit",
              });
              const relative = formatRelativeDays(event.date);
              return (
                <div
                  key={event.id}
                  className="flex flex-col justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/35 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border/80 bg-muted/45 tabular-nums">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        {month}
                      </span>
                      <span className="text-sm font-semibold leading-tight text-foreground">
                        {day}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {event.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-4.5 rounded-md px-1.5 text-xs tabular-nums"
                        >
                          {relative}
                        </Badge>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/85">
                          {event.company}
                        </span>{" "}
                        · {event.role}
                        {event.dateTime
                          ? ` · ${new Date(event.dateTime).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}`
                          : ` · ${event.date}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
                    <AgendaKindBadge kind={event.kind} />
                    <Button
                      variant="outline"
                      size="xs"
                      onPress={() => onSelectApplication(event.applicationId)}
                    >
                      Inspect
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardFramePanel>
        </CardFrame>
      )}
    </div>
  );
}
