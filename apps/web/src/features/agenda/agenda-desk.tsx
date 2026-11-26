import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("earliest");
  const [page, setPage] = useState(0);
  const filtered = events.filter((event) => [event.title, event.company, event.role, event.kind].join(" ").toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => order === "earliest" ? (a.dateTime ?? a.date).localeCompare(b.dateTime ?? b.date) : (b.dateTime ?? b.date).localeCompare(a.dateTime ?? a.date));
  const pageSize = 10;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
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
            <Select aria-label="Date range preset" placeholder="Date range" onSelectionChange={(key) => { if (key !== null) { applyPreset(key === "all" ? undefined : Number(key)); setPage(0); } }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem id="7">Next 7 days</SelectItem><SelectItem id="14">Next 14 days</SelectItem><SelectItem id="28">Next 28 days</SelectItem><SelectItem id="all">All upcoming</SelectItem></SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {events.length} scheduled {events.length === 1 ? "event" : "events"}
          </span>
        </CardFramePanel>
      </CardFrame>

      <div className="flex flex-wrap gap-2">
        <Input aria-label="Search schedule" placeholder="Search company, role, or event…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} className="w-full sm:w-72" />
        <Select aria-label="Sort schedule" selectedKey={order} onSelectionChange={(key) => { if (key) setOrder(String(key)); }}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem id="earliest">Earliest first</SelectItem><SelectItem id="latest">Latest first</SelectItem></SelectContent></Select>
      </div>
      {filtered.length === 0 ? (
        <CardFrame>
          <CardFramePanel>
            <Empty className="py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarClock />
                </EmptyMedia>
                <EmptyTitle>
                  No matching events in this date window
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
              {order === "earliest" ? "Sorted earliest to latest" : "Sorted latest to earliest"}
            </CardFrameDescription>
          </CardFrameHeader>
          <CardFramePanel className="divide-y divide-border/70">
            {visible.map((event) => {
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
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground"><span>{filtered.length} matching events · Page {currentPage + 1} of {Math.max(1, Math.ceil(filtered.length / pageSize))}</span><div className="flex gap-2"><Button variant="outline" size="xs" isDisabled={currentPage === 0} onPress={() => setPage(currentPage - 1)}>Previous</Button><Button variant="outline" size="xs" isDisabled={(currentPage + 1) * pageSize >= filtered.length} onPress={() => setPage(currentPage + 1)}>Next</Button></div></div>
        </CardFrame>
      )}
    </div>
  );
}
