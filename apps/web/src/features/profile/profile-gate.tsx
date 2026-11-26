import { useEffect, useState } from "react";
import { SystemScreen } from "@/components/system/system-screen";
import { WorkspaceLoading } from "@/components/system/workspace-loading";
import { api } from "../../lib/api";
import type { Session } from "../auth/session";
import { Workspace } from "../workspace/workspace";
import { Onboarding } from "../onboarding/onboarding";
import type { Navigate, Page } from "../../navigation";
import { ProfileSettings } from "./profile-settings";
import type { Profile } from "./profile";

export function ProfileGate({
  session,
  signOut,
  page,
  navigate,
}: {
  session: Session;
  signOut: () => void;
  page: Page;
  navigate: Navigate;
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
  const destination = profile === null
    ? "/onboarding"
    : page === "/settings/profile" ? page : "/";

  useEffect(() => {
    if (profile !== undefined && destination !== page) {
      navigate(destination, { replace: true });
    }
  }, [destination, navigate, page, profile]);

  function saveProfile(updated: Profile) {
    setProfile(updated);
    navigate("/", { replace: true });
  }

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
        complete={saveProfile}
        signOut={signOut}
      />
    );
  if (page === "/settings/profile") {
    return (
      <ProfileSettings
        token={session.token}
        profile={profile}
        complete={saveProfile}
        back={() => navigate("/", { replace: true })}
      />
    );
  }

  return (
    <Workspace
      session={session}
      signOut={signOut}
      profile={profile}
      onEditProfile={() => navigate("/settings/profile")}
    />
  );
}
