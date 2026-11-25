import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Columns3,
  List,
  LogOut,
  Moon,
  Sun,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Analytics } from "./analytics";
import { api, ApiError } from "./api";
import { Editor } from "./editor";
import { stages, type Application, type Stage } from "./types";
import "./App.css";

type Session = { token: string; email: string };
const sessionKey = "job-tracker-session";

function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const preference = matchMedia("(prefers-color-scheme: dark)");
    const sync = (event: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem("job-tracker-theme")) return;
      } catch {}
      document.documentElement.classList.toggle("dark", event.matches);
      setDark(event.matches);
    };
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        setDark(next);
        try {
          localStorage.setItem("job-tracker-theme", next ? "dark" : "light");
        } catch {}
      }}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span>
        <BriefcaseBusiness size={19} />
      </span>{" "}
      Job Tracker
    </div>
  );
}

function SignIn({ onSignIn }: { onSignIn: (session: Session) => void }) {
  const [register, setRegister] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const credentials = {
      email: String(fields.get("email")).trim(),
      password: String(fields.get("password")),
    };
    setPending(true);
    setError("");
    try {
      if (register) await api("/auth/register", undefined, "POST", credentials);
      const { accessToken } = await api<{ accessToken: string }>(
        "/auth/login",
        undefined,
        "POST",
        credentials,
      );
      onSignIn({ token: accessToken, email: credentials.email });
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="sign-in">
      <section className="login-panel">
        <div className="brand-row">
          <Brand />
          <ThemeToggle />
        </div>
        <div>
          <h1>{register ? "Create your account" : "Sign in to Job Tracker"}</h1>
          <p>Track applications, referrals, and interviews in one place.</p>
        </div>
        <form onSubmit={(event) => void submit(event)}>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" isDisabled={pending}>
            {pending ? "Please wait…" : register ? "Create account" : "Sign in"}{" "}
            <ArrowUpRight size={15} />
          </Button>
        </form>
        <button
          className="text-button"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </section>
    </main>
  );
}

const colors: Record<Stage, string> = {
  Discovered: "slate",
  Saved: "slate",
  Applied: "blue",
  "Recruiter Contacted": "violet",
  Screening: "violet",
  "Technical Interview": "amber",
  "Final Interview": "amber",
  Offer: "green",
  Rejected: "red",
  Withdrawn: "slate",
};
function StageLabel({ stage }: { stage: Stage }) {
  return (
    <span className={`stage ${colors[stage]}`}>
      <i />
      {stage}
    </span>
  );
}

