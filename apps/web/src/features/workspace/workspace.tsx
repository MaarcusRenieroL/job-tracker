import type { Profile } from "../onboarding/profile";
import {
  CompanyAvatar,
  PriorityBadge,
  StageDot,
  StageSelectTone,
} from "@/components/status-badges";
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
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCurrency, formatRelativeDays } from "@/lib/format";
import {
  Award,
  BriefcaseBusiness,
  Columns3,
  ExternalLink,
  FileCheck2,
  List,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Analytics } from "../analytics/analytics";
import { api } from "../../lib/api";
import { EditorSheet, type EditorTab } from "../applications/editor";
import {
  priorities,
  stages,
  type Application,
  type Priority,
  type Stage,
} from "../../types/application";

import { AgendaDesk } from "../agenda/agenda-desk";
import { InsetHeaderBar } from "./inset-header-bar";
import { OffersDesk } from "../offers/offers-desk";
import type { Session } from "../auth/session";
import { useTheme } from "../../hooks/use-theme";
import { useWorkspaceData } from "./use-workspace-data";
import { WorkspaceCommands } from "./workspace-commands";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { TagFilter } from "./tag-filter";
const ALL_FILTER = "__all__";
type PageId = "applications" | "agenda" | "offers" | "analytics";

export function Workspace({
  session,
  signOut,
  profile,
}: {
  session: Session;
  signOut: () => void;
  profile: Profile;
}) {
  const { dark, toggle } = useTheme();
  const [page, setPage] = useState<PageId>("applications");
  const [view, setView] = useState<"list" | "board">("list");
  const [showAllBoardStages, setShowAllBoardStages] = useState(false);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [agendaFrom, setAgendaFrom] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [agendaTo, setAgendaTo] = useState("");
  const [editorState, setEditorState] = useState<{
    target: Application | "new";
    tab: EditorTab;
  } | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [dragged, setDragged] = useState<Application>();
  const [dropStage, setDropStage] = useState<Stage>();
  const [now] = useState(Date.now);

  const openEditor = useCallback(
    (target: Application | "new", tab: EditorTab = "overview") => {
      setEditorState({ target, tab });
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
        return;
      }
      if (
        event.key.toLowerCase() === "n" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !editorState &&
        !commandOpen
      ) {
        const el = event.target as HTMLElement | null;
        if (
          el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT" ||
            el.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        openEditor("new");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandOpen, editorState, openEditor]);

  const { jobs, agenda, offerRows, error, loading, replace, move, deleteJob } =
    useWorkspaceData(session.token, agendaFrom, agendaTo);

  const allTags = Array.from(
    new Map(
      jobs
        .flatMap((job) => job.tags ?? [])
        .map((t) => [t.toLowerCase(), t] as const),
    ).values(),
  ).sort((a, b) => a.localeCompare(b));

  const visible = jobs.filter(
    (job) =>
      (!stage || stage === job.stage) &&
      (!priorityFilter || job.priority === priorityFilter) &&
      (!tagFilter.length ||
        tagFilter.some((selected) => (job.tags ?? []).some((tag) => tag.toLowerCase() === selected.toLowerCase()))) &&
      [
        job.company,
        job.role,
        job.location,
        job.source,
        job.priority,
        ...(job.skills ?? []),
        ...(job.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

  const activeCount = jobs.filter(
    (job) =>
      ![
        "Discovered",
        "Saved",
        "Rejected",
        "Withdrawn",
        "Ghosted",
        "Offer",
      ].includes(job.stage),
  ).length;
  const upcomingInterviews = jobs
    .flatMap((job) => job.interviews ?? [])
    .filter(
      (round) =>
        round.result === "Scheduled" && Date.parse(round.dateTime ?? "") >= now,
    ).length;
  const activeAssessments = jobs
    .flatMap((job) => job.assessments ?? [])
    .filter(
      (item) => item.status === "Not started" || item.status === "In progress",
    ).length;
  const offersCount = Math.max(
    jobs.filter((job) => job.stage === "Offer" || Boolean(job.offer)).length,
    offerRows.length,
  );
  const highPriorityCount = jobs.filter(
    (job) => job.priority === "High",
  ).length;

  const hasFilters = Boolean(stage || priorityFilter || tagFilter.length || query);

  const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
    applications: {
      title: "Applications",
      subtitle:
        "Filter, prioritize, and advance opportunities across all 11 pipeline stages.",
    },
    agenda: {
      title: "Agenda",
      subtitle:
        "Chronological deadlines across interviews, coding assessments, follow-ups, and offers.",
    },
    offers: {
      title: "Offers",
      subtitle:
        "Compare base, bonus, equity, and decision windows in original currencies.",
    },
    analytics: {
      title: "Analytics",
      subtitle:
        "Conversion rates, stage velocity, channel performance, and recurring skill gaps.",
    },
  };

  function openApplicationById(
    applicationId: string,
    tab: EditorTab = "overview",
  ) {
    const found = jobs.find((item) => item._id === applicationId);
    if (found) {
      openEditor(found, tab);
    }
  }

  const populatedBoardStages = stages.filter((s) =>
    visible.some((job) => job.stage === s),
  );

  const boardStages = stages.filter((s) => {
    if (stage) return s === stage;
    if (showAllBoardStages || dragged || populatedBoardStages.length === 0)
      return true;
    return populatedBoardStages.includes(s);
  });

  return (
    <SidebarProvider>
      <WorkspaceSidebar
        page={page}
        setPage={setPage}
        jobs={jobs}
        agenda={agenda}
        offersCount={offersCount}
        session={session}
        dark={dark}
        toggle={toggle}
        signOut={signOut}
        openEditor={openEditor}
        setCommandOpen={setCommandOpen}
        openApplicationById={openApplicationById}
      />

      <SidebarInset className="min-w-0 overflow-x-hidden md:peer-data-[variant=inset]:ring-1 md:peer-data-[variant=inset]:ring-border/70">
        <InsetHeaderBar
          title={pageMeta[page].title}
          countText={
            page === "applications"
              ? visible.length === jobs.length
                ? `${jobs.length}`
                : `${visible.length} / ${jobs.length}`
              : undefined
          }
          dark={dark}
          onToggleTheme={toggle}
          onOpenCommand={() => setCommandOpen(true)}
          onNewApplication={() => openEditor("new")}
        />

        <div className="mx-auto flex w-full max-w-[1440px] min-w-0 flex-1 flex-col gap-5 p-4 lg:p-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {pageMeta[page].title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {pageMeta[page].subtitle}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive"
            >
              {error}
            </div>
          )}

          {loading ? (
            <CardFrame>
              <CardFramePanel className="p-8 text-center text-sm text-muted-foreground">
                Loading workspace…
              </CardFramePanel>
            </CardFrame>
          ) : page === "analytics" ? (
            <Analytics jobs={jobs} token={session.token} />
          ) : page === "agenda" ? (
            <AgendaDesk
              events={agenda}
              fromDate={agendaFrom}
              toDate={agendaTo}
              setFromDate={setAgendaFrom}
              setToDate={setAgendaTo}
              onSelectApplication={(id) => openApplicationById(id, "overview")}
            />
          ) : page === "offers" ? (
            <OffersDesk
              offers={offerRows}
              onSelectOffer={(id) => openApplicationById(id, "offer")}
            />
          ) : (
            <>
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
                      {jobs.length}
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
                      {agenda.length} upcoming agenda{" "}
                      {agenda.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </CardFramePanel>
              </CardFrame>

              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <InputGroup className="h-8 w-full bg-card sm:w-72">
                    <InputGroupAddon>
                      <Search className="size-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      aria-label="Search applications"
                      placeholder="Filter role, company, skill, or tag…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </InputGroup>

                  <Select
                    aria-label="Filter by stage"
                    selectedKey={stage || ALL_FILTER}
                    onSelectionChange={(key) => {
                      if (key === null) return;
                      setStage(key === ALL_FILTER ? "" : String(key));
                    }}
                    className="min-w-0 flex-1 sm:w-44 sm:flex-none"
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        id={ALL_FILTER}
                        textValue={`All stages (${jobs.length})`}
                      >
                        All stages ({jobs.length})
                      </SelectItem>
                      {stages.map((value) => (
                        <SelectItem key={value} id={value} textValue={value}>
                          <span className="inline-flex items-center gap-2">
                            <StageDot stage={value} />
                            {value}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    aria-label="Filter by priority"
                    selectedKey={priorityFilter || ALL_FILTER}
                    onSelectionChange={(key) => {
                      if (key === null) return;
                      setPriorityFilter(
                        key === ALL_FILTER ? "" : (String(key) as Priority),
                      );
                    }}
                    className="min-w-0 flex-1 sm:w-36 sm:flex-none"
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem id={ALL_FILTER} textValue="All priorities">
                        All priorities
                      </SelectItem>
                      {priorities.map((prio) => (
                        <SelectItem key={prio} id={prio} textValue={prio}>
                          {prio} priority
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => {
                        setStage("");
                        setPriorityFilter("");
                        setTagFilter([]);
                        setQuery("");
                      }}
                    >
                      <RotateCcw className="size-3.5" /> Reset
                    </Button>
                  )}

                  <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
                    {view === "board" && !stage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => setShowAllBoardStages((prev) => !prev)}
                      >
                        {showAllBoardStages
                          ? "Active stages only"
                          : "All 11 stages"}
                      </Button>
                    )}

                    <ToggleGroup
                      aria-label="Pipeline view mode"
                      selectionMode="single"
                      variant="outline"
                      size="sm"
                      spacing={0}
                      selectedKeys={new Set([view])}
                      onSelectionChange={(keys) => {
                        const next = [...keys][0];
                        if (next === "list" || next === "board") {
                          setView(next);
                        }
                      }}
                      className="ml-auto sm:ml-0"
                    >
                      <ToggleGroupItem id="list" aria-label="Table view">
                        <List className="size-3.5" />
                        <span>Table</span>
                      </ToggleGroupItem>
                      <ToggleGroupItem id="board" aria-label="Board view">
                        <Columns3 className="size-3.5" />
                        <span>Board</span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                {allTags.length > 0 && (
                  <TagFilter tags={allTags} selected={tagFilter} onChange={setTagFilter} />
                )}
              </div>

              {visible.length === 0 ? (
                <CardFrame>
                  <CardFramePanel>
                    <Empty className="py-14">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <BriefcaseBusiness />
                        </EmptyMedia>
                        <EmptyTitle>
                          {jobs.length
                            ? "No applications match the active filters"
                            : "Your pipeline starts here"}
                        </EmptyTitle>
                        <EmptyDescription>
                          {jobs.length
                            ? "Clear or adjust your search, stage, priority, or tag filters."
                            : "Log a role you are targeting to organize its posting, assessments, referrals, interview rounds, and offers."}
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        {jobs.length > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => {
                              setStage("");
                              setPriorityFilter("");
                              setTagFilter([]);
                              setQuery("");
                            }}
                          >
                            Reset filters
                          </Button>
                        ) : (
                          <Button size="sm" onPress={() => openEditor("new")}>
                            <Plus className="size-3.5" /> Add first application
                          </Button>
                        )}
                      </EmptyContent>
                    </Empty>
                  </CardFramePanel>
                </CardFrame>
              ) : view === "list" ? (
                <CardFrame>
                  <CardFrameHeader>
                    <CardFrameTitle>Pipeline Ledger</CardFrameTitle>
                    <CardFrameDescription>
                      Click any role to open the inspector sheet
                    </CardFrameDescription>
                  </CardFrameHeader>
                  <CardFramePanel>
                    <div className="divide-y divide-border/70 md:hidden">
                      {visible.map((job) => {
                        const pendingOa = (job.assessments ?? []).filter(
                          (a) =>
                            a.status === "Not started" ||
                            a.status === "In progress",
                        ).length;
                        const scheduledRounds = (job.interviews ?? []).filter(
                          (r) => r.result === "Scheduled",
                        ).length;

                        return (
                          <div
                            key={job._id}
                            className="flex flex-col gap-3 p-4"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-3">
                                <CompanyAvatar
                                  company={job.company}
                                  size="default"
                                />
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => openEditor(job)}
                                    className="block truncate text-left text-sm font-semibold text-foreground hover:underline underline-offset-3"
                                  >
                                    {job.role}
                                  </button>
                                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground/80">
                                      {job.company}
                                    </span>
                                    {job.location ? ` · ${job.location}` : ""}
                                    {job.workModel ? ` (${job.workModel})` : ""}
                                  </div>
                                </div>
                              </div>

                              <DropdownMenuTrigger>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${job.role}`}
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                                <DropdownMenu
                                  placement="bottom end"
                                  className="min-w-44"
                                >
                                  <DropdownMenuItem
                                    textValue="Inspect and edit"
                                    onAction={() => openEditor(job, "overview")}
                                  >
                                    <BriefcaseBusiness className="size-4" />
                                    Inspect &amp; edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    textValue="Resume skill match"
                                    onAction={() => openEditor(job, "match")}
                                  >
                                    <FileCheck2 className="size-4" />
                                    Resume skill match
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    textValue="Offer package"
                                    onAction={() => openEditor(job, "offer")}
                                  >
                                    <Award className="size-4" />
                                    Offer package
                                  </DropdownMenuItem>
                                  {job.jobUrl && (
                                    <DropdownMenuItem
                                      textValue="Open job posting"
                                      onAction={() =>
                                        window.open(
                                          job.jobUrl,
                                          "_blank",
                                          "noopener,noreferrer",
                                        )
                                      }
                                    >
                                      <ExternalLink className="size-4" />
                                      Open job posting
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    textValue="Delete application"
                                    variant="destructive"
                                    onAction={() => void deleteJob(job)}
                                  >
                                    <Trash2 className="size-4" />
                                    Delete application
                                  </DropdownMenuItem>
                                </DropdownMenu>
                              </DropdownMenuTrigger>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <StageSelectTone stage={job.stage}>
                                <Select
                                  aria-label={`Stage for ${job.role} at ${job.company}`}
                                  selectedKey={job.stage}
                                  onSelectionChange={(key) => {
                                    if (key) void move(job, key as Stage);
                                  }}
                                >
                                  <SelectTrigger
                                    size="sm"
                                    className="h-6.5 border-inherit bg-transparent text-xs font-medium text-inherit dark:bg-transparent dark:hover:bg-white/5"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stages.map((value) => (
                                      <SelectItem
                                        key={value}
                                        id={value}
                                        textValue={value}
                                      >
                                        <span className="inline-flex items-center gap-2">
                                          <StageDot stage={value} />
                                          {value}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </StageSelectTone>

                              <PriorityBadge priority={job.priority} />

                              {job.offer && (
                                <Badge
                                  variant="outline"
                                  className="h-5.5 rounded-md border-emerald-300/80 bg-emerald-50/70 px-1.5 text-xs font-semibold text-emerald-800 tabular-nums dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                                >
                                  {formatCurrency(
                                    (job.offer.base ?? 0) +
                                      (job.offer.bonus ?? 0) +
                                      (job.offer.equity ?? 0),
                                    job.offer.currency,
                                  )}
                                </Badge>
                              )}
                              {scheduledRounds > 0 && (
                                <Badge
                                  variant="outline"
                                  className="h-5.5 rounded-md px-1.5 text-xs tabular-nums"
                                >
                                  {scheduledRounds}{" "}
                                  {scheduledRounds === 1 ? "round" : "rounds"}
                                </Badge>
                              )}
                              {pendingOa > 0 && (
                                <Badge
                                  variant="outline"
                                  className="h-5.5 rounded-md border-amber-300/80 bg-amber-50/70 px-1.5 text-xs text-amber-800 tabular-nums dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                                >
                                  {pendingOa} OA due
                                </Badge>
                              )}
                              {(job.tags ?? []).slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="h-5.5 rounded-md px-1.5 text-xs font-normal"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="hidden md:block">
                      <Table aria-label="Job applications" onRowAction={(key) => openApplicationById(String(key))}>
                        <TableHeader className="bg-muted/40">
                          <TableHead
                            isRowHeader
                            className="px-3.5 text-xs text-muted-foreground"
                          >
                            Role &amp; company
                          </TableHead>
                          <TableHead className="px-2.5 text-xs text-muted-foreground">
                            Stage
                          </TableHead>
                          <TableHead className="px-2.5 text-xs text-muted-foreground">
                            Priority &amp; tags
                          </TableHead>
                          <TableHead className="px-2.5 text-xs text-muted-foreground">
                            Location
                          </TableHead>
                          <TableHead className="px-2.5 text-xs text-muted-foreground">
                            Signals &amp; deadlines
                          </TableHead>
                          <TableHead className="w-10 px-2.5 text-right text-xs text-muted-foreground">
                            Actions
                          </TableHead>
                        </TableHeader>
                        <TableBody items={visible}>
                          {(job) => {
                            const pendingOa = (job.assessments ?? []).filter(
                              (a) =>
                                a.status === "Not started" ||
                                a.status === "In progress",
                            ).length;
                            const scheduledRounds = (
                              job.interviews ?? []
                            ).filter((r) => r.result === "Scheduled").length;

                            return (
                              <TableRow key={job._id} id={job._id} className="cursor-pointer">
                                <TableCell className="px-3.5 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <CompanyAvatar
                                      company={job.company}
                                      size="default"
                                    />
                                    <div className="flex min-w-0 flex-col">
                                      <button
                                        type="button"
                                        onClick={() => openEditor(job)}
                                        className="max-w-56 truncate text-left text-sm font-semibold text-foreground hover:underline underline-offset-3 xl:max-w-68"
                                      >
                                        {job.role}
                                      </button>
                                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className="truncate font-medium text-foreground/80">
                                          {job.company}
                                        </span>
                                        {job.source && (
                                          <span className="truncate">
                                            · {job.source}
                                          </span>
                                        )}
                                        {job.jobUrl && (
                                          <a
                                            href={job.jobUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`Open ${job.role} posting`}
                                            className="shrink-0 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <ExternalLink className="size-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="px-2.5 py-3">
                                  <StageSelectTone stage={job.stage}>
                                    <Select
                                      aria-label={`Stage for ${job.role} at ${job.company}`}
                                      selectedKey={job.stage}
                                      onSelectionChange={(key) => {
                                        if (key) void move(job, key as Stage);
                                      }}
                                    >
                                      <SelectTrigger
                                        size="sm"
                                        className="w-auto border-inherit bg-transparent text-xs font-medium text-inherit dark:bg-transparent dark:hover:bg-white/5"
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {stages.map((value) => (
                                          <SelectItem
                                            key={value}
                                            id={value}
                                            textValue={value}
                                          >
                                            <span className="inline-flex items-center gap-2">
                                              <StageDot stage={value} />
                                              {value}
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </StageSelectTone>
                                </TableCell>

                                <TableCell className="px-2.5 py-3">
                                  <div className="flex items-center gap-1 whitespace-nowrap">
                                    <PriorityBadge priority={job.priority} />
                                    {(job.tags ?? []).slice(0, 1).map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="h-5 rounded-md px-1.5 text-xs font-normal"
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                    {(job.tags?.length ?? 0) > 1 && (
                                      <Badge
                                        variant="outline"
                                        className="h-5 rounded-md px-1.5 text-xs tabular-nums"
                                      >
                                        +{(job.tags?.length ?? 0) - 1}
                                      </Badge>
                                    )}
                                    {!job.priority && !job.tags?.length && (
                                      <span className="text-xs text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </div>
                                </TableCell>

                                <TableCell className="max-w-44 truncate px-2.5 py-3 text-xs text-muted-foreground">
                                  {job.location ? (
                                    <span>
                                      <span className="text-foreground/85">
                                        {job.location}
                                      </span>
                                      {job.workModel
                                        ? ` · ${job.workModel}`
                                        : ""}
                                    </span>
                                  ) : (
                                    job.workModel || "—"
                                  )}
                                </TableCell>

                                <TableCell className="px-2.5 py-3">
                                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                                    {scheduledRounds > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="h-5 rounded-md px-1.5 text-xs tabular-nums"
                                      >
                                        {scheduledRounds}{" "}
                                        {scheduledRounds === 1
                                          ? "round"
                                          : "rounds"}
                                      </Badge>
                                    )}
                                    {pendingOa > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="h-5 rounded-md border-amber-300/80 bg-amber-50/70 px-1.5 text-xs text-amber-800 tabular-nums dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                                      >
                                        {pendingOa} OA due
                                      </Badge>
                                    )}
                                    {job.offer && (
                                      <Badge
                                        variant="outline"
                                        className="h-5 rounded-md border-emerald-300/80 bg-emerald-50/70 px-1.5 text-xs font-semibold text-emerald-800 tabular-nums dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                                      >
                                        {formatCurrency(
                                          (job.offer.base ?? 0) +
                                            (job.offer.bonus ?? 0) +
                                            (job.offer.equity ?? 0),
                                          job.offer.currency,
                                        )}
                                      </Badge>
                                    )}
                                    {(job.followUp || job.deadline) && (
                                      <span className="text-xs text-muted-foreground tabular-nums">
                                        {job.followUp
                                          ? `Follow-up ${formatRelativeDays(job.followUp)}`
                                          : `Due ${formatRelativeDays(job.deadline!)}`}
                                      </span>
                                    )}
                                    {!scheduledRounds &&
                                      !pendingOa &&
                                      !job.offer &&
                                      !job.followUp &&
                                      !job.deadline && (
                                        <span className="text-xs text-muted-foreground">
                                          —
                                        </span>
                                      )}
                                  </div>
                                </TableCell>

                                <TableCell className="px-2.5 py-3 text-right">
                                  <DropdownMenuTrigger>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Actions for ${job.role}`}
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                    <DropdownMenu
                                      placement="bottom end"
                                      className="min-w-44"
                                    >
                                      <DropdownMenuItem
                                        textValue="Inspect and edit"
                                        onAction={() =>
                                          openEditor(job, "overview")
                                        }
                                      >
                                        <BriefcaseBusiness className="size-4" />
                                        Inspect &amp; edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        textValue="Resume skill match"
                                        onAction={() =>
                                          openEditor(job, "match")
                                        }
                                      >
                                        <FileCheck2 className="size-4" />
                                        Resume skill match
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        textValue="Offer package"
                                        onAction={() =>
                                          openEditor(job, "offer")
                                        }
                                      >
                                        <Award className="size-4" />
                                        Offer package
                                      </DropdownMenuItem>
                                      {job.jobUrl && (
                                        <DropdownMenuItem
                                          textValue="Open job posting"
                                          onAction={() =>
                                            window.open(
                                              job.jobUrl,
                                              "_blank",
                                              "noopener,noreferrer",
                                            )
                                          }
                                        >
                                          <ExternalLink className="size-4" />
                                          Open job posting
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        textValue="Delete application"
                                        variant="destructive"
                                        onAction={() => void deleteJob(job)}
                                      >
                                        <Trash2 className="size-4" />
                                        Delete application
                                      </DropdownMenuItem>
                                    </DropdownMenu>
                                  </DropdownMenuTrigger>
                                </TableCell>
                              </TableRow>
                            );
                          }}
                        </TableBody>
                      </Table>
                    </div>
                  </CardFramePanel>
                </CardFrame>
              ) : (
                <div className="flex w-full max-w-full gap-3 overflow-x-auto pb-3">
                  {boardStages.map((value) => {
                    const columnJobs = visible.filter(
                      (job) => job.stage === value,
                    );
                    const isDrop = dropStage === value;
                    return (
                      <CardFrame
                        key={value}
                        className={
                          isDrop
                            ? "w-72 shrink-0 ring-2 ring-ring bg-ring/10"
                            : "w-72 shrink-0"
                        }
                        onDragOver={(event) => {
                          if (dragged) {
                            event.preventDefault();
                            setDropStage(value);
                          }
                        }}
                        onDragLeave={() => {
                          if (dropStage === value) setDropStage(undefined);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (dragged) void move(dragged, value);
                          setDragged(undefined);
                          setDropStage(undefined);
                        }}
                      >
                        <CardFrameHeader className="py-2">
                          <CardFrameTitle>
                            <StageDot stage={value} />
                            <span>{value}</span>
                          </CardFrameTitle>
                          <Badge
                            variant="secondary"
                            className="h-4.5 px-1.5 text-xs tabular-nums"
                          >
                            {columnJobs.length}
                          </Badge>
                        </CardFrameHeader>

                        <div className="flex min-h-72 flex-col gap-2 p-1.5 pt-0">
                          {columnJobs.map((job) => (
                            <button
                              key={job._id}
                              type="button"
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData(
                                  "text/plain",
                                  job._id,
                                );
                                setDragged(job);
                              }}
                              onDragEnd={() => {
                                setDragged(undefined);
                                setDropStage(undefined);
                              }}
                              onClick={() => openEditor(job)}
                              className="flex flex-col gap-2.5 rounded-xl bg-card p-3.5 text-left ring-1 ring-foreground/[0.07] shadow-2xs transition-all hover:ring-foreground/20 dark:ring-white/[0.08]"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <CompanyAvatar
                                    company={job.company}
                                    size="sm"
                                  />
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-semibold text-foreground">
                                      {job.company}
                                    </div>
                                    {job.location && (
                                      <div className="truncate text-xs text-muted-foreground">
                                        {job.location}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <PriorityBadge priority={job.priority} />
                              </div>

                              <div className="text-sm font-semibold leading-snug text-foreground">
                                {job.role}
                              </div>

                              {((job.tags && job.tags.length > 0) ||
                                job.offer) && (
                                <div className="flex flex-wrap items-center gap-1">
                                  {job.offer && (
                                    <Badge
                                      variant="outline"
                                      className="h-4.5 rounded px-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums"
                                    >
                                      {formatCurrency(
                                        (job.offer.base ?? 0) +
                                          (job.offer.bonus ?? 0) +
                                          (job.offer.equity ?? 0),
                                        job.offer.currency,
                                      )}
                                    </Badge>
                                  )}
                                  {(job.tags ?? []).slice(0, 2).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="h-4.5 rounded px-1.5 text-xs font-normal"
                                    >
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </CardFrame>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </SidebarInset>

      {editorState && (
        <EditorSheet
          profile={profile}
          key={
            editorState.target === "new"
              ? `new-${editorState.tab}`
              : `${editorState.target._id}-${editorState.tab}`
          }
          open={Boolean(editorState)}
          job={editorState.target === "new" ? undefined : editorState.target}
          initialTab={editorState.tab}
          token={session.token}
          close={() => setEditorState(null)}
          save={async (body) => {
            const isNew = editorState.target === "new";
            const path = isNew
              ? "/applications"
              : `/applications/${(editorState.target as Application)._id}`;
            replace(
              await api<Application>(
                path,
                session.token,
                isNew ? "POST" : "PATCH",
                body,
              ),
            );
            setEditorState(null);
          }}
          remove={async () => {
            if (editorState.target === "new") return;
            await deleteJob(editorState.target);
            setEditorState(null);
          }}
        />
      )}

      <WorkspaceCommands
        commandOpen={commandOpen}
        setCommandOpen={setCommandOpen}
        jobs={jobs}
        dark={dark}
        toggle={toggle}
        setPage={setPage}
        setView={setView}
        openEditor={openEditor}
        openApplicationById={openApplicationById}
      />
    </SidebarProvider>
  );
}
