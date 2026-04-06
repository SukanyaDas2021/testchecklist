import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function useChecklistData() {
  const [checklists, setChecklists] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [activeSchedules, setActiveSchedules] = useState({});

  // Load saved checklists on startup
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("checklists");
      if (saved) {
        const parsed = JSON.parse(saved);
        setChecklists(parsed);
        // ensure nextId continues from last
        const maxId = parsed.reduce((max, cl) => Math.max(max, cl.id), 0);
        setNextId(maxId + 1);
      }
    })();
  }, []);

  // Save checklists whenever they change
  useEffect(() => {
    AsyncStorage.setItem("checklists", JSON.stringify(checklists));
  }, [checklists]);

  // Load active schedules on startup
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("activeSchedules");
      if (saved) {
        setActiveSchedules(JSON.parse(saved));
      }
    })();
  }, []);

  // Save active schedules whenever they change
  useEffect(() => {
    AsyncStorage.setItem("activeSchedules", JSON.stringify(activeSchedules));
  }, [activeSchedules]);

  const getChecklistById = (id) => checklists.find((cl) => cl.id === id);

  const createChecklist = (name) => {
    const newId = nextId;
    setNextId((prev) => prev + 1);
    setChecklists((prev) => [
      {
        id: newId,
        name: name || "Untitled Checklist",
        items: [],
        order: Date.now(),
      },
      ...prev,
    ]);
  };

  const addItem = (checklistId, text, imageUri) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: [
                ...cl.items,
                { id: Date.now(), text, checked: false, image: imageUri },
              ],
            }
          : cl,
      ),
    );
  };

  const toggleItem = (checklistId, itemId) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item,
              ),
            }
          : cl,
      ),
    );
  };

  const deleteItem = (checklistId, itemId) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: cl.items.filter((item) => item.id !== itemId) }
          : cl,
      ),
    );
  };

  const renameChecklist = (checklistId, newName) => {
    setChecklists((prev) =>
      prev.map((cl) => (cl.id === checklistId ? { ...cl, name: newName } : cl)),
    );
  };

  const deleteChecklist = (checklistId) => {
    setChecklists((prev) => prev.filter((cl) => cl.id !== checklistId));
  };

  const reorderChecklists = (newOrder) => {
    setChecklists(newOrder);
  };

  const editItem = (checklistId, itemId, newText, newImageUri) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((item) =>
                item.id === itemId
                  ? { ...item, text: newText, image: newImageUri }
                  : item,
              ),
            }
          : cl,
      ),
    );
  };

  const reorderItems = (checklistId, newItemsOrder) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId ? { ...cl, items: newItemsOrder } : cl,
      ),
    );
  };

  const resetAllTasks = (checklistId) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((item) => ({ ...item, checked: false })),
            }
          : cl,
      ),
    );
  };

  const startSchedule = (checklistId) => {
    const checklist = getChecklistById(checklistId);
    if (!checklist || checklist.items.length === 0) return;

    setActiveSchedules((prev) => ({
      ...prev,
      [checklistId]: {
        isActive: true,
        currentTaskIndex: 0,
      },
    }));
  };

  const completeCurrentTask = (checklistId) => {
    const activeState = activeSchedules[checklistId];
    if (!activeState) return false;

    const checklist = getChecklistById(checklistId);
    const currentItem = checklist.items[activeState.currentTaskIndex];

    // Check off the current task
    toggleItem(checklistId, currentItem.id);

    // Move to next task
    const nextIndex = activeState.currentTaskIndex + 1;

    if (nextIndex >= checklist.items.length) {
      // Schedule completed - reset all tasks to unchecked
      resetAllTasks(checklistId);

      // Delete active state
      setActiveSchedules((prev) => {
        const newState = { ...prev };
        delete newState[checklistId];
        return newState;
      });

      return true; // Return true indicating schedule completed
    } else {
      // Move to next task
      setActiveSchedules((prev) => ({
        ...prev,
        [checklistId]: {
          isActive: true,
          currentTaskIndex: nextIndex,
        },
      }));
      return false; // Return false indicating not completed yet
    }
  };

  const getActiveScheduleState = (checklistId) => {
    return activeSchedules[checklistId] || null;
  };

  const resetSchedule = (checklistId) => {
    setActiveSchedules((prev) => {
      const newState = { ...prev };
      delete newState[checklistId];
      return newState;
    });
  };

  return {
    checklists,
    getChecklistById,
    createChecklist,
    addItem,
    toggleItem,
    deleteItem,
    renameChecklist,
    deleteChecklist,
    reorderChecklists,
    editItem,
    reorderItems,
    startSchedule,
    completeCurrentTask,
    getActiveScheduleState,
    resetSchedule,
  };
}
