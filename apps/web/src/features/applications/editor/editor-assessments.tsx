import { useState, type Dispatch, type SetStateAction } from "react";
import { Check, Copy, CornerDownLeft, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { TabsContent } from "@/components/ui/tabs";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { api } from "../../../lib/api";
import type {
  Application,
  Entry,
  InterviewPrep,
} from "../../../types/application";
import { EntryCollection } from "./editor-controls";
import { assessmentFields, interviewFields } from "./editor-fields";

function formatPrepText(prep: InterviewPrep) {
  const topicLines = prep.topics.map(
    (item, idx) => `${idx + 1}. ${item.topic} (${item.source}) — ${item.focus}`,
  );
  const questionLines = prep.questions.map(
    (item, idx) =>
      `${idx + 1}. [${item.category}] ${item.question}\n   Focus: ${item.whyAsked}`,
  );
  return [
    "Suggested Study Topics:",
    ...topicLines,
    "",
    "Practice Questions:",
    ...questionLines,
  ].join("\n");
}

export function EditorAssessments({
  job,
  assessments,
  setAssessments,
  interviews,
  setInterviews,
  prep,
  setPrep,
  pending,
  run,
  token,
}: {
  job?: Application;
  assessments: Entry[];
  setAssessments: Dispatch<SetStateAction<Entry[]>>;
  interviews: Entry[];
  setInterviews: Dispatch<SetStateAction<Entry[]>>;
  prep?: InterviewPrep;
  setPrep: (prep: InterviewPrep) => void;
  pending: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  token: string;
}) {
  const { copied, copyText } = useCopyFeedback();
  const [generatingPrep, setGeneratingPrep] = useState(false);

  const canGeneratePrep = Boolean(
    job &&
      (job.description?.trim() ||
        job.skills?.length ||
        job.responsibilities?.length),
  );

  function applyPrepToRound() {
    if (!prep) return;
    const topicsBlock = prep.topics
      .map((item) => `• ${item.topic} (${item.source}): ${item.focus}`)
      .join("\n");
    const questionsBlock = prep.questions
      .map((item) => `• [${item.category}] ${item.question} — ${item.whyAsked}`)
      .join("\n");

    if (interviews.length === 0) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const localDefault = new Date(
        tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60_000,
      )
        .toISOString()
        .slice(0, 16);
      setInterviews([
        {
          id: crypto.randomUUID(),
          type: "Technical round",
          result: "Scheduled",
          dateTime: localDefault,
          topics: prep.topics.map((t) => t.topic).join(", "),
          preparation: topicsBlock,
          questions: questionsBlock,
        },
      ]);
      return;
    }

    const targetIndex =
      interviews.findIndex((item) => item.result === "Scheduled") !== -1
        ? interviews.findIndex((item) => item.result === "Scheduled")
        : interviews.length - 1;

    setInterviews((previous) =>
      previous.map((item, idx) => {
        if (idx !== targetIndex) return item;
        const nextPrep = item.preparation?.trim()
          ? `${item.preparation.trim()}\n\n${topicsBlock}`
          : topicsBlock;
        const nextQuestions = item.questions?.trim()
          ? `${item.questions.trim()}\n\n${questionsBlock}`
          : questionsBlock;
        return {
          ...item,
          preparation: nextPrep,
          preparationHtml: "",
          questions: nextQuestions,
          questionsHtml: "",
        };
      }),
    );
  }

  return (
    <TabsContent id="assessments" className="flex flex-col gap-5">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>AI Interview Prep</CardFrameTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            {prep && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onPress={() => void copyText(formatPrepText(prep))}
                >
                  {copied ? (
                    <>
                      <Check className="size-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" /> Copy guide
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onPress={applyPrepToRound}
                >
                  <CornerDownLeft className="size-3" />{" "}
                  {interviews.length
                    ? "Insert into round notes"
                    : "Create prep round"}
                </Button>
              </>
            )}
            {job && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                isDisabled={pending || !canGeneratePrep}
                onPress={() =>
                  void run(async () => {
                    setGeneratingPrep(true);
                    try {
                      const result = await api<{ prep: InterviewPrep }>(
                        `/applications/${job._id}/interview-prep`,
                        token,
                        "POST",
                      );
                      setPrep(result.prep);
                    } finally {
                      setGeneratingPrep(false);
                    }
                  })
                }
              >
                {generatingPrep ? (
                  <>
                    <Loader2 className="size-3 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3" /> Generate interview prep
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFrameHeader>
        <CardFramePanel className="p-4">
          {!job ? (
            <p className="text-xs text-muted-foreground">
              Save the application first to generate role-specific practice
              questions and study topics from your saved posting and resume
              gaps.
            </p>
          ) : !prep ? (
            <Empty className="py-6">
              <EmptyHeader>
                <EmptyTitle>Role-specific topics &amp; practice questions</EmptyTitle>
                <EmptyDescription>
                  {canGeneratePrep
                    ? "Generate study priorities and practice questions tailored to your saved job posting and resume skill gaps."
                    : "Save a job description, required skills, or responsibilities in Overview first."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-foreground">
                  Suggested study topics ({prep.topics.length})
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {prep.topics.map((item, idx) => (
                    <div
                      key={`topic-${idx}`}
                      className="flex flex-col gap-1.5 rounded-xl border border-border/80 bg-background p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {item.topic}
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-5 shrink-0 rounded-md px-1.5 text-xs"
                        >
                          {item.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.focus}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-foreground">
                  Practice questions ({prep.questions.length})
                </div>
                <div className="flex flex-col gap-2">
                  {prep.questions.map((item, idx) => (
                    <div
                      key={`question-${idx}`}
                      className="flex flex-col gap-1.5 rounded-xl border border-border/80 bg-background px-3.5 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge
                          variant="secondary"
                          className="h-5 rounded-md px-1.5 text-xs"
                        >
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed text-foreground">
                        {item.question}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Why this comes up: {item.whyAsked}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardFramePanel>
      </CardFrame>

      <EntryCollection
        title="Technical & Online Assessments"
        emptyTitle="No assessments logged"
        emptyDescription="Track coding challenges, online assessments, and take-home repositories with due dates."
        addLabel="Add assessment"
        entries={assessments}
        setEntries={setAssessments}
        fields={assessmentFields}
        idPrefix="assessment"
        defaults={{
          title: "",
          type: "Online assessment",
          status: "Not started",
        }}
      />

      <EntryCollection
        title="Interview Rounds"
        emptyTitle="No interview rounds scheduled"
        emptyDescription="Log recruiter screens, technical rounds, system design sessions, and debrief notes."
        addLabel="Add interview round"
        entries={interviews}
        setEntries={setInterviews}
        fields={interviewFields}
        idPrefix="interview"
        defaults={{
          type: "Recruiter screening",
          result: "Scheduled",
          dateTime: "",
        }}
      />
    </TabsContent>
  );
}