function Workspace({
  session,
  signOut,
}: {
  session: Session;
  signOut: () => void;
}) {
  const [jobs, setJobs] = useState<Application[]>([]);
  const [page, setPage] = useState<"applications" | "analytics">(
    "applications",
  );
  const [view, setView] = useState<"list" | "board">("list");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [selected, setSelected] = useState<Application | "new">();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragged, setDragged] = useState<Application>();
  const [dropStage, setDropStage] = useState<Stage>();
  const [now] = useState(Date.now);

  useEffect(() => {
    let active = true;
    api<{ applications: Application[] }>("/applications", session.token)
      .then((result) => {
        if (active) setJobs(result.applications);
      })
      .catch((failure: Error) => {
        if (active)
          setError(
            failure instanceof ApiError && failure.status === 401
              ? "Your session expired. Sign out and sign in again."
              : failure.message,
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session.token]);

  function replace(job: Application) {
    setJobs((previous) => [
      job,
      ...previous.filter((item) => item._id !== job._id),
    ]);
  }
  async function move(job: Application, next: Stage) {
    if (job.stage === next) return;
    setError("");
    try {
      replace(
        await api<Application>(
          `/applications/${job._id}`,
          session.token,
          "PATCH",
          { stage: next, version: job.version },
        ),
      );
    } catch (failure) {
      setError((failure as Error).message);
      const fresh = await api<{ applications: Application[] }>(
        "/applications",
        session.token,
      ).catch(() => null);
      if (fresh) setJobs(fresh.applications);
    }
  }

  const visible = jobs.filter(
    (job) =>
      (!stage || stage === job.stage) &&
      [job.company, job.role, job.location, job.source, ...(job.skills ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const active = jobs.filter(
    (job) =>
      !["Discovered", "Saved", "Rejected", "Withdrawn", "Offer"].includes(
        job.stage,
      ),
  ).length;
  const upcoming = jobs
    .flatMap((job) => job.interviews ?? [])
    .filter(
      (round) =>
        round.result === "Scheduled" && Date.parse(round.dateTime ?? "") >= now,
    ).length;
  const offers = jobs.filter((job) => job.stage === "Offer").length;

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand-row">
          <Brand />
          <ThemeToggle />
        </div>
        <nav aria-label="Workspace">
          <button
            className={page === "applications" ? "current" : ""}
            onClick={() => {
              setPage("applications");
              setSelected(undefined);
            }}
          >
            <BriefcaseBusiness size={17} /> Applications
          </button>
          <button
            className={page === "analytics" ? "current" : ""}
            onClick={() => {
              setPage("analytics");
              setSelected(undefined);
            }}
          >
            <BarChart3 size={17} /> Analytics
          </button>
        </nav>
        <div className="account">
          <span title={session.email}>{session.email}</span>
          <button aria-label="Sign out" title="Sign out" onClick={signOut}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main className="workspace-main">
        {selected ? (
          <Editor
            key={selected === "new" ? "new" : selected._id}
            job={selected === "new" ? undefined : selected}
            token={session.token}
            close={() => setSelected(undefined)}
            save={async (body) => {
              const path =
                selected === "new"
                  ? "/applications"
                  : `/applications/${selected._id}`;
              replace(
                await api<Application>(
                  path,
                  session.token,
                  selected === "new" ? "POST" : "PATCH",
                  body,
                ),
              );
              setSelected(undefined);
            }}
            remove={async () => {
              if (selected === "new") return;
              await api(
                `/applications/${selected._id}`,
                session.token,
                "DELETE",
              );
              setJobs((previous) =>
                previous.filter((job) => job._id !== selected._id),
              );
              setSelected(undefined);
            }}
          />
        ) : (
          <>
            <header className="page-heading">
              <div>
                <h1>
                  {page === "applications" ? "Applications" : "Analytics"}
                </h1>
                <p>
                  {page === "applications"
                    ? "Manage your pipeline from the first save to the final decision."
                    : "Review activity, conversion, and the sources that lead to interviews."}
                </p>
              </div>
              {page === "applications" && (
                <Button onPress={() => setSelected("new")}>
                  <Plus size={17} /> New application
                </Button>
              )}
            </header>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {loading ? (
              <p role="status">Loading applications…</p>
            ) : page === "analytics" ? (
              <Analytics jobs={jobs} token={session.token} />
            ) : (
              <>
                <dl className="summary">
                  <div>
                    <dt>Tracked</dt>
                    <dd>{jobs.length}</dd>
                  </div>
                  <div>
                    <dt>In progress</dt>
                    <dd>{active}</dd>
                  </div>
                  <div>
                    <dt>Upcoming interviews</dt>
                    <dd>{upcoming}</dd>
                  </div>
                  <div>
                    <dt>Offers</dt>
                    <dd>{offers}</dd>
                  </div>
                </dl>
                <div className="toolbar">
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label="Search applications"
                      placeholder="Search applications…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filter by stage"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                  >
                    <option value="">All stages</option>
                    {stages.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <div className="view-toggle">
                    <button
                      aria-pressed={view === "list"}
                      aria-label="List view"
                      onClick={() => setView("list")}
                    >
                      <List size={17} />
                    </button>
                    <button
                      aria-pressed={view === "board"}
                      aria-label="Board view"
                      onClick={() => setView("board")}
                    >
                      <Columns3 size={17} />
                    </button>
                  </div>
                </div>
                {visible.length === 0 ? (
                  <div className="empty">
                    <BriefcaseBusiness size={23} />
                    <h2>
                      {jobs.length
                        ? "No matching applications"
                        : "Your pipeline starts here"}
                    </h2>
                    <p>
                      {jobs.length
                        ? "Try a different search or stage."
                        : "Save a role you’re considering to keep its details and progress together."}
                    </p>
                    {jobs.length === 0 && (
                      <Button
                        variant="outline"
                        onPress={() => setSelected("new")}
                      >
                        Add your first application
                      </Button>
                    )}
                  </div>
                ) : view === "list" ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Role and company</th>
                          <th>Stage</th>
                          <th>Location</th>
                          <th>Source</th>
                          <th>Follow-up</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((job) => (
                          <tr key={job._id}>
                            <td>
                              <button
                                className="job-link"
                                onClick={() => setSelected(job)}
                              >
                                {job.role}
                              </button>
                              <small>{job.company}</small>
                            </td>
                            <td>
                              <StageLabel stage={job.stage} />
                            </td>
                            <td>{job.location || job.workModel || "—"}</td>
                            <td>{job.source || "—"}</td>
                            <td>{job.followUp || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="board">
                    {stages
                      .filter((value) => !stage || value === stage)
                      .map((value) => (
                        <section
                          key={value}
                          className={
                            dropStage === value
                              ? "board-column drop-target"
                              : "board-column"
                          }
                          onDragOver={(event) => {
                            if (dragged) {
                              event.preventDefault();
                              setDropStage(value);
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (dragged) void move(dragged, value);
                            setDragged(undefined);
                            setDropStage(undefined);
                          }}
                        >
                          <h2>
                            <StageLabel stage={value} />{" "}
                            <span>
                              {
                                visible.filter((job) => job.stage === value)
                                  .length
                              }
                            </span>
                          </h2>
                          {visible
                            .filter((job) => job.stage === value)
                            .map((job) => (
                              <button
                                key={job._id}
                                className="board-item"
                                draggable
                                onDragStart={(event) => {
                                  event.dataTransfer.setData(
                                    "text/plain",
                                    job._id,
                                  );
                                  setDragged(job);
                                }}
                                onDragEnd={() => {
                                  setDragged(undefined);
                                  setDropStage(undefined);
                                }}
                                onClick={() => setSelected(job)}
                              >
                                <strong>{job.role}</strong>
                                <small>{job.company}</small>
                              </button>
                            ))}
                        </section>
                      ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export function App() {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(sessionKey) ?? "null");
    } catch {
      return null;
    }
  });
  return session ? (
    <Workspace
      session={session}
      signOut={() => {
        sessionStorage.removeItem(sessionKey);
        setSession(null);
      }}
    />
  ) : (
    <SignIn
      onSignIn={(value) => {
        sessionStorage.setItem(sessionKey, JSON.stringify(value));
        setSession(value);
      }}
    />
  );
}
