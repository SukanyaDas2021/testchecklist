import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function useChecklistData() {
  const [checklists, setChecklists] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [activeSchedules, setActiveSchedules] = useState({});
  const [savedTasks, setSavedTasks] = useState([]);

  // Load saved checklists on startup
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("checklists");
      if (saved) {
        const parsed = JSON.parse(saved);
        setChecklists(parsed);
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

  // Load saved tasks on startup
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("savedTasks");
      if (saved) {
        setSavedTasks(JSON.parse(saved));
      }
    })();
  }, []);

  // Save saved tasks whenever they change
  useEffect(() => {
    AsyncStorage.setItem("savedTasks", JSON.stringify(savedTasks));
  }, [savedTasks]);

  const getChecklistById = (id) => checklists.find((cl) => cl.id === id);

  const createChecklist = (name, imageUri = null) => {
    const newId = nextId;
    setNextId((prev) => prev + 1);
    setChecklists((prev) => [
      {
        id: newId,
        name: name || "Untitled Checklist",
        items: [],
        image: imageUri,
        order: Date.now(),
      },
      ...prev,
    ]);
  };

  const addItem = (
    checklistId,
    text,
    imageUri,
    savedTaskId = null,
    audioUri = null,
  ) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: [
                ...cl.items,
                {
                  id: Date.now(),
                  text,
                  checked: false,
                  image: imageUri,
                  savedTaskId,
                  audioUri,
                },
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

  const editItem = (
    checklistId,
    itemId,
    newText,
    newImageUri,
    newAudioUri = null,
  ) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      text: newText,
                      image: newImageUri,
                      audioUri: newAudioUri,
                    }
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

  const updateChecklistImage = (checklistId, imageUri) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId ? { ...cl, image: imageUri } : cl,
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

  const getNextActiveTaskIndex = (checklist, currentIndex, disabledTaskIds) => {
    for (let i = currentIndex + 1; i < checklist.items.length; i++) {
      const item = checklist.items[i];
      if (!item.checked && !disabledTaskIds.includes(item.id)) {
        return i;
      }
    }
    return -1;
  };

  const startSchedule = (checklistId) => {
    const checklist = getChecklistById(checklistId);
    if (!checklist || checklist.items.length === 0) return;

    const firstActiveIndex = getNextActiveTaskIndex(checklist, -1, []);

    setActiveSchedules((prev) => ({
      ...prev,
      [checklistId]: {
        isActive: true,
        currentTaskIndex: firstActiveIndex !== -1 ? firstActiveIndex : 0,
        disabledTaskIds: [],
      },
    }));
  };

  const disableTask = (checklistId, taskId) => {
    setActiveSchedules((prev) => {
      const current = prev[checklistId];
      if (!current) return prev;

      return {
        ...prev,
        [checklistId]: {
          ...current,
          disabledTaskIds: [...(current.disabledTaskIds || []), taskId],
        },
      };
    });
  };

  const completeCurrentTask = (checklistId) => {
    const activeState = activeSchedules[checklistId];
    if (!activeState) return false;

    const checklist = getChecklistById(checklistId);
    const currentItem = checklist.items[activeState.currentTaskIndex];

    if (!currentItem.checked) {
      toggleItem(checklistId, currentItem.id);
    }

    const nextIndex = getNextActiveTaskIndex(
      checklist,
      activeState.currentTaskIndex,
      activeState.disabledTaskIds || [],
    );

    if (nextIndex === -1) {
      resetAllTasks(checklistId);

      setActiveSchedules((prev) => {
        const newState = { ...prev };
        delete newState[checklistId];
        return newState;
      });

      return true;
    } else {
      setActiveSchedules((prev) => ({
        ...prev,
        [checklistId]: {
          ...activeState,
          currentTaskIndex: nextIndex,
        },
      }));
      return false;
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

  // Saved Tasks functions
  const saveTask = (text, imageUri, audioUri = null) => {
    const newTask = {
      id: Date.now(),
      text: text.trim(),
      image: imageUri || null,
      audioUri: audioUri || null,
      createdAt: Date.now(),
    };
    setSavedTasks((prev) => [newTask, ...prev]);
    return newTask.id;
  };

  const getSavedTasks = () => {
    return savedTasks;
  };

  const deleteSavedTask = (taskId) => {
    setSavedTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const updateSavedTask = (
    taskId,
    newText,
    newImageUri,
    newAudioUri = null,
  ) => {
    setSavedTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              text: newText.trim(),
              image: newImageUri || null,
              audioUri: newAudioUri || null,
            }
          : task,
      ),
    );
  };

  const isSavedTaskInUse = (savedTaskId) => {
    for (const checklist of checklists) {
      for (const item of checklist.items) {
        if (item.savedTaskId === savedTaskId) {
          return true;
        }
      }
    }
    return false;
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
    updateChecklistImage,
    startSchedule,
    completeCurrentTask,
    getActiveScheduleState,
    resetSchedule,
    disableTask,
    saveTask,
    getSavedTasks,
    deleteSavedTask,
    updateSavedTask,
    isSavedTaskInUse,
  };
}

