import { useEffect, useState } from "react";
import { SystemScreen } from "@/components/system/system-screen";
import { WorkspaceLoading } from "@/components/system/workspace-loading";
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
      <SystemScreen
        title="We couldn’t load your profile"
        description="Check that the app is running, then try again. If your session has expired, sign in again."
        detail={error}
        onRetry={() => setRetry((n) => n + 1)}
        onSignOut={signOut}
      />
    );
  if (profile === undefined)
    return <WorkspaceLoading label="Loading your profile…" />;
  if (!profile)
    return (
      <Onboarding
        token={session.token}
        initialName={session.name}
        complete={setProfile}
        signOut={signOut}
      />
    );
  return <Workspace session={session} signOut={signOut} profile={profile} />;
}
