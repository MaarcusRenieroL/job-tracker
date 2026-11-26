import { lazy, Suspense, useCallback, useState } from "react";
import { BriefcaseBusiness, Plus } from "lucide-react";
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
import { useTheme } from "../../hooks/use-theme";
import { api } from "../../lib/api";
import type { Application, Priority } from "../../types/application";
import type { EditorTab } from "../applications/editor/editor-sheet";
import type { Session } from "../auth/session";
import type { Profile } from "../profile/profile";
import { ApplicationBoard } from "./applications/application-board";
import { ApplicationFilters } from "./applications/application-filters";
import { ApplicationLedger } from "./applications/application-ledger";
import { ApplicationSummary } from "./applications/application-summary";
import { ApplicationTransferMenu } from "./applications/application-transfer-menu";
import {
  filterApplications,
  summarizeApplications,
} from "./applications/workspace-application-data";
import { InsetHeaderBar } from "./navigation/inset-header-bar";
import { WorkspaceCommands } from "./navigation/workspace-commands";
import { WorkspaceSidebar } from "./navigation/workspace-sidebar";
import { useWorkspaceData } from "./use-workspace-data";
import { useWorkspaceShortcuts } from "./use-workspace-shortcuts";

const Analytics = lazy(() =>
  import("../analytics/analytics").then((mod) => ({ default: mod.Analytics })),
);
const AgendaDesk = lazy(() =>
  import("../agenda/agenda-desk").then((mod) => ({ default: mod.AgendaDesk })),
);
const OffersDesk = lazy(() =>
  import("../offers/offers-desk").then((mod) => ({ default: mod.OffersDesk })),
);
const AttentionDesk = lazy(() =>
  import("../attention/attention-desk").then((mod) => ({ default: mod.AttentionDesk })),
);
const ContactsDesk = lazy(() =>
  import("../contacts/contacts-desk").then((mod) => ({ default: mod.ContactsDesk })),
);
const EditorSheet = lazy(() =>
  import("../applications/editor/editor-sheet").then((mod) => ({
    default: mod.EditorSheet,
  })),
);

type PageId = "applications" | "agenda" | "offers" | "analytics" | "attention" | "contacts";

const PAGE_META: Record<PageId, { title: string; subtitle: string }> = {
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
  attention: {
    title: "Attention",
    subtitle:
      "Follow-ups, deadlines, interviews, assessments, referrals, and stale or ghosted applications.",
  },
  contacts: {
    title: "Contacts",
    subtitle:
      "Recruiter and referrer directory aggregated across every application.",
  },
};

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

  const toggleCommand = useCallback(() => {
    setCommandOpen((prev) => !prev);
  }, []);

  const handleNewApplication = useCallback(() => {
    openEditor("new");
  }, [openEditor]);

  useWorkspaceShortcuts({
    editorOpen: Boolean(editorState),
    commandOpen,
    onToggleCommand: toggleCommand,
    onNewApplication: handleNewApplication,
  });

  const { jobs, agenda, offerRows, error, loading, replace, move, deleteJob, reload } =
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

  const hasFilters = Boolean(
    stage || priorityFilter || tagFilter.length || query,
  );

  function openApplicationById(
    applicationId: string,
    tab: EditorTab = "overview",
  ) {
    const found = jobs.find((item) => item._id === applicationId);
    if (found) {
      openEditor(found, tab);
    }
  }

  const deskFallback = (
    <CardFrame>
      <CardFramePanel className="p-8 text-center text-sm text-muted-foreground">
        Loading view…
      </CardFramePanel>
    </CardFrame>
  );

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
          title={PAGE_META[page].title}
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
          onNewApplication={handleNewApplication}
        />

        <div className="mx-auto flex w-full max-w-[1440px] min-w-0 flex-1 flex-col gap-5 p-4 lg:p-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {PAGE_META[page].title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {PAGE_META[page].subtitle}
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
            <Suspense fallback={deskFallback}>
              <Analytics jobs={jobs} token={session.token} />
            </Suspense>
          ) : page === "agenda" ? (
            <Suspense fallback={deskFallback}>
              <AgendaDesk
                events={agenda}
                fromDate={agendaFrom}
                toDate={agendaTo}
                setFromDate={setAgendaFrom}
                setToDate={setAgendaTo}
                onSelectApplication={(id) =>
                  openApplicationById(id, "overview")
                }
              />
            </Suspense>
          ) : page === "offers" ? (
            <Suspense fallback={deskFallback}>
              <OffersDesk
                offers={offerRows}
                onSelectOffer={(id) => openApplicationById(id, "offer")}
              />
            </Suspense>
          ) : page === "attention" ? (
            <Suspense fallback={deskFallback}>
              <AttentionDesk
                jobs={jobs}
                onSelectApplication={(id) => openApplicationById(id, "overview")}
              />
            </Suspense>
          ) : page === "contacts" ? (
            <Suspense fallback={deskFallback}>
              <ContactsDesk
                jobs={jobs}
                onSelectApplication={(id) => openApplicationById(id, "overview")}
              />
            </Suspense>
          ) : (
            <>
              <ApplicationTransferMenu
                token={session.token}
                jobs={jobs}
                onImported={reload}
              />
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
                toggleBoardStages={() =>
                  setShowAllBoardStages((prev) => !prev)
                }
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
                          <Button size="sm" onPress={handleNewApplication}>
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
        <Suspense fallback={null}>
          <EditorSheet
            profile={profile}
            key={
              editorState.target === "new"
                ? `new-${editorState.tab}`
                : `${editorState.target._id}-${editorState.tab}`
            }
            open={Boolean(editorState)}
            job={
              editorState.target === "new" ? undefined : editorState.target
            }
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
        </Suspense>
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