///////////////////////////////////////////////////////////////
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useEffect, useState } from "react";

// export default function useChecklistData() {
//   const [checklists, setChecklists] = useState([]);
//   const [nextId, setNextId] = useState(1);
//   const [activeSchedules, setActiveSchedules] = useState({});
//   const [savedTasks, setSavedTasks] = useState([]);

//   // Load saved checklists on startup
//   useEffect(() => {
//     (async () => {
//       const saved = await AsyncStorage.getItem("checklists");
//       if (saved) {
//         const parsed = JSON.parse(saved);
//         setChecklists(parsed);
//         const maxId = parsed.reduce((max, cl) => Math.max(max, cl.id), 0);
//         setNextId(maxId + 1);
//       }
//     })();
//   }, []);

//   // Save checklists whenever they change
//   useEffect(() => {
//     AsyncStorage.setItem("checklists", JSON.stringify(checklists));
//   }, [checklists]);

//   // Load active schedules on startup
//   useEffect(() => {
//     (async () => {
//       const saved = await AsyncStorage.getItem("activeSchedules");
//       if (saved) {
//         setActiveSchedules(JSON.parse(saved));
//       }
//     })();
//   }, []);

//   // Save active schedules whenever they change
//   useEffect(() => {
//     AsyncStorage.setItem("activeSchedules", JSON.stringify(activeSchedules));
//   }, [activeSchedules]);

//   // Load saved tasks on startup
//   useEffect(() => {
//     (async () => {
//       const saved = await AsyncStorage.getItem("savedTasks");
//       if (saved) {
//         setSavedTasks(JSON.parse(saved));
//       }
//     })();
//   }, []);

//   // Save saved tasks whenever they change
//   useEffect(() => {
//     AsyncStorage.setItem("savedTasks", JSON.stringify(savedTasks));
//   }, [savedTasks]);

//   const getChecklistById = (id) => checklists.find((cl) => cl.id === id);

//   const createChecklist = (name, imageUri = null) => {
//     const newId = nextId;
//     setNextId((prev) => prev + 1);
//     setChecklists((prev) => [
//       {
//         id: newId,
//         name: name || "Untitled Checklist",
//         items: [],
//         image: imageUri,
//         order: Date.now(),
//       },
//       ...prev,
//     ]);
//   };

//   const addItem = (checklistId, text, imageUri, savedTaskId = null) => {
//     setChecklists((prev) =>
//       prev.map((cl) =>
//         cl.id === checklistId
//           ? {
//               ...cl,
//               items: [
//                 ...cl.items,
//                 {
//                   id: Date.now(),
//                   text,
//                   checked: false,
//                   image: imageUri,
//                   savedTaskId,
//                 },
//               ],
//             }
//           : cl,
//       ),
//     );
//   };

//   const toggleItem = (checklistId, itemId) => {
//     setChecklists((prev) =>
//       prev.map((cl) =>
//         cl.id === checklistId
//           ? {
//               ...cl,
//               items: cl.items.map((item) =>
//                 item.id === itemId ? { ...item, checked: !item.checked } : item,
//               ),
//             }
//           : cl,
//       ),
//     );
//   };

//   const deleteItem = (checklistId, itemId) => {
//     setChecklists((prev) =>
//       prev.map((cl) =>
//         cl.id === checklistId
//           ? { ...cl, items: cl.items.filter((item) => item.id !== itemId) }
//           : cl,
//       ),
//     );
//   };

//   const renameChecklist = (checklistId, newName) => {
//     setChecklists((prev) =>
//       prev.map((cl) => (cl.id === checklistId ? { ...cl, name: newName } : cl)),
//     );
//   };

//   const deleteChecklist = (checklistId) => {
//     setChecklists((prev) => prev.filter((cl) => cl.id !== checklistId));
//   };

//   const reorderChecklists = (newOrder) => {
//     setChecklists(newOrder);
//   };

//   const editItem = (checklistId, itemId, newText, newImageUri) => {
//     setChecklists((prev) =>
//       prev.map((cl) =>
//         cl.id === checklistId
//           ? {
//               ...cl,
//               items: cl.items.map((item) =>
//                 item.id === itemId
//                   ? { ...item, text: newText, image: newImageUri }
//                   : item,
//               ),
//             }
//           : cl,
//       ),
//     );
//   };

//   const reorderItems = (checklistId, newItemsOrder) => {
//     setChecklists((prev) =>
//       prev.map((cl) =>
//         cl.id === checklistId ? { ...cl, items: newItemsOrder } : cl,
//       ),
//     );
//   };

