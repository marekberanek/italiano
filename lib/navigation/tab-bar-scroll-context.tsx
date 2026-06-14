import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type TabBarScrollContextValue = {
  compact: boolean;
  setCompact: (compact: boolean) => void;
};

const noop = () => undefined;

const TabBarScrollContext = createContext<TabBarScrollContextValue>({
  compact: false,
  setCompact: noop,
});

export function TabBarScrollProvider({ children }: { children: ReactNode }) {
  const [compact, setCompactState] = useState(false);

  const setCompact = useCallback((next: boolean) => {
    setCompactState((current) => (current === next ? current : next));
  }, []);

  const value = useMemo(() => ({ compact, setCompact }), [compact, setCompact]);

  return <TabBarScrollContext.Provider value={value}>{children}</TabBarScrollContext.Provider>;
}

export function useTabBarScroll() {
  return useContext(TabBarScrollContext);
}
