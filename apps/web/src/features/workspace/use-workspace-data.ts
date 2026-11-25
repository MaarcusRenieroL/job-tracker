import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type {
  AgendaEvent,
  Application,
  OfferRow,
  Stage,
} from "../../types/application";

export function useWorkspaceData(token: string, from: string, to: string) {
  const [jobs, setJobs] = useState<Application[]>([]);
  const [agenda, setAgenda] = useState<AgendaEvent[]>([]);
  const [offerRows, setOfferRows] = useState<OfferRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    api<{ applications: Application[] }>("/applications", token)
      .then(({ applications }) => {
        if (active) setJobs(applications);
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
  }, [token]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    Promise.allSettled([
      api<{ events: AgendaEvent[] }>(
        `/applications/agenda${query ? `?${query}` : ""}`,
        token,
      ),
      api<{ offers: OfferRow[] }>("/applications/offers", token),
    ]).then(([agendaResult, offersResult]) => {
      if (!active) return;
      if (agendaResult.status === "fulfilled")
        setAgenda(agendaResult.value.events);
      else
        setError(
          agendaResult.reason instanceof Error
            ? agendaResult.reason.message
            : "Could not load agenda.",
        );
      if (offersResult.status === "fulfilled")
        setOfferRows(offersResult.value.offers);
      else
        setError(
          offersResult.reason instanceof Error
            ? offersResult.reason.message
            : "Could not load offers.",
        );
    });
    return () => {
      active = false;
    };
  }, [token, from, to, revision]);

  function replace(job: Application) {
    setJobs((previous) => [
      job,
      ...previous.filter((item) => item._id !== job._id),
    ]);
    setRevision((previous) => previous + 1);
  }

  async function move(job: Application, next: Stage) {
    if (job.stage === next) return;
    setError("");
    try {
      replace(
        await api<Application>(`/applications/${job._id}`, token, "PATCH", {
          stage: next,
          version: job.version,
        }),
      );
    } catch (failure) {
      setError((failure as Error).message);
      try {
        const fresh = await api<{ applications: Application[] }>(
          "/applications",
          token,
        );
        setJobs(fresh.applications);
      } catch {
        // Keep the original error visible if refreshing also fails.
      }
    }
  }

  async function deleteJob(job: Application) {
    setError("");
    try {
      await api(`/applications/${job._id}`, token, "DELETE");
      setJobs((previous) => previous.filter((item) => item._id !== job._id));
      setRevision((previous) => previous + 1);
    } catch (failure) {
      setError((failure as Error).message);
    }
  }

  return { jobs, agenda, offerRows, error, loading, replace, move, deleteJob };
}
