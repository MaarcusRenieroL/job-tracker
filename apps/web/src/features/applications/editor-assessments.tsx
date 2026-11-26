import type { Dispatch, SetStateAction } from "react";
import { TabsContent } from "@/components/ui/tabs";
import type { Entry } from "../../types/application";
import { EntryCollection } from "./editor-controls";
import { assessmentFields, interviewFields } from "./editor-fields";

export function EditorAssessments({ assessments, setAssessments, interviews, setInterviews }: { assessments: Entry[]; setAssessments: Dispatch<SetStateAction<Entry[]>>; interviews: Entry[]; setInterviews: Dispatch<SetStateAction<Entry[]>> }) {
  return (
            <TabsContent id="assessments" className="flex flex-col gap-5">
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
