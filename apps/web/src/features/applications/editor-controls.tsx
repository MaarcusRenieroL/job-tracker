import { StageDot } from "@/components/status-badges";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { type Entry, type Stage } from "../../types/application";

import { NONE_KEY, type Field } from "./editor-fields";

export function FieldGrid({
  fields,
  values,
  change,
  idPrefix,
}: {
  fields: Field[];
  values: Record<string, string | undefined>;
  change: (key: string, value: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.name] ?? "";
        const inputId = `${idPrefix}-${field.name}`;
        const isRequired =
          (idPrefix === "posting" &&
            (field.name === "company" || field.name === "role")) ||
          field.name === "employee" ||
          field.name === "dateTime" ||
          field.name === "title";

        return (
          <div
            key={field.name}
            className={
              field.wide || field.type === "textarea"
                ? "flex flex-col gap-1.5 sm:col-span-2"
                : "flex flex-col gap-1.5"
            }
          >
            <Label
              htmlFor={field.type === "select" ? undefined : inputId}
              className="text-xs font-medium text-foreground/85"
            >
              {field.label}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>

            {field.type === "select" ? (
              <Select
                aria-label={field.label}
                selectedKey={value ? value : field.allowClear ? NONE_KEY : null}
                placeholder="Select..."
                onSelectionChange={(key) => {
                  if (key === null) return;
                  change(field.name, key === NONE_KEY ? "" : String(key));
                }}
                className="w-full"
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.allowClear && (
                    <SelectItem id={NONE_KEY} textValue="None">
                      <span className="text-muted-foreground">None</span>
                    </SelectItem>
                  )}
                  {field.choices?.map((choice) => (
                    <SelectItem key={choice} id={choice} textValue={choice}>
                      {field.name === "stage" ? (
                        <span className="inline-flex items-center gap-2">
                          <StageDot stage={choice as Stage} />
                          {choice}
                        </span>
                      ) : (
                        choice
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "textarea" ? (
              <Textarea
                id={inputId}
                value={value}
                rows={3}
                placeholder={field.placeholder}
                onChange={(e) => change(field.name, e.target.value)}
                className="bg-background"
              />
            ) : (
              <Input
                id={inputId}
                type={field.type ?? "text"}
                required={isRequired}
                value={value}
                placeholder={field.placeholder}
                min={field.type === "number" ? 0 : undefined}
                step={field.type === "number" ? "any" : undefined}
                onChange={(e) => change(field.name, e.target.value)}
                className="bg-background"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EntryCollection({
  title,
  emptyTitle,
  emptyDescription,
  addLabel,
  entries,
  setEntries,
  fields,
  idPrefix,
  defaults,
  extra,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  addLabel: string;
  entries: Entry[];
  setEntries: (entries: Entry[]) => void;
  fields: Field[];
  idPrefix: string;
  defaults: Record<string, string>;
  extra?: (entry: Entry) => React.ReactNode;
}) {
  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>
          {title}
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-xs tabular-nums"
          >
            {entries.length}
          </Badge>
        </CardFrameTitle>
        <Button
          variant="outline"
          size="xs"
          type="button"
          onPress={() =>
            setEntries([...entries, { ...defaults, id: crypto.randomUUID() }])
          }
        >
          <Plus className="size-3" /> {addLabel}
        </Button>
      </CardFrameHeader>
      <CardFramePanel className="p-4">
        {entries.length === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map((entry, index) => {
              const heading =
                entry.title ||
                entry.employee ||
                entry.type ||
                `Item ${index + 1}`;
              return (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3.5 rounded-xl border border-border/80 bg-muted/25 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {heading}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${heading}`}
                      onPress={() =>
                        setEntries(
                          entries.filter((item) => item.id !== entry.id),
                        )
                      }
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  <FieldGrid
                    fields={fields}
                    values={entry}
                    idPrefix={`${idPrefix}-${entry.id}`}
                    change={(key, value) =>
                      setEntries(
                        entries.map((item) =>
                          item.id === entry.id
                            ? { ...item, [key]: value }
                            : item,
                        ),
                      )
                    }
                  />
                  {extra?.(entry)}
                </div>
              );
            })}
          </div>
        )}
      </CardFramePanel>
    </CardFrame>
  );
}
