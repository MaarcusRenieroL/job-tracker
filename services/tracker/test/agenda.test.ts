import assert from "node:assert/strict";
import { test } from "node:test";
import { ObjectId } from "mongodb";
import { applicationAgenda } from "../src/applications/agenda.js";

test("agenda uses inclusive UTC date boundaries and excludes completed work", () => {
  const app: Parameters<typeof applicationAgenda>[0] = {
    _id: new ObjectId(),
    company: "Example",
    role: "Engineer",
    stage: "Saved",
    deadline: "2026-12-01",
    followUp: "2026-12-04",
    interviews: [
      {
        id: "round",
        type: "Technical round",
        result: "Scheduled",
        dateTime: "2026-12-03T00:30:00+05:30",
      },
      {
        id: "cancelled",
        type: "Technical round",
        result: "Cancelled",
        dateTime: "2026-12-02T16:00:00Z",
      },
    ],
    assessments: [
      {
        id: "active",
        title: "Build API",
        type: "Take-home",
        status: "In progress",
        deadline: "2026-12-02",
      },
      {
        id: "submitted",
        title: "Quiz",
        type: "Online assessment",
        status: "Submitted",
        deadline: "2026-12-02",
      },
    ],
    offer: { currency: "USD", deadline: "2026-12-03" },
  };
  const events = applicationAgenda(app, "2026-12-01", "2026-12-03");
  assert.deepEqual(
    events.map(({ kind, date }) => [kind, date]),
    [
      ["application-deadline", "2026-12-01"],
      ["interview", "2026-12-02"],
      ["assessment", "2026-12-02"],
      ["offer-deadline", "2026-12-03"],
    ],
  );
  assert.equal(events[1].dateTime, "2026-12-02T19:00:00.000Z");
  assert.deepEqual(
    applicationAgenda({ ...app, stage: "Withdrawn" }, "2026-12-01"),
    [],
  );
});
