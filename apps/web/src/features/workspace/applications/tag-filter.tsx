import { useState } from "react";
import { Dialog, DialogTrigger, Popover } from "react-aria-components";
import { Check, ChevronsUpDown, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TagFilter({ tags, selected, onChange }: {
  tags: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const matching = tags.filter((tag) => tag.toLowerCase().includes(query.toLowerCase().trim()));
  return (
    <DialogTrigger>
      <Button variant="outline" size="sm" aria-label="Filter by tags">
        <Tag className="size-3.5" /> {selected.length ? `${selected.length} selected` : "All tags"}
        <ChevronsUpDown className="size-3.5 opacity-60" />
      </Button>
      <Popover placement="bottom start" className="z-50 w-64 rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">
        <Dialog aria-label="Filter by tags" className="outline-none">
          <Input aria-label="Search tags" placeholder="Search tags…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-2 max-h-52 overflow-y-auto" role="group" aria-label="Tags">
            {matching.map((tag) => {
              const active = selected.includes(tag);
              return <button key={tag} type="button" role="checkbox" aria-checked={active} onClick={() => onChange(active ? selected.filter((item) => item !== tag) : [...selected, tag])} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><span className="flex size-4 items-center justify-center rounded border">{active && <Check className="size-3" />}</span><span className="truncate">{tag}</span></button>;
            })}
            {!matching.length && <p className="px-2 py-3 text-sm text-muted-foreground">No matching tags.</p>}
          </div>
          {selected.length > 0 && <Button variant="ghost" size="sm" className="mt-1 w-full" onPress={() => onChange([])}>Clear selection</Button>}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
