import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SLOT_MINUTES = 15;

function slotLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const slots = Array.from(
  { length: (24 * 60) / SLOT_MINUTES },
  (_, index) => {
    const total = index * SLOT_MINUTES;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  },
);

/** Non-native time picker: a searchable list of quarter-hour slots. */
export function TimePicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const options = value && !slots.includes(value) ? [...slots, value] : slots;

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Select
        aria-label={label}
        selectedKey={value || null}
        isDisabled={disabled}
        placeholder="Select time"
        onSelectionChange={(key) => {
          if (key === null) return;
          onChange(String(key));
        }}
        className="w-36"
      >
        <SelectTrigger className="w-full bg-background font-normal">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Clock className="size-3.5 shrink-0 text-muted-foreground" />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map((slot) => (
            <SelectItem key={slot} id={slot} textValue={slotLabel(slot)}>
              <span className="tabular-nums">{slotLabel(slot)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Clear ${label}`}
          onPress={() => onChange("")}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
