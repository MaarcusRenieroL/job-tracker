import type { Dispatch, SetStateAction } from "react";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { TabsContent } from "@/components/ui/tabs";
import type { Application } from "../../../types/application";
import { FieldGrid } from "./editor-controls";
import { applicationFields, postingFields } from "./editor-fields";
import { editorFieldValues } from "./editor-form";
import { OutreachDraftsCard } from "./editor-outreach-drafts";
import { PostingExtractionCard } from "./editor-posting-extraction";
import { UrlImportCard } from "./editor-url-import";

const detailPostingFields = postingFields.filter(
  (field) => field.name !== "description",
);

export function EditorOverview({
  job,
  values,
  setValues,
  pending,
  run,
  token,
}: {
  job?: Application;
  values: Record<string, string>;
  setValues: Dispatch<SetStateAction<Record<string, string>>>;
  pending: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  token: string;
}) {
  const change = (key: string, value: string, html?: string) =>
    setValues((previous) => ({
      ...previous,
      ...editorFieldValues(key, value, html),
    }));

  return (
    <TabsContent id="overview" className="flex flex-col gap-5">
      {!job && (
        <UrlImportCard
          setValues={setValues}
          pending={pending}
          run={run}
          token={token}
        />
      )}

      <PostingExtractionCard
        values={values}
        setValues={setValues}
        change={change}
        pending={pending}
        run={run}
        token={token}
      />

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Role &amp; Posting Details</CardFrameTitle>
        </CardFrameHeader>
        <CardFramePanel className="p-4">
          <FieldGrid
            fields={detailPostingFields}
            values={values}
            change={change}
            idPrefix="posting"
          />
        </CardFramePanel>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Pipeline &amp; Application Materials</CardFrameTitle>
        </CardFrameHeader>
        <CardFramePanel className="p-4">
          <FieldGrid
            fields={applicationFields}
            values={values}
            change={change}
            idPrefix="application"
          />
        </CardFramePanel>
      </CardFrame>

      <OutreachDraftsCard
        job={job}
        values={values}
        change={change}
        pending={pending}
        run={run}
        token={token}
      />
    </TabsContent>
  );
}
