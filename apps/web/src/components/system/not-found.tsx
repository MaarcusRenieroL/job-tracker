import { ArrowLeft, BriefcaseBusiness, FileQuestion } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export function NotFound() {
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
        <div className="w-full max-w-md">
          <div className="mb-6 flex size-11 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
            <FileQuestion className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We couldn’t find that page. Return to your workspace to continue
            tracking your applications.
          </p>
          <LinkButton href="/" className="mt-6">
            <ArrowLeft className="size-4" /> Back to workspace
          </LinkButton>
        </div>
      </section>
      <footer className="border-t border-border px-5 py-4 text-xs text-muted-foreground sm:px-8">
        Your job search workspace
      </footer>
    </main>
  );
}
