import { createContext, useContext, useState, type ReactNode } from "react";
import { getConfig } from "@/lib/config";

export type ActiveFarm = {
  id: string | null;
  stateCode: string;
};

type ActiveFarmContextValue = {
  activeFarm: ActiveFarm;
  setActiveFarm: (farm: ActiveFarm) => void;
};

const ActiveFarmContext = createContext<ActiveFarmContextValue | null>(null);

/**
 * Holds the farm the operator is currently acting on. `stateCode` defaults to
 * the deployment config; `id` is null until a farm is selected (via FarmPicker).
 * This replaces the previously hardcoded `currentFarmId` / `stateCode` literals.
 */
export function ActiveFarmProvider({ children }: { children: ReactNode }) {
  const [activeFarm, setActiveFarm] = useState<ActiveFarm>(() => ({
    id: null,
    stateCode: getConfig().stateCode,
  }));

  return (
    <ActiveFarmContext.Provider value={{ activeFarm, setActiveFarm }}>
      {children}
    </ActiveFarmContext.Provider>
  );
}

export function useActiveFarm(): ActiveFarmContextValue {
  const context = useContext(ActiveFarmContext);
  if (!context) {
    throw new Error("useActiveFarm must be used within an ActiveFarmProvider");
  }
  return context;
}
