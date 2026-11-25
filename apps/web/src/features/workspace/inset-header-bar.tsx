import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ChevronRight, Moon, Plus, Search, Sun } from "lucide-react";

export function InsetHeaderBar({
  title,
  countText,
  dark,
  onToggleTheme,
  onOpenCommand,
  onNewApplication,
}: {
  title: string;
  countText?: string;
  dark: boolean;
  onToggleTheme: () => void;
  onOpenCommand: () => void;
  onNewApplication: () => void;
}) {
  const { state, isMobile } = useSidebar();
  const showQuickTriggers = isMobile || state === "collapsed";

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-md lg:px-6">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-2 text-xs"
      >
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <span className="hidden text-muted-foreground sm:inline">
          Workspace
        </span>
        <ChevronRight className="hidden size-3.5 text-muted-foreground/60 sm:inline" />
        <span className="truncate font-medium text-foreground">{title}</span>
        {countText && (
          <Badge variant="secondary" className="tabular-nums">
            {countText}
          </Badge>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        {showQuickTriggers && (
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex font-normal text-muted-foreground"
            onPress={onOpenCommand}
          >
            <Search className="size-3.5" />
            <span>Command</span>
            <Kbd>⌘K</Kbd>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          onPress={onToggleTheme}
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        {showQuickTriggers && (
          <Button size="sm" onPress={onNewApplication}>
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New application</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </div>
    </header>
  );
}
