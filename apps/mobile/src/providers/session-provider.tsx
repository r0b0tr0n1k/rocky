import { useMountEffect } from "#/hooks/use-mount-effect.js";
import { authClient } from "#/lib/auth.js";
import { createContext, type ReactNode, useCallback, useContext, } from "react";

type SessionContextType = {
  data: ReturnType<typeof authClient.useSession>["data"] | null;
  isPending: boolean;
  refresh: () => Promise<void>;
  onAuthSuccess: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();

  const refresh = useCallback(async () => {
    await authClient.getSession();
  }, []);

  const onAuthSuccess = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useMountEffect(() => {
    void refresh();
  });

  return (
    <SessionContext.Provider
      value={{
        data: data ?? null,
        isPending,
        refresh,
        onAuthSuccess,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within a SessionProvider");
  return context;
}
