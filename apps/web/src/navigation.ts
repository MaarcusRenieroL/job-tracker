import { useCallback, useEffect, useState } from "react";

const pages = ["/", "/onboarding", "/settings/profile"] as const;
export type Page = (typeof pages)[number];
export type Navigate = (page: Page, options?: { replace?: boolean }) => void;

export function isPage(path: string): path is Page {
  return pages.some((page) => page === path);
}

export function useNavigation() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const navigate = useCallback<Navigate>((page, { replace = false } = {}) => {
    if (window.location.pathname === page) return;
    if (replace) window.history.replaceState(null, "", page);
    else window.history.pushState(null, "", page);
    setPathname(page);
  }, []);

  useEffect(() => {
    function syncPath() {
      setPathname(window.location.pathname);
    }
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  return { pathname, navigate };
}
