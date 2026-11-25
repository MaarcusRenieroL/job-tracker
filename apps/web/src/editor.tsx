import { useState, type FormEvent } from "react";
import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "./api";
import { stages, type Application, type Entry, type Match } from "./types";

type Field = [name: string, label: string, type?: string, choices?: string[]];
const posting: Field[] = [
  ["company", "Company"],
  ["role", "Job title"],
  ["location", "Location"],
  ["workModel", "Work model", "select", ["Remote", "Hybrid", "On-site"]],
  ["salaryRange", "Salary range"],
  ["source", "Source"],
  ["jobUrl", "Job URL", "url"],
  ["deadline", "Application deadline", "date"],
  ["skills", "Required skills (comma-separated)"],
  ["description", "Job description", "textarea"],
  ["notes", "Notes", "textarea"],
];
const application: Field[] = [
  ["appliedAt", "Application date", "date"],
  ["followUp", "Follow-up date", "date"],
  ["resumeVersion", "Resume version"],
  ["rejectionReason", "Rejection reason"],
  ["resumeText", "Resume text", "textarea"],
  ["coverLetter", "Cover letter", "textarea"],
];
const referral: Field[] = [
  ["employee", "Employee name"],
  ["company", "Company"],
  ["role", "Role"],
  ["profileUrl", "Profile URL", "url"],
  [
    "status",
    "Contact status",
    "select",
    ["Identified", "Contacted", "Responded", "Referred", "Declined"],
  ],
  ["followUp", "Follow-up date", "date"],
  ["outcome", "Referral outcome"],
  ["message", "Message sent", "textarea"],
  ["response", "Response", "textarea"],
];
const interview: Field[] = [
  [
    "type",
    "Round type",
    "select",
    [
      "Recruiter screening",
      "Coding assessment",
      "Technical round",
      "System design",
      "Hiring manager",
      "HR discussion",
    ],
  ],
  ["dateTime", "Date and time", "datetime-local"],
  ["interviewer", "Interviewer"],
  ["meetingLink", "Meeting link", "url"],
  [
    "result",
    "Result",
    "select",
    ["Scheduled", "Passed", "Rejected", "Pending", "Cancelled"],
  ],
  ["topics", "Topics", "textarea"],
  ["preparation", "Preparation notes", "textarea"],
  ["questions", "Questions asked", "textarea"],
  ["review", "Performance review", "textarea"],
];
const offer: Field[] = [
  ["base", "Base salary", "number"],
  ["bonus", "Bonus", "number"],
  ["equity", "Equity", "number"],
  ["currency", "Currency (e.g. INR)"],
  ["notes", "Offer notes", "textarea"],
];

