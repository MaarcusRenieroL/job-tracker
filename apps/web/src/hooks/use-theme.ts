import { useCallback, useEffect, useState } from "react";

export function useTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const preference = matchMedia("(prefers-color-scheme: dark)");
    const sync = (event: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem("job-tracker-theme")) return;
      } catch {}
      document.documentElement.classList.toggle("dark", event.matches);
      setDark(event.matches);
    };
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem("job-tracker-theme", next ? "dark" : "light");
      } catch {}
      return next;
    });
  }, []);

  return { dark, toggle };
}
