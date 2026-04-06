import React, { createContext, useContext } from "react";
import useChecklistData from "../hooks/useChecklistData";

const ChecklistContext = createContext(null);

export function ChecklistProvider({ children }) {
  const checklistData = useChecklistData();

  // Add reorderChecklists function to the provider value
  const value = {
    ...checklistData,
    reorderChecklists: checklistData.reorderChecklists,
    startSchedule: checklistData.startSchedule,
    completeCurrentTask: checklistData.completeCurrentTask,
    getActiveScheduleState: checklistData.getActiveScheduleState,
    resetSchedule: checklistData.resetSchedule,
  };

  return (
    <ChecklistContext.Provider value={value}>
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext);
  if (!ctx)
    throw new Error("useChecklist must be used inside ChecklistProvider");
  return ctx;
}
