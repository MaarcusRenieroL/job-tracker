import {
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import type { Application, Stage } from "@/types/application";
import type { EditorTab } from "../applications/editor";
import { ApplicationCards } from "./application-cards";
import { ApplicationTable } from "./application-table";

export function ApplicationLedger({
  visible,
  openEditor,
  openApplicationById,
  move,
  deleteJob,
}: {
  visible: Application[];
  openEditor: (job: Application, tab?: EditorTab) => void;
  openApplicationById: (id: string) => void;
  move: (job: Application, stage: Stage) => Promise<void>;
  deleteJob: (job: Application) => Promise<void>;
}) {
  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Pipeline Ledger</CardFrameTitle>
        <CardFrameDescription>
          Click any role to open the inspector sheet
        </CardFrameDescription>
      </CardFrameHeader>
      <CardFramePanel>
        <ApplicationCards
          visible={visible}
          openEditor={openEditor}
          move={move}
          deleteJob={deleteJob}
        />
        <ApplicationTable
          visible={visible}
          openEditor={openEditor}
          openApplicationById={openApplicationById}
          move={move}
          deleteJob={deleteJob}
        />
      </CardFramePanel>
    </CardFrame>
  );
}
