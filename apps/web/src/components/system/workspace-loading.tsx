import { BriefcaseBusiness } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceLoading({
  label = "Loading your workspace…",
}: {
  label?: string;
}) {
  return (
    <main
      className="min-h-dvh bg-background text-foreground"
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <header className="flex h-16 items-center gap-2.5 border-b border-border px-5 sm:px-8">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BriefcaseBusiness className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-tight">
          Job Tracker
        </span>
      </header>
      <div
        aria-hidden="true"
        className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8"
      >
        <div className="space-y-3">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-3 rounded-xl border border-border p-4">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
