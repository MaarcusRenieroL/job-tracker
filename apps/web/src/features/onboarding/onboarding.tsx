import { ProfileForm } from "../profile/profile-form";
import type { Profile } from "../profile/profile";

export function Onboarding({
  token,
  initialName,
  complete,
  signOut,
}: {
  token: string;
  initialName?: string;
  complete: (profile: Profile) => void;
  signOut: () => void;
}) {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:py-12">
      <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6 sm:p-8">
        <header className="mb-7 space-y-2">
          <h1 className="text-2xl font-semibold">Set up your profile</h1>
          <p className="text-sm text-muted-foreground">
            Add your resume or describe your experience to compare it with job postings.
          </p>
        </header>
        <ProfileForm
          token={token}
          initialName={initialName}
          complete={complete}
          submitLabel="Continue to dashboard"
          secondaryAction={{ label: "Sign out", run: signOut }}
        />
      </section>
    </main>
  );
}
