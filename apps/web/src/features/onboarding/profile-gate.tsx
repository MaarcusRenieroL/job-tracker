import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "../../lib/api";
import type { Session } from "../auth/session";
import { Workspace } from "../workspace/workspace";
import { Onboarding } from "./onboarding";
import type { Profile } from "./profile";

export function ProfileGate({
  session,
  signOut,
}: {
  session: Session;
  signOut: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null | undefined>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    api<{ profile: Profile | null }>("/profile", session.token)
      .then((result) => {
        if (active) setProfile(result.profile);
      })
      .catch((failure: Error) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [session.token, retry]);
  if (error)
    return (
      <main className="p-8">
        <p role="alert">{error}</p>
        <Button onPress={() => setRetry((n) => n + 1)}>Try again</Button>
        <Button variant="ghost" onPress={signOut}>
          Sign out
        </Button>
      </main>
    );
  if (profile === undefined)
    return (
      <main className="p-8" role="status">
        Loading your profile…
      </main>
    );
  if (!profile)
    return (
      <Onboarding
        token={session.token}
        complete={setProfile}
        signOut={signOut}
      />
    );
  return <Workspace session={session} signOut={signOut} profile={profile} />;
}
