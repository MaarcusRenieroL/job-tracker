import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../../../lib/api";
import type { Application } from "../../../types/application";
import {
  downloadFile,
  parseImportRecords,
  toCsv,
  toJson,
} from "./application-transfer";

export function ApplicationTransferMenu({
  token,
  jobs,
  onImported,
}: {
  token: string;
  jobs: Application[];
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleImport(file: File) {
    setBusy(true);
    setMessage("");
    try {
      const text = await file.text();
      const records = parseImportRecords(text, file.name);
      const valid = records.filter(
        (record) =>
          typeof record.company === "string" &&
          typeof record.role === "string" &&
          record.company.trim() &&
          record.role.trim(),
      );
      if (!valid.length) {
        setMessage("No valid applications found in the file.");
        return;
      }
      let created = 0;
      const failures: string[] = [];
      for (const record of valid) {
        try {
          await api<Application>("/applications", token, "POST", record);
          created += 1;
        } catch (failure) {
          failures.push(
            failure instanceof Error ? failure.message : "Import failed",
          );
        }
      }
      onImported();
      setMessage(
        failures.length
          ? `Imported ${created} of ${valid.length}. ${failures.length} failed: ${failures[0]}`
          : `Imported ${created} application${created === 1 ? "" : "s"}.`,
      );
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : "Import failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        isDisabled={busy || jobs.length === 0}
        onPress={() => downloadFile("job-tracker.json", toJson(jobs), "application/json")}
      >
        <Download className="size-3.5" /> Export JSON
      </Button>
      <Button
        variant="outline"
        size="sm"
        isDisabled={busy || jobs.length === 0}
        onPress={() => downloadFile("job-tracker.csv", toCsv(jobs), "text/csv")}
      >
        <Download className="size-3.5" /> Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        isDisabled={busy}
        onPress={() => fileRef.current?.click()}
      >
        <Upload className="size-3.5" /> Import
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImport(file);
        }}
      />
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
}
