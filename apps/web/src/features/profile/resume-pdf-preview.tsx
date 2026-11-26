import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
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
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type PreviewMode = "pdf" | "live";

export function ResumePdfPreview({
  pdfFile,
  candidateName,
  resumeText,
}: {
  pdfFile: File | null;
  candidateName: string;
  resumeText: string;
}) {
  const [mode, setMode] = useState<PreviewMode>(pdfFile ? "pdf" : "live");
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const effectiveMode: PreviewMode = pdfFile ? mode : "live";

  useEffect(() => {
    if (!pdfFile || effectiveMode !== "pdf") return;

    let cancelled = false;
    let destroyTask: (() => Promise<void>) | undefined;

    async function renderPage() {
      setRendering(true);
      setRenderError("");
      try {
        const pdf = await import("pdfjs-dist");
        const worker = await import(
          "pdfjs-dist/build/pdf.worker.min.mjs?url"
        );
        pdf.GlobalWorkerOptions.workerSrc = worker.default;

        const data = await pdfFile!.arrayBuffer();
        const loadingTask = pdf.getDocument({ data });
        destroyTask = () => loadingTask.destroy();
        const doc = await loadingTask.promise;
        if (cancelled) return;

        setNumPages(doc.numPages);
        const clampedPage = Math.min(Math.max(1, pageNumber), doc.numPages);
        if (clampedPage !== pageNumber) {
          setPageNumber(clampedPage);
        }

        const page = await doc.getPage(clampedPage);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const containerWidth = Math.max(
          320,
          (canvas.parentElement?.clientWidth ?? 560) - 24,
        );
        const fitScale = containerWidth / baseViewport.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: fitScale * zoom * dpr });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

        await page.render({ canvas, canvasContext: context, viewport }).promise;
      } catch (error) {
        if (!cancelled) {
          setRenderError(
            error instanceof Error
              ? error.message
              : "Could not render PDF preview.",
          );
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    void renderPage();

    return () => {
      cancelled = true;
      void destroyTask?.();
    };
  }, [pdfFile, effectiveMode, pageNumber, zoom]);

  const paragraphs = resumeText
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  return (
    <CardFrame className="flex flex-col">
      <CardFrameHeader className="flex-wrap gap-2">
        <CardFrameTitle>
          <FileText className="size-3.5" />
          <span>
            {effectiveMode === "pdf" && pdfFile
              ? pdfFile.name
              : "Live Resume Preview"}
          </span>
          {effectiveMode === "pdf" && numPages > 0 && (
            <Badge
              variant="secondary"
              className="h-4.5 rounded-md px-1.5 text-xs tabular-nums"
            >
              Page {pageNumber} / {numPages}
            </Badge>
          )}
        </CardFrameTitle>

        <div className="flex flex-wrap items-center gap-1.5">
          {pdfFile && (
            <ToggleGroup
              aria-label="Preview mode"
              selectionMode="single"
              variant="outline"
              size="sm"
              spacing={0}
              selectedKeys={new Set([effectiveMode])}
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next === "pdf" || next === "live") {
                  setMode(next);
                }
              }}
            >
              <ToggleGroupItem id="pdf">PDF</ToggleGroupItem>
              <ToggleGroupItem id="live">Edited text</ToggleGroupItem>
            </ToggleGroup>
          )}

          {effectiveMode === "pdf" && pdfFile && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                aria-label="Zoom out"
                isDisabled={zoom <= 0.75}
                onPress={() => setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))}
              >
                <ZoomOut className="size-3" />
              </Button>
              <span className="min-w-10 text-center text-xs text-muted-foreground tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                aria-label="Zoom in"
                isDisabled={zoom >= 1.75}
                onPress={() => setZoom((z) => Math.min(1.75, +(z + 0.15).toFixed(2)))}
              >
                <ZoomIn className="size-3" />
              </Button>
              {numPages > 1 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    aria-label="Previous page"
                    isDisabled={pageNumber <= 1}
                    onPress={() => setPageNumber((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    aria-label="Next page"
                    isDisabled={pageNumber >= numPages}
                    onPress={() =>
                      setPageNumber((p) => Math.min(numPages, p + 1))
                    }
                  >
                    <ChevronRight className="size-3" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardFrameHeader>

      <CardFramePanel className="flex min-h-[520px] max-h-[calc(100dvh-11rem)] flex-col overflow-auto bg-muted/25 p-3">
        {effectiveMode === "pdf" && pdfFile ? (
          <div className="relative flex flex-1 flex-col items-center justify-start">
            {rendering && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-card px-2.5 py-1 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Rendering PDF page…
              </div>
            )}
            {renderError ? (
              <div
                role="alert"
                className="w-full rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-medium text-destructive"
              >
                {renderError}
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                aria-label={`PDF preview page ${pageNumber}`}
                className="max-w-full rounded-lg border border-border/80 bg-white shadow-xs"
              />
            )}
          </div>
        ) : resumeText.trim() ? (
          <div className="mx-auto flex w-full max-w-[680px] flex-col gap-3 rounded-xl border border-border/80 bg-card p-6 shadow-2xs">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/70 pb-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  {candidateName.trim() || "Your Resume"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Updates live as you edit on the left · Upload a PDF to view
                  the original pages side by side.
                </p>
              </div>
              <Badge
                variant="secondary"
                className="h-5 rounded-md px-2 text-xs tabular-nums"
              >
                {resumeText.trim().length.toLocaleString()} chars
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5 text-xs leading-relaxed text-foreground/90">
              {paragraphs.map((line, index) =>
                line.trim() ? (
                  <p key={index} className="whitespace-pre-wrap">
                    {line}
                  </p>
                ) : (
                  <div key={index} className="h-2" />
                ),
              )}
            </div>
          </div>
        ) : (
          <Empty className="my-auto py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No PDF or resume preview yet</EmptyTitle>
              <EmptyDescription>
                Upload a PDF resume on the left to inspect its rendered pages
                side by side while editing your extracted profile text.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardFramePanel>
    </CardFrame>
  );
}
