import { AlertCircle, BriefcaseBusiness, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SystemScreen({
  title,
  description,
  detail,
  onRetry,
  onSignOut,
}: {
  title: string;
  description: string;
  detail?: string;
  onRetry: () => void;
  onSignOut?: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 items-center gap-2.5 border-b border-border px-5 sm:px-8">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BriefcaseBusiness className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-tight">
          Job Tracker
        </span>
      </header>
      <section className="flex flex-1 items-center justify-center px-5 py-16">
        <div role="alert" className="w-full max-w-md">
          <div className="mb-6 flex size-11 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {detail && (
            <p className="mt-4 break-words rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              {detail}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onPress={onRetry}>
              <RefreshCw className="size-4" /> Try again
            </Button>
            {onSignOut && (
              <Button variant="outline" onPress={onSignOut}>
                Sign out
              </Button>
            )}
          </div>
        </div>
      </section>
      <footer className="border-t border-border px-5 py-4 text-xs text-muted-foreground sm:px-8">
        Your job search workspace
      </footer>
    </main>
  );
}
