import { useState, type Dispatch, type SetStateAction } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

const importUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a job posting URL.")
    .pipe(
      z
        .url({ protocol: /^https?$/, error: "Enter a valid HTTP or HTTPS URL." })
        .max(2048, "URL is too long."),
    ),
});

type ImportUrlForm = z.infer<typeof importUrlSchema>;

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
  const [importMessage, setImportMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ImportUrlForm>({
    resolver: zodResolver(importUrlSchema),
    mode: "onTouched",
    defaultValues: { url: "" },
  });

  const submitImport = handleSubmit(({ url }) =>
    run(async () => {
      setImportMessage("");
      const imported = await api<Record<string, string | undefined>>(
        "/applications/import",
        token,
        "POST",
        { url },
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
    }),
  );

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
            aria-invalid={!!errors.url}
            {...register("url")}
          />
          <Button
            type="button"
            variant="outline"
            isDisabled={pending}
            onPress={() => void submitImport()}
          >
            Import
          </Button>
        </div>
        {errors.url && (
          <p role="alert" className="text-xs text-destructive">
            {errors.url.message}
          </p>
        )}
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
