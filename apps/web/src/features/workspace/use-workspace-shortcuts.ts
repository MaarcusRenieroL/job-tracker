import { useEffect } from "react";

export function useWorkspaceShortcuts({
  editorOpen,
  commandOpen,
  onToggleCommand,
  onNewApplication,
}: {
  editorOpen: boolean;
  commandOpen: boolean;
  onToggleCommand: () => void;
  onNewApplication: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onToggleCommand();
        return;
      }

      if (
        event.key.toLowerCase() === "n" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !editorOpen &&
        !commandOpen
      ) {
        const el = event.target as HTMLElement | null;
        if (
          el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT" ||
            el.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        onNewApplication();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandOpen, editorOpen, onNewApplication, onToggleCommand]);
}
