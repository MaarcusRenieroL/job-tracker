import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyFeedback(resetMs = 1800) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copyText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, resetMs);
    },
    [resetMs],
  );

  return { copied, copyText };
}
