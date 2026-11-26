export async function readResume(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Choose a file smaller than 5 MB.");
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "txt") return file.text();
  if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value;
  }
  if (extension === "pdf") {
    const pdf = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdf.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdf.getDocument({ data: await file.arrayBuffer() });
    const document = await task.promise;
    try {
      const pages: string[] = [];
      for (let number = 1; number <= document.numPages; number++) {
        const content = await (await document.getPage(number)).getTextContent();
        pages.push(
          content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" "),
        );
      }
      return pages.join("\n");
    } finally {
      await task.destroy();
    }
  }
  throw new Error("Choose a PDF, DOCX, or TXT file.");
}
