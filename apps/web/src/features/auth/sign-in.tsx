import {
  CompanyAvatar,
  PriorityBadge,
  StageBadge,
} from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  ArrowRight,
  UserRound,
  BriefcaseBusiness,
  Lock,
  Mail,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../lib/api";

import type { Session } from "./session";
import { useTheme } from "../../hooks/use-theme";
export function SignIn({ onSignIn }: { onSignIn: (session: Session) => void }) {
  const { dark, toggle } = useTheme();
  const [register, setRegister] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const schema = z.object({
    name: register ? z.string().trim().min(1, "Enter your name.").max(120) : z.string(),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
    password: z.string().min(12, "Use at least 12 characters.").max(128),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const password = useWatch({ control: form.control, name: "password" }) ?? "";
  const passwordChecks = [
    { label: "12 or more characters", met: password.length >= 12 },
    { label: "Upper and lowercase letters", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number or symbol", met: /[^a-zA-Z]/.test(password) },
  ];
  const submit = form.handleSubmit(async ({ name, email, password }) => {
    setPending(true);
    setError("");
    try {
      if (register) await api("/auth/register", undefined, "POST", { name, email, password });
      const { accessToken } = await api<{ accessToken: string }>(
        "/auth/login", undefined, "POST", { email, password },
      );
      onSignIn({ token: accessToken, email, ...(register ? { name } : {}) });
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setPending(false);
    }
  });

  return (
    <main className="grid min-h-dvh grid-cols-1 bg-background lg:grid-cols-[1.12fr_0.88fr]">
      <section
        aria-label="Workspace preview"
        className="hidden flex-col justify-between border-r border-sidebar-border bg-sidebar p-10 xl:p-14 lg:flex"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <BriefcaseBusiness className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Job Tracker
          </span>
        </div>

        <div className="my-auto flex max-w-xl flex-col gap-7 py-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground xl:text-4xl">
              Run your entire job search from one local workspace.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Track applications across 11 stages, prioritize roles, log coding
              assessments and interview rounds, verify resume skill coverage,
              and compare multi-currency offers with zero cloud lock-in.
            </p>
          </div>

          <CardFrame data-ui>
            <CardFrameHeader>
              <CardFrameTitle>
                Pipeline &amp; Skill Coverage Preview
              </CardFrameTitle>
              <CardFrameDescription>
                Sample demonstration state
              </CardFrameDescription>
            </CardFrameHeader>
            <CardFramePanel className="divide-y divide-border/70">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CompanyAvatar company="Stripe" size="sm" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Staff Product Engineer
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Stripe · Remote · #fintech #typescript
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <PriorityBadge priority="High" />
                  <StageBadge stage="Final Interview" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CompanyAvatar company="Linear" size="sm" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Senior Systems Engineer
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Linear · Remote · Take-home OA due Fri
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <PriorityBadge priority="High" />
                  <StageBadge stage="Technical Interview" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CompanyAvatar company="Vercel" size="sm" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Principal Frontend Architect
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vercel · Hybrid SF · $430,000 package
                    </div>
                  </div>
                </div>
                <StageBadge stage="Offer" />
              </div>
              <div className="bg-muted/30 px-4 py-3">
                <Progress value={90} className="gap-1.5">
                  <ProgressLabel className="text-xs font-medium">
                    Deterministic Resume Skill Coverage
                  </ProgressLabel>
                  <ProgressValue>{() => "90% match"}</ProgressValue>
                </Progress>
              </div>
            </CardFramePanel>
          </CardFrame>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t border-sidebar-border pt-6 text-xs">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">
              11 Atomic Stages
            </span>
            <span className="text-muted-foreground">
              Optimistic concurrency with full stage history.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">
              Agenda &amp; Assessments
            </span>
            <span className="text-muted-foreground">
              Chronological deadlines across OAs and rounds.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">
              Local-First Privacy
            </span>
            <span className="text-muted-foreground">
              Ed25519 JWT auth &amp; optional local Ollama drafts.
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-col justify-between p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:invisible">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BriefcaseBusiness className="size-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Job Tracker
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onPress={toggle}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 flex flex-col gap-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {register ? "Create your account" : "Sign in to Job Tracker"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {register
                ? "Set up a local account with a 12+ character password."
                : "Enter your credentials to open your pipeline."}
            </p>
          </div>

          <CardFrame>
            <CardFramePanel className="p-5">
              <form
                onSubmit={(event) => void submit(event)}
                noValidate
                className="flex flex-col gap-4"
              >
                {register && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="auth-name" className="text-xs">Full name</Label>
                    <InputGroup className="h-9 bg-background">
                      <InputGroupAddon><UserRound className="size-4" /></InputGroupAddon>
                      <InputGroupInput id="auth-name" autoComplete="name" placeholder="Your name" aria-invalid={!!form.formState.errors.name} {...form.register("name")} />
                    </InputGroup>
                    {form.formState.errors.name && <p role="alert" className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auth-email" className="text-xs">
                    Email address
                  </Label>
                  <InputGroup className="h-9 bg-background">
                    <InputGroupAddon>
                      <Mail className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="auth-email"
                      type="email"
                      {...form.register("email")}
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                    />
                  </InputGroup>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auth-password" className="text-xs">
                    Password
                  </Label>
                  <InputGroup className="h-9 bg-background">
                    <InputGroupAddon>
                      <Lock className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="auth-password"
                      type="password"
                      {...form.register("password")}
                      autoComplete={
                        register ? "new-password" : "current-password"
                      }
                      placeholder="Minimum 12 characters"
                      minLength={12}
                      maxLength={128}
                      required
                    />
                  </InputGroup>
                </div>

                {register && password && (
                  <ul className="grid gap-1 text-xs text-muted-foreground" aria-label="Password guidance">
                    {passwordChecks.map(({ label, met }) => <li key={label} className={met ? "text-emerald-700 dark:text-emerald-400" : ""}>{met ? "✓" : "○"} {label}</li>)}
                  </ul>
                )}
                {(form.formState.errors.email || form.formState.errors.password) && (
                  <p role="alert" className="text-xs text-destructive">{form.formState.errors.email?.message || form.formState.errors.password?.message}</p>
                )}
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  isDisabled={pending}
                  className="mt-2 w-full justify-center gap-2 font-semibold"
                >
                  <span>
                    {pending
                      ? "Authenticating…"
                      : register
                        ? "Create account"
                        : "Sign in"}
                  </span>
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </CardFramePanel>
          </CardFrame>

          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              onPress={() => {
                setRegister(!register);
                form.clearErrors();
                setError("");
              }}
            >
              {register
                ? "Already have an account? Sign in"
                : "New to Job Tracker? Create an account"}
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Secured locally with Argon2id &amp; Ed25519 bearer tokens
        </div>
      </section>
    </main>
  );
}
