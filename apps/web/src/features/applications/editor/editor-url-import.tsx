import { useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function UrlImportCard({
  setValues,
  pending,
  run,
  token,
}: {
  setValues: Dispatch<SetStateAction<Record<string, string>>>;
  pending: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  token: string;
}) {
  const [importUrl, setImportUrl] = useState("");
  const [importMessage, setImportMessage] = useState("");

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Import from Job URL</CardFrameTitle>
      </CardFrameHeader>
      <CardFramePanel className="flex flex-col gap-2 p-4">
        <Label htmlFor="import-job-url" className="text-xs font-medium">
          Job posting URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="import-job-url"
            type="url"
            placeholder="https://company.com/jobs/…"
            value={importUrl}
            onChange={(event) => setImportUrl(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            isDisabled={pending || !importUrl.trim()}
            onPress={() =>
              void run(async () => {
                setImportMessage("");
                const imported = await api<Record<string, string | undefined>>(
                  "/applications/import",
                  token,
                  "POST",
                  { url: importUrl.trim() },
                );
                setValues((previous) => {
                  const next = { ...previous };
                  for (const [key, value] of Object.entries(imported)) {
                    if (value && !next[key]?.trim()) next[key] = value;
                  }
                  return next;
                });
                setImportMessage(
                  "Posting imported. Review or extract structured details below before saving.",
                );
              })
            }
          >
            Import
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Imports available details into empty fields. Review them before
          saving.
        </p>
        {importMessage && (
          <p role="status" className="text-xs text-muted-foreground">
            {importMessage}
          </p>
        )}
      </CardFramePanel>
    </CardFrame>
  );
}