//   const updateChecklistImage = (checklistId, imageUri) => {
//     setChecklists((prev) =>
//       prev.map((cl) =>
//         cl.id === checklistId ? { ...cl, image: imageUri } : cl,
//       ),
//     );
//   };

//   const resetAllTasks = (checklistId) => {
//     setChecklists((prev) =>
//       prev.map((cl) =>
//         cl.id === checklistId
//           ? {
//               ...cl,
//               items: cl.items.map((item) => ({ ...item, checked: false })),
//             }
//           : cl,
//       ),
//     );
//   };

//   const getNextActiveTaskIndex = (checklist, currentIndex, disabledTaskIds) => {
//     for (let i = currentIndex + 1; i < checklist.items.length; i++) {
//       const item = checklist.items[i];
//       if (!item.checked && !disabledTaskIds.includes(item.id)) {
//         return i;
//       }
//     }
//     return -1;
//   };

//   const startSchedule = (checklistId) => {
//     const checklist = getChecklistById(checklistId);
//     if (!checklist || checklist.items.length === 0) return;

//     const firstActiveIndex = getNextActiveTaskIndex(checklist, -1, []);

//     setActiveSchedules((prev) => ({
//       ...prev,
//       [checklistId]: {
//         isActive: true,
//         currentTaskIndex: firstActiveIndex !== -1 ? firstActiveIndex : 0,
//         disabledTaskIds: [],
//       },
//     }));
//   };

//   const disableTask = (checklistId, taskId) => {
//     setActiveSchedules((prev) => {
//       const current = prev[checklistId];
//       if (!current) return prev;

//       return {
//         ...prev,
//         [checklistId]: {
//           ...current,
//           disabledTaskIds: [...(current.disabledTaskIds || []), taskId],
//         },
//       };
//     });
//   };

//   const completeCurrentTask = (checklistId) => {
//     const activeState = activeSchedules[checklistId];
//     if (!activeState) return false;

//     const checklist = getChecklistById(checklistId);
//     const currentItem = checklist.items[activeState.currentTaskIndex];

//     if (!currentItem.checked) {
//       toggleItem(checklistId, currentItem.id);
//     }

//     const nextIndex = getNextActiveTaskIndex(
//       checklist,
//       activeState.currentTaskIndex,
//       activeState.disabledTaskIds || [],
//     );

//     if (nextIndex === -1) {
//       resetAllTasks(checklistId);

//       setActiveSchedules((prev) => {
//         const newState = { ...prev };
//         delete newState[checklistId];
//         return newState;
//       });

//       return true;
//     } else {
//       setActiveSchedules((prev) => ({
//         ...prev,
//         [checklistId]: {
//           ...activeState,
//           currentTaskIndex: nextIndex,
//         },
//       }));
//       return false;
//     }
//   };

//   const getActiveScheduleState = (checklistId) => {
//     return activeSchedules[checklistId] || null;
//   };

//   const resetSchedule = (checklistId) => {
//     setActiveSchedules((prev) => {
//       const newState = { ...prev };
//       delete newState[checklistId];
//       return newState;
//     });
//   };

//   // Saved Tasks functions
//   const saveTask = (text, imageUri) => {
//     const newTask = {
//       id: Date.now(),
//       text: text.trim(),
//       image: imageUri || null,
//       createdAt: Date.now(),
//     };
//     setSavedTasks((prev) => [newTask, ...prev]);
//     return newTask.id;
//   };

//   const getSavedTasks = () => {
//     return savedTasks;
//   };

//   const deleteSavedTask = (taskId) => {
//     setSavedTasks((prev) => prev.filter((task) => task.id !== taskId));
//   };

//   const updateSavedTask = (taskId, newText, newImageUri) => {
//     setSavedTasks((prev) =>
//       prev.map((task) =>
//         task.id === taskId
//           ? { ...task, text: newText.trim(), image: newImageUri || null }
//           : task,
//       ),
//     );
//   };

//   const isSavedTaskInUse = (savedTaskId) => {
//     // Check all checklists for any task that has this savedTaskId
//     for (const checklist of checklists) {
//       for (const item of checklist.items) {
//         if (item.savedTaskId === savedTaskId) {
//           return true;
//         }
//       }
//     }
//     return false;
//   };

//   return {
//     checklists,
//     getChecklistById,
//     createChecklist,
//     addItem,
//     toggleItem,
//     deleteItem,
//     renameChecklist,
//     deleteChecklist,
//     reorderChecklists,
//     editItem,
//     reorderItems,
//     updateChecklistImage,
//     startSchedule,
//     completeCurrentTask,
//     getActiveScheduleState,
//     resetSchedule,
//     disableTask,
//     saveTask,
//     getSavedTasks,
//     deleteSavedTask,
//     updateSavedTask,
//     isSavedTaskInUse,
//   };
// }