function Fields({
  fields,
  values,
  change,
}: {
  fields: Field[];
  values: Record<string, string | undefined>;
  change: (key: string, value: string) => void;
}) {
  return (
    <div className="fields">
      {fields.map(([name, label, type, choices]) => {
        const value = values[name] ?? "";
        const required =
          (["company", "role"].includes(name) && fields === posting) ||
          ["employee", "dateTime"].includes(name);
        return (
          <label key={name} className={type === "textarea" ? "wide" : ""}>
            {label}
            {type === "select" ? (
              <select
                value={value}
                onChange={(e) => change(name, e.target.value)}
              >
                <option value="">Select…</option>
                {choices?.map((choice) => (
                  <option key={choice}>{choice}</option>
                ))}
              </select>
            ) : type === "textarea" ? (
              <textarea
                value={value}
                rows={4}
                onChange={(e) => change(name, e.target.value)}
              />
            ) : (
              <input
                type={type ?? "text"}
                required={required}
                value={value}
                min={type === "number" ? 0 : undefined}
                step={type === "number" ? "any" : undefined}
                onChange={(e) => change(name, e.target.value)}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

function initialFields(job?: Application) {
  const values: Record<string, string> = { stage: job?.stage ?? "Saved" };
  for (const [key] of [...posting, ...application]) {
    const value = job?.[key as keyof Application];
    values[key] = typeof value === "string" ? value : "";
  }
  values.skills = job?.skills?.join(", ") ?? "";
  return values;
}

function localDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function clean(values: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value?.trim()),
  );
}

export function Editor({
  job,
  token,
  close,
  save,
  remove,
}: {
  job?: Application;
  token: string;
  close: () => void;
  save: (body: unknown) => Promise<void>;
  remove: () => Promise<void>;
}) {
  const [values, setValues] = useState(() => initialFields(job));
  const [referrals, setReferrals] = useState(job?.referrals ?? []);
  const [interviews, setInterviews] = useState<Entry[]>(() =>
    (job?.interviews ?? []).map((entry) => ({
      ...entry,
      dateTime: entry.dateTime ? localDateTime(entry.dateTime) : "",
    })),
  );
  const [compensation, setCompensation] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(job?.offer ?? {}).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
  );
  const [match, setMatch] = useState<Match>();
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const change = (key: string, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));
  async function run(action: () => Promise<void>) {
    setPending(true);
    setError("");
    try {
      await action();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const { skills, ...fields } = values;
      const body = {
        ...clean(fields),
        ...(job
          ? {
              version: job.version,
              clear: Object.keys(fields).filter(
                (key) => key !== "stage" && !fields[key].trim(),
              ),
            }
          : {}),
        skills: skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        referrals: referrals.map(clean),
        interviews: interviews.map((entry) => ({
          ...clean(entry),
          dateTime: new Date(entry.dateTime ?? "").toISOString(),
        })),
        ...(compensation.currency
          ? {
              offer: {
                currency: compensation.currency.trim().toUpperCase(),
                ...Object.fromEntries(
                  ["base", "bonus", "equity"]
                    .filter((key) => compensation[key])
                    .map((key) => [key, Number(compensation[key])]),
                ),
                notes: compensation.notes || undefined,
              },
            }
          : job?.offer
            ? { clearOffer: true }
            : {}),
      };
      await save(body);
    });
  }

  return (
    <section className="editor">
      <Button variant="ghost" onPress={close}>
        <ArrowLeft size={16} /> Back to applications
      </Button>
      <div className="editor-heading">
        <div>
          <h1>{job?.role ?? "New application"}</h1>
          {job && <p>{job.company}</p>}
        </div>
        {job?.jobUrl && (
          <a
            className="plain-link"
            href={job.jobUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open posting <ExternalLink size={14} />
          </a>
        )}
      </div>
      <form onSubmit={submit}>
        <section className="editor-section">
          <h2>Job posting</h2>
          <Fields fields={posting} values={values} change={change} />
        </section>
        <section className="editor-section">
          <h2>Application</h2>
          <Fields
            fields={[
              ["stage", "Pipeline stage", "select", [...stages]],
              ...application,
            ]}
            values={values}
            change={change}
          />
        </section>
        <Entries
          title="Referrals"
          addLabel="Add referral"
          entries={referrals}
          setEntries={setReferrals}
          fields={referral}
          defaults={{ status: "Identified" }}
          extra={
            job
              ? (entry) => (
                  <Button
                    type="button"
                    variant="outline"
                    isDisabled={
                      pending ||
                      !job.referrals?.some((saved) => saved.id === entry.id)
                    }
                    onPress={() =>
                      void run(async () => {
                        const result = await api<{ draft: string }>(
                          `/applications/${job._id}/referrals/${entry.id}/draft`,
                          token,
                          "POST",
                        );
                        setDraft(result.draft);
                      })
                    }
                  >
                    Draft message with AI
                  </Button>
                )
              : undefined
          }
        />
        {draft && (
          <section className="editor-section">
            <h2>Referral draft</h2>
            <label>
              Review and edit before sending
              <textarea
                rows={6}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
          </section>
        )}
        <Entries
          title="Interview rounds"
          addLabel="Add round"
          entries={interviews}
          setEntries={setInterviews}
          fields={interview}
          defaults={{
            type: "Recruiter screening",
            result: "Scheduled",
            dateTime: "",
          }}
        />
        <section className="editor-section">
          <h2>Offer</h2>
          <Fields
            fields={offer}
            values={compensation}
            change={(key, value) =>
              setCompensation((previous) => ({ ...previous, [key]: value }))
            }
          />
        </section>
        {job && (
          <section className="editor-section">
            <div className="section-head">
              <h2>Resume match</h2>
              <Button
                variant="outline"
                type="button"
                isDisabled={pending || !job.resumeText || !job.skills?.length}
                onPress={() =>
                  void run(async () =>
                    setMatch(
                      await api(`/applications/${job._id}/match`, token),
                    ),
                  )
                }
              >
                Check saved resume
              </Button>
            </div>
            {!match && (
              <p>Save the required skills and resume text to check coverage.</p>
            )}
            {match && (
              <>
                <p>
                  <strong>{match.score}% coverage</strong> of the required
                  skills.
                </p>
                <p>Required keywords: {match.keywords.join(", ")}</p>
                <dl className="match-list fit-signals">
                  {Object.entries({
                    Location: match.location,
                    Seniority: match.seniority,
                  }).map(([label, signal]) => {
                    if (!signal) return null;
                    return (
                      <div key={label}>
                        <dt>
                          {label}: {signal.target}
                        </dt>
                        <dd>
                          {signal.evidence ??
                            "No explicit evidence in the resume"}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                <ul className="match-list">
                  {match.matches.map((item) => (
                    <li key={item.skill}>
                      <strong>{item.skill}</strong>
                      <span>{item.level}</span>
                      {item.evidence && <small>{item.evidence}</small>}
                    </li>
                  ))}
                </ul>
                {match.preparation.length > 0 && (
                  <p>Topics to prepare: {match.preparation.join(", ")}</p>
                )}
              </>
            )}
          </section>
        )}
        {Boolean(job?.history?.length) && (
          <section className="editor-section">
            <h2>Stage history</h2>
            <ol className="match-list">
              {job?.history.map((event, index) => (
                <li key={index}>
                  <strong>
                    {event.from ? `${event.from} → ${event.to}` : event.to}
                  </strong>
                  <span>{new Date(event.at).toLocaleString()}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="editor-actions">
          <Button type="submit" isDisabled={pending}>
            {pending ? "Working…" : "Save application"}
          </Button>
          <Button type="button" variant="outline" onPress={close}>
            Cancel
          </Button>
          {job && (
            <Button
              type="button"
              variant="ghost"
              isDisabled={pending}
              onPress={() =>
                confirmDelete ? void run(remove) : setConfirmDelete(true)
              }
            >
              {confirmDelete ? "Confirm deletion" : "Delete application"}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}

function Entries({
  title,
  addLabel,
  entries,
  setEntries,
  fields,
  defaults,
  extra,
}: {
  title: string;
  addLabel: string;
  entries: Entry[];
  setEntries: (entries: Entry[]) => void;
  fields: Field[];
  defaults: Record<string, string>;
  extra?: (entry: Entry) => React.ReactNode;
}) {
  return (
    <section className="editor-section">
      <div className="section-head">
        <h2>{title}</h2>
        <Button
          variant="outline"
          type="button"
          onPress={() =>
            setEntries([...entries, { ...defaults, id: crypto.randomUUID() }])
          }
        >
          <Plus size={15} /> {addLabel}
        </Button>
      </div>
      {entries.length === 0 && <p>No {title.toLowerCase()} recorded.</p>}
      {entries.map((entry, index) => (
        <div className="entry" key={entry.id}>
          <div className="section-head">
            <h3>{entry.employee || entry.type || `Referral ${index + 1}`}</h3>
            <Button
              type="button"
              variant="ghost"
              aria-label={`Remove ${entry.employee || entry.type || "referral"}`}
              onPress={() =>
                setEntries(entries.filter((item) => item.id !== entry.id))
              }
            >
              <Trash2 size={15} />
            </Button>
          </div>
          <Fields
            fields={fields}
            values={entry}
            change={(key, value) =>
              setEntries(
                entries.map((item) =>
                  item.id === entry.id ? { ...item, [key]: value } : item,
                ),
              )
            }
          />
          {extra?.(entry)}
        </div>
      ))}
    </section>
  );
}
