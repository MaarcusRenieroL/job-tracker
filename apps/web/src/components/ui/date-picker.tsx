import { parseDate, getLocalTimeZone } from "@internationalized/date";
import { CalendarDays, X } from "lucide-react";
import { Dialog, DialogTrigger, Popover } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export function DatePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  let selected: ReturnType<typeof parseDate> | null = null;
  try { if (value) selected = parseDate(value); } catch { /* Leave invalid input unselected. */ }
  return <div className="flex min-w-0 items-center gap-1">
    <DialogTrigger>
      <Button type="button" variant="outline" size="sm" aria-label={label} className="min-w-36 justify-start bg-background font-normal">
        <CalendarDays className="size-3.5" /> {selected ? selected.toDate(getLocalTimeZone()).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Select date"}
      </Button>
      <Popover placement="bottom start" className="z-50 rounded-xl border bg-popover p-1 shadow-lg"><Dialog aria-label={label} className="outline-none">{({ close }) => <Calendar aria-label={label} value={selected} onChange={(date) => { onChange(date.toString()); close(); }} />}</Dialog></Popover>
    </DialogTrigger>
    {value && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Clear ${label}`} onPress={() => onChange("")}><X className="size-3.5" /></Button>}
  </div>;
}
