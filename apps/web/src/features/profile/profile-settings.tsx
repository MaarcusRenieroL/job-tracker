import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "./profile";
import { ProfileForm } from "./profile-form";

export function ProfileSettings({
  token,
  profile,
  complete,
  back,
}: {
  token: string;
  profile: Profile;
  complete: (profile: Profile) => void;
  back: () => void;
}) {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-5" onPress={back}>
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Button>
        <header className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold">Profile and resume</h1>
          <p className="text-sm text-muted-foreground">
            Update your name, replace your current resume, or restore an earlier version.
          </p>
        </header>
        <section aria-label="Profile settings" className="rounded-xl border bg-card p-6 sm:p-8">
          <ProfileForm
            token={token}
            initialProfile={profile}
            complete={complete}
            submitLabel="Save profile"
          />
        </section>
      </div>
    </main>
  );
}
