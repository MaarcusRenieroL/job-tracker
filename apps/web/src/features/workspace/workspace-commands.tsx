import { StageDot } from "@/components/status-badges";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Award,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Columns3,
  List,
  Plus,
  Sparkles,
} from "lucide-react";
import { type Application } from "../../types/application";

type PageId = "applications" | "agenda" | "offers" | "analytics";
export function WorkspaceCommands({
  commandOpen,
  setCommandOpen,
  jobs,
  dark,
  toggle,
  setPage,
  setView,
  openEditor,
  openApplicationById,
}: {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  jobs: Application[];
  dark: boolean;
  toggle: () => void;
  setPage: (page: PageId) => void;
  setView: (view: "list" | "board") => void;
  openEditor: (target: "new") => void;
  openApplicationById: (id: string) => void;
}) {
  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      className="sm:max-w-lg"
    >
      <Command aria-label="Workspace Command Palette">
        <CommandInput placeholder="Search applications, jump to a desk, or run an action…" />
        <CommandList
          className="max-h-96"
          renderEmptyState={() => (
            <CommandEmpty>No matching commands or applications.</CommandEmpty>
          )}
          onAction={(key) => {
            const action = String(key);
            setCommandOpen(false);
            if (action === "act-new") {
              openEditor("new");
            } else if (action === "act-table") {
              setPage("applications");
              setView("list");
            } else if (action === "act-board") {
              setPage("applications");
              setView("board");
            } else if (action === "act-theme") {
              toggle();
            } else if (action.startsWith("nav-")) {
              setPage(action.replace("nav-", "") as PageId);
            } else if (action.startsWith("job-")) {
              openApplicationById(action.replace("job-", ""));
            }
          }}
        >
          <CommandGroup heading="Quick Actions">
            <CommandItem id="act-new" textValue="Create new application">
              <Plus className="size-4" />
              <span>Create new application</span>
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
            <CommandItem id="act-table" textValue="Switch to Table view">
              <List className="size-4" />
              <span>Switch to Table view</span>
            </CommandItem>
            <CommandItem id="act-board" textValue="Switch to Kanban Board">
              <Columns3 className="size-4" />
              <span>Switch to Kanban Board</span>
            </CommandItem>
            <CommandItem id="act-theme" textValue="Toggle dark or light theme">
              <Sparkles className="size-4" />
              <span>
                {dark ? "Switch to Light theme" : "Switch to Dark theme"}
              </span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem id="nav-applications" textValue="Go to Applications">
              <BriefcaseBusiness className="size-4" />
              <span>Applications Pipeline</span>
            </CommandItem>
            <CommandItem id="nav-agenda" textValue="Go to Agenda">
              <CalendarClock className="size-4" />
              <span>Chronological Agenda</span>
            </CommandItem>
            <CommandItem id="nav-offers" textValue="Go to Offers Desk">
              <Award className="size-4" />
              <span>Offers Comparison Desk</span>
            </CommandItem>
            <CommandItem id="nav-analytics" textValue="Go to Analytics">
              <BarChart3 className="size-4" />
              <span>Conversion Analytics</span>
            </CommandItem>
          </CommandGroup>

          {jobs.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Applications">
                {jobs.map((job) => (
                  <CommandItem
                    key={job._id}
                    id={`job-${job._id}`}
                    textValue={`${job.role} ${job.company} ${job.stage}`}
                  >
                    <StageDot stage={job.stage} />
                    <span className="truncate font-medium">{job.role}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      · {job.company}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
