import type { AgendaEvent } from "../../../types/application";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar/context";
import { formatRelativeDays } from "@/lib/format";
import {
  Award,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ChevronsUpDown,
  FileUser,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Users,
} from "lucide-react";
import { type Application } from "../../../types/application";
import { buildAttentionItems } from "../../attention/attention-data";

import type { Session } from "../../auth/session";

type PageId = "applications" | "agenda" | "offers" | "analytics" | "attention" | "contacts";
export function WorkspaceSidebar({
  page,
  setPage,
  onEditProfile,
  jobs,
  agenda,
  offersCount,
  session,
  dark,
  toggle,
  signOut,
  openEditor,
  setCommandOpen,
  openApplicationById,
}: {
  page: PageId;
  onEditProfile: () => void;
  setPage: (page: PageId) => void;
  jobs: Application[];
  agenda: AgendaEvent[];
  offersCount: number;
  session: Session;
  dark: boolean;
  toggle: () => void;
  signOut: () => void;
  openEditor: (target: "new") => void;
  setCommandOpen: (open: boolean) => void;
  openApplicationById: (id: string) => void;
}) {
  const { setOpenDrawer } = useSidebar();
  const attentionCount = buildAttentionItems(jobs).length;

  function navigate(action: () => void) {
    setOpenDrawer(false);
    action();
  }

  return (
    <Sidebar>
      <SidebarHeader className="gap-2.5 p-2.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <BriefcaseBusiness className="size-3.5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                Job Tracker
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                Search Workspace
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Button
            size="sm"
            className="w-full justify-between"
            onPress={() => navigate(() => openEditor("new"))}
          >
            <span className="inline-flex items-center gap-1.5">
              <Plus className="size-3.5" /> New application
            </span>
            <Kbd className="bg-primary-foreground/15 text-primary-foreground">
              N
            </Kbd>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between bg-background/80 text-muted-foreground font-normal"
            onPress={() => navigate(() => setCommandOpen(true))}
          >
            <span className="inline-flex items-center gap-1.5">
              <Search className="size-3.5" /> Search &amp; jump…
            </span>
            <Kbd>⌘K</Kbd>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={page === "applications"}
                  tooltip="Applications"
                  onPress={() => navigate(() => setPage("applications"))}
                >
                  <BriefcaseBusiness />
                  <span>Applications</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>{jobs.length}</SidebarMenuBadge>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={page === "agenda"}
                  tooltip="Agenda"
                  onPress={() => navigate(() => setPage("agenda"))}
                >
                  <CalendarClock />
                  <span>Agenda</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>{agenda.length}</SidebarMenuBadge>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={page === "offers"}
                  tooltip="Offers"
                  onPress={() => navigate(() => setPage("offers"))}
                >
                  <Award />
                  <span>Offers</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>{offersCount}</SidebarMenuBadge>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={page === "analytics"}
                  tooltip="Analytics"
                  onPress={() => navigate(() => setPage("analytics"))}
                >
                  <BarChart3 />
                  <span>Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={page === "attention"}
                  tooltip="Attention"
                  onPress={() => navigate(() => setPage("attention"))}
                >
                  <Bell />
                  <span>Attention</span>
                </SidebarMenuButton>
                {attentionCount > 0 && (
                  <SidebarMenuBadge>{attentionCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={page === "contacts"}
                  tooltip="Contacts"
                  onPress={() => navigate(() => setPage("contacts"))}
                >
                  <Users />
                  <span>Contacts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {agenda.length > 0 && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="justify-between">
              <span>Next Deadlines</span>
              <span className="tabular-nums text-xs">{agenda.length}</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-col divide-y divide-sidebar-border rounded-xl bg-background/75 ring-1 ring-sidebar-border dark:bg-card/60">
                {agenda.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() =>
                      navigate(() => openApplicationById(event.applicationId))
                    }
                    className="flex flex-col gap-0.5 px-3 py-2 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-sidebar-accent/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-sidebar-foreground">
                        {event.company}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                        {formatRelativeDays(event.date)}
                      </span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {event.title}
                    </span>
                  </button>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenuTrigger>
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent"
              >
                <Avatar size="sm" className="rounded-lg after:rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-foreground uppercase">
                    {session.email.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-medium text-sidebar-foreground">
                    {session.email}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Local session active
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
              <DropdownMenu placement="top start" className="min-w-56">
                <DropdownMenuLabel className="truncate">
                  {session.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  textValue="New application"
                  onAction={() => navigate(() => openEditor("new"))}
                >
                  <Plus className="size-4" /> New application
                </DropdownMenuItem>
                <DropdownMenuItem
                  textValue="Command palette"
                  onAction={() => navigate(() => setCommandOpen(true))}
                >
                  <Search className="size-4" /> Command palette
                </DropdownMenuItem>
                <DropdownMenuItem
                  textValue={
                    dark ? "Switch to light mode" : "Switch to dark mode"
                  }
                  onAction={toggle}
                >
                  {dark ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                  {dark ? "Switch to light mode" : "Switch to dark mode"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  textValue="Profile and resume"
                  onAction={() => navigate(onEditProfile)}
                >
                  <FileUser className="size-4" /> Profile &amp; resume
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  textValue="Sign out"
                  variant="destructive"
                  onAction={signOut}
                >
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenu>
            </DropdownMenuTrigger>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
