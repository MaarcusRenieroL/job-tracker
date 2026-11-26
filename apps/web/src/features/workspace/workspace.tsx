import type { Profile } from "../profile/profile";
import { Button } from "@/components/ui/button";
import { CardFrame, CardFramePanel } from "@/components/ui/card-frame";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Analytics } from "../analytics/analytics";
import { api } from "../../lib/api";
import { EditorSheet, type EditorTab } from "../applications/editor/editor-sheet";
import { type Application, type Priority } from "../../types/application";

import { AgendaDesk } from "../agenda/agenda-desk";
import { InsetHeaderBar } from "./navigation/inset-header-bar";
import { OffersDesk } from "../offers/offers-desk";
import type { Session } from "../auth/session";
import { useTheme } from "../../hooks/use-theme";
import { useWorkspaceData } from "./use-workspace-data";
import { WorkspaceCommands } from "./navigation/workspace-commands";
import { WorkspaceSidebar } from "./navigation/workspace-sidebar";
import { ApplicationFilters } from "./applications/application-filters";
import { ApplicationBoard } from "./applications/application-board";
import { ApplicationLedger } from "./applications/application-ledger";
import { ApplicationSummary } from "./applications/application-summary";
import {
  filterApplications,
  summarizeApplications,
} from "./applications/workspace-application-data";

type PageId = "applications" | "agenda" | "offers" | "analytics";

export function Workspace({
  session,
  signOut,
  profile,
  onEditProfile,
}: {
  session: Session;
  signOut: () => void;
  profile: Profile;
  onEditProfile: () => void;
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

  const { allTags, visible } = filterApplications(jobs, {
    query,
    stage,
    priorityFilter,
    tagFilter,
  });
  const summary = summarizeApplications(jobs, offerRows.length, now);
  const { offersCount } = summary;

  function resetFilters() {
    setStage("");
    setPriorityFilter("");
    setTagFilter([]);
    setQuery("");
  }

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

  return (
    <SidebarProvider overlay>
      <WorkspaceSidebar
        page={page}
        setPage={setPage}
        onEditProfile={onEditProfile}
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

      <SidebarInset className="min-w-0 overflow-x-hidden">
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
              <ApplicationSummary
                total={jobs.length}
                {...summary}
                agendaCount={agenda.length}
              />

              <ApplicationFilters
                query={query}
                setQuery={setQuery}
                stage={stage}
                setStage={setStage}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                tagFilter={tagFilter}
                setTagFilter={setTagFilter}
                allTags={allTags}
                total={jobs.length}
                hasFilters={hasFilters}
                resetFilters={resetFilters}
                view={view}
                setView={setView}
                showAllBoardStages={showAllBoardStages}
                toggleBoardStages={() => setShowAllBoardStages((prev) => !prev)}
              />

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
                            onPress={resetFilters}
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
                <ApplicationLedger
                  visible={visible}
                  openEditor={openEditor}
                  openApplicationById={openApplicationById}
                  move={move}
                  deleteJob={deleteJob}
                />
              ) : (
                <ApplicationBoard
                  visible={visible}
                  stage={stage}
                  showAllBoardStages={showAllBoardStages}
                  openEditor={openEditor}
                  move={move}
                />
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
