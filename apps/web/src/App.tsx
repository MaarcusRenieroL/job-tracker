import { useState } from "react";
import { NotFound } from "./components/system/not-found";
import { readSession, sessionKey, type Session } from "./features/auth/session";
import { SignIn } from "./features/auth/sign-in";
import { ProfileGate } from "./features/onboarding/profile-gate";

export function App() {
  const [session, setSession] = useState<Session | null>(readSession);

  if (window.location.pathname !== "/") return <NotFound />;

  return session ? (
    <ProfileGate
      session={session}
      signOut={() => {
        try {
          sessionStorage.removeItem(sessionKey);
        } catch {
          /* Storage may be unavailable. */
        }
        setSession(null);
      }}
    />
  ) : (
    <SignIn
      onSignIn={(value) => {
        try {
          sessionStorage.setItem(sessionKey, JSON.stringify(value));
        } catch {
          /* Keep the session in memory. */
        }
        setSession(value);
      }}
    />
  );
}
