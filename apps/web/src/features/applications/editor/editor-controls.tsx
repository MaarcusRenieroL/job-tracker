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
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { RichTextInput } from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { type Entry, type ResumeVersion, type Stage } from "../../../types/application";

import { editorFieldValues } from "./editor-form";
import { NONE_KEY, type Field } from "./editor-fields";

const CUSTOM_VERSION_KEY = "__custom-resume-version";

function resumeVersionLabel(version: ResumeVersion) {
  return `Resume · ${new Date(version.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function FieldGrid({
  fields,
  values,
  change,
  idPrefix,
  resumeVersions,
  errors,
}: {
  fields: Field[];
  values: Record<string, string | undefined>;
  change: (key: string, value: string, html?: string) => void;
  idPrefix: string;
  resumeVersions?: ResumeVersion[];
  errors?: Record<string, string | undefined>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.name] ?? "";
        const fieldError = errors?.[field.name];
        const inputId = `${idPrefix}-${field.name}`;
        const isRequired =
          (idPrefix === "posting" &&
            (field.name === "company" || field.name === "role")) ||
          field.name === "employee" ||
          field.name === "dateTime" ||
          field.name === "title";
        const savedVersion =
          field.name === "resumeVersion"
            ? resumeVersions?.find(
                (version) => resumeVersionLabel(version) === value,
              )
            : undefined;

        return (
          <div
            key={field.name}
            className={
              field.wide ||
              field.type === "textarea" ||
              field.type === "plain-textarea"
                ? "flex flex-col gap-1.5 sm:col-span-2"
                : "flex flex-col gap-1.5"
            }
          >
            <Label
              htmlFor={field.type === "select" || field.type === "date" || field.type === "datetime-local" ? undefined : inputId}
              className="text-xs font-medium text-foreground/85"
            >
              {field.label}
              {isRequired && <span className="text-destructive">*</span>}
            </Label>

            {field.name === "resumeVersion" && resumeVersions?.length ? (
              <div className="flex flex-col gap-2">
                <Select
                  aria-label={field.label}
                  selectedKey={
                    savedVersion?.id ??
                    (value ? CUSTOM_VERSION_KEY : NONE_KEY)
                  }
                  placeholder="Link a saved resume version…"
                  onSelectionChange={(key) => {
                    if (key === null || key === CUSTOM_VERSION_KEY) return;
                    if (key === NONE_KEY) {
                      change("resumeVersion", "");
                      return;
                    }
                    const version = resumeVersions.find(
                      (item) => item.id === key,
                    );
                    if (!version) return;
                    change("resumeVersion", resumeVersionLabel(version));
                    change(
                      "resumeText",
                      version.resumeText,
                      version.resumeHtml ?? "",
                    );
                  }}
                  className="w-full"
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem id={NONE_KEY} textValue="No linked version">
                      <span className="text-muted-foreground">
                        No linked version
                      </span>
                    </SelectItem>
                    {resumeVersions.map((version) => (
                      <SelectItem
                        key={version.id}
                        id={version.id}
                        textValue={resumeVersionLabel(version)}
                      >
                        {resumeVersionLabel(version)}
                      </SelectItem>
                    ))}
                    {value && !savedVersion && (
                      <SelectItem
                        id={CUSTOM_VERSION_KEY}
                        textValue={`Custom · ${value}`}
                      >
                        Custom · {value}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  id={inputId}
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    change(field.name, event.target.value)
                  }
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Selecting a saved version also loads its resume text into this
                  application.
                </p>
              </div>
            ) : field.type === "select" ? (
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
            ) : field.type === "datetime-local" ? (
              <DateTimePicker label={field.label} value={value} onChange={(date) => change(field.name, date)} />
            ) : field.type === "date" ? (
              <DatePicker label={field.label} value={value} onChange={(date) => change(field.name, date)} />
            ) : field.type === "textarea" ? (
              <RichTextInput
                id={inputId}
                label={field.label}
                text={value}
                html={values[`${field.name}Html`]}
                placeholder={field.placeholder}
                onChange={(text, html) => change(field.name, text, html)}
              />
            ) : field.type === "plain-textarea" ? (
              <Textarea
                id={inputId}
                value={value}
                placeholder={field.placeholder}
                aria-invalid={Boolean(fieldError)}
                onChange={(e) => change(field.name, e.target.value)}
                className="min-h-20 bg-background"
              />
            ) : (
              <Input
                id={inputId}
                type={field.type ?? "text"}
                required={isRequired}
                value={value}
                placeholder={field.placeholder}
                aria-invalid={Boolean(fieldError)}
                min={field.type === "number" ? 0 : undefined}
                step={field.type === "number" ? "any" : undefined}
                onChange={(e) => change(field.name, e.target.value)}
                className="bg-background"
              />
            )}
            {fieldError && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {fieldError}
              </p>
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
  errors,
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
  errors?: Array<Record<string, string | undefined>>;
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
              const entryErrors = errors?.[index];
              const hasEntryError = Boolean(
                entryErrors && Object.keys(entryErrors).length > 0,
              );
              return (
                <div
                  key={entry.id}
                  className={`flex flex-col gap-3.5 rounded-xl border bg-muted/25 p-4 ${
                    hasEntryError ? "border-destructive/60" : "border-border/80"
                  }`}
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
                    errors={entryErrors}
                    idPrefix={`${idPrefix}-${entry.id}`}
                    change={(key, value, html) =>
                      setEntries(
                        entries.map((item) =>
                          item.id === entry.id
                            ? { ...item, ...editorFieldValues(key, value, html) }
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
