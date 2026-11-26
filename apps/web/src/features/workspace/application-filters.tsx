import { StageDot } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Columns3,
  List,
  RotateCcw,
  Search,
} from "lucide-react";
import { priorities, stages, type Priority } from "../../types/application";
import { TagFilter } from "./tag-filter";

const ALL_FILTER = "__all__";

export function ApplicationFilters({
  query,
  setQuery,
  stage,
  setStage,
  priorityFilter,
  setPriorityFilter,
  tagFilter,
  setTagFilter,
  allTags,
  total,
  hasFilters,
  resetFilters,
  view,
  setView,
  showAllBoardStages,
  toggleBoardStages,
}: {
  query: string;
  setQuery: (value: string) => void;
  stage: string;
  setStage: (value: string) => void;
  priorityFilter: Priority | "";
  setPriorityFilter: (value: Priority | "") => void;
  tagFilter: string[];
  setTagFilter: (value: string[]) => void;
  allTags: string[];
  total: number;
  hasFilters: boolean;
  resetFilters: () => void;
  view: "list" | "board";
  setView: (value: "list" | "board") => void;
  showAllBoardStages: boolean;
  toggleBoardStages: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="h-8 w-full bg-card sm:w-72">
          <InputGroupAddon>
            <Search className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search applications"
            placeholder="Filter role, company, skill, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>

        <Select
          aria-label="Filter by stage"
          selectedKey={stage || ALL_FILTER}
          onSelectionChange={(key) => {
            if (key === null) return;
            setStage(key === ALL_FILTER ? "" : String(key));
          }}
          className="min-w-0 flex-1 sm:w-44 sm:flex-none"
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              id={ALL_FILTER}
              textValue={`All stages (${total})`}
            >
              All stages ({total})
            </SelectItem>
            {stages.map((value) => (
              <SelectItem key={value} id={value} textValue={value}>
                <span className="inline-flex items-center gap-2">
                  <StageDot stage={value} />
                  {value}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          aria-label="Filter by priority"
          selectedKey={priorityFilter || ALL_FILTER}
          onSelectionChange={(key) => {
            if (key === null) return;
            setPriorityFilter(
              key === ALL_FILTER ? "" : (String(key) as Priority),
            );
          }}
          className="min-w-0 flex-1 sm:w-36 sm:flex-none"
        >
          <SelectTrigger className="w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem id={ALL_FILTER} textValue="All priorities">
              All priorities
            </SelectItem>
            {priorities.map((prio) => (
              <SelectItem key={prio} id={prio} textValue={prio}>
                {prio} priority
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onPress={resetFilters}
          >
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        )}

        <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
          {view === "board" && !stage && (
            <Button
              variant="outline"
              size="sm"
              onPress={toggleBoardStages}
            >
              {showAllBoardStages
                ? "Active stages only"
                : "All 11 stages"}
            </Button>
          )}

          <ToggleGroup
            aria-label="Pipeline view mode"
            selectionMode="single"
            variant="outline"
            size="sm"
            spacing={0}
            selectedKeys={new Set([view])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next === "list" || next === "board") {
                setView(next);
              }
            }}
            className="ml-auto sm:ml-0"
          >
            <ToggleGroupItem id="list" aria-label="Table view">
              <List className="size-3.5" />
              <span>Table</span>
            </ToggleGroupItem>
            <ToggleGroupItem id="board" aria-label="Board view">
              <Columns3 className="size-3.5" />
              <span>Board</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {allTags.length > 0 && (
        <TagFilter tags={allTags} selected={tagFilter} onChange={setTagFilter} />
      )}
    </div>
  );
}
