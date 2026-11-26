import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

/** Values remain local wall-clock strings; the application converts them to UTC on save. */
export function DateTimePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [date, time = "09:00"] = value.split("T");
  return <div className="flex flex-wrap items-center gap-2">
    <DatePicker label={`${label} date`} value={date} onChange={(next) => onChange(next ? `${next}T${time || "09:00"}` : "")} />
    <Input aria-label={`${label} time`} type="time" className="w-32 bg-background" value={date ? time : ""} disabled={!date} onChange={(event) => onChange(event.target.value ? `${date}T${event.target.value}` : "")} />
  </div>;
}
