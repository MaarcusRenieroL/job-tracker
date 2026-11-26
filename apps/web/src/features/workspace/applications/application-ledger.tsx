import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplicationTable } from "./use-application-table";
import {
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import type { Application, Stage } from "@/types/application";
import type { EditorTab } from "../../applications/editor/editor-sheet";
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
  const { rows, sorting, setSorting, page, setPage, pageCount } = useApplicationTable(visible);
  const sortValue = sorting.length ? `${sorting[0].id}-${sorting[0].desc ? "desc" : "asc"}` : "default";
  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Pipeline Ledger</CardFrameTitle>
        <CardFrameDescription>
          Select an application to open its details
        </CardFrameDescription>
      </CardFrameHeader>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <span className="text-xs text-muted-foreground">{visible.length} matching applications</span>
        <Select aria-label="Sort applications" selectedKey={sortValue} onSelectionChange={(key) => { if (key === "default") setSorting([]); else if (key) { const [id, direction] = String(key).split("-"); if (id === "role" || id === "company" || id === "stage" || id === "priority" || id === "location") setSorting([{ id, desc: direction === "desc" }]); } setPage(0); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem id="default">Default order</SelectItem><SelectItem id="role-asc">Role A–Z</SelectItem><SelectItem id="role-desc">Role Z–A</SelectItem><SelectItem id="company-asc">Company A–Z</SelectItem><SelectItem id="company-desc">Company Z–A</SelectItem><SelectItem id="stage-asc">Stage A–Z</SelectItem><SelectItem id="priority-asc">Priority A–Z</SelectItem><SelectItem id="location-asc">Location A–Z</SelectItem></SelectContent>
        </Select>
      </div>
      <CardFramePanel>
        <ApplicationCards
          visible={rows}
          openEditor={openEditor}
          move={move}
          deleteJob={deleteJob}
        />
        <ApplicationTable
          visible={rows}
          openEditor={openEditor}
          openApplicationById={openApplicationById}
          move={move}
          deleteJob={deleteJob}
        />
      </CardFramePanel>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground"><span>Page {page + 1} of {pageCount}</span><div className="flex gap-2"><Button variant="outline" size="xs" isDisabled={page === 0} onPress={() => setPage(page - 1)}>Previous</Button><Button variant="outline" size="xs" isDisabled={page + 1 >= pageCount} onPress={() => setPage(page + 1)}>Next</Button></div></div>
    </CardFrame>
  );
}
