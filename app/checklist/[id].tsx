import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useChecklist } from "../../context/ChecklistProvider";
import { styles } from "./styles";

const Checkbox = ({ checked, onPress, disabled }) => (
  <TouchableOpacity
    onPress={disabled ? null : onPress}
    style={{ marginLeft: "auto" }}
  >
    <Icon
      name={checked ? "check-box" : "check-box-outline-blank"}
      size={24}
      color={disabled ? "#ccc" : "#76088b"}
    />
  </TouchableOpacity>
);

export default function ChecklistDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const mode =
    typeof params.mode === "string" ? params.mode : params.mode?.[0] || "view";
  const ongoing =
    typeof params.ongoing === "string" ? params.ongoing : params.ongoing?.[0];

  const numericId = Number(id);
  const isEditMode = mode === "edit";
  const isOngoingEdit = isEditMode && ongoing === "true";
  const isNormalEdit = isEditMode && !isOngoingEdit;

  const {
    getChecklistById,
    addItem,
    toggleItem,
    deleteItem,
    editItem,
    reorderItems,
    updateChecklistImage,
    startSchedule,
    completeCurrentTask,
    getActiveScheduleState,
    disableTask,
    saveTask,
    getSavedTasks,
    deleteSavedTask,
  } = useChecklist();

  const checklist = getChecklistById(numericId);

  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editImageUri, setEditImageUri] = useState(null);
  const [activeState, setActiveState] = useState(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [checklistImageUri, setChecklistImageUri] = useState<string | null>(
    checklist?.image || null,
  );
  const [checklistImageModalVisible, setChecklistImageModalVisible] =
    useState(false);

  // Temporary state for ongoing edit changes
  const [tempDisabledTaskIds, setTempDisabledTaskIds] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Saved tasks state
  const [showSavedTasksModal, setShowSavedTasksModal] = useState(false);
  const [showSaveTaskDialog, setShowSaveTaskDialog] = useState(false);
  const [pendingNewTask, setPendingNewTask] = useState(null);

  useEffect(() => {
    if (checklist) {
      const state = getActiveScheduleState(checklist.id);
      setActiveState(state);
      // Initialize temp disabled tasks with current disabled tasks when entering ongoing edit
      if (isOngoingEdit && state) {
        setTempDisabledTaskIds(state.disabledTaskIds || []);
      }
    }
  }, [checklist, getActiveScheduleState, isOngoingEdit]);

  if (!checklist) {
    return (
      <View style={styles.container}>
        <Text>Schedule not found.</Text>
      </View>
    );
  }

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleEditPickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setEditImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImageInEdit = () => {
    setEditImageUri(null);
  };

  const handlePickChecklistImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setChecklistImageUri(result.assets[0].uri);
      updateChecklistImage(checklist.id, result.assets[0].uri);
    }
  };

  const handleRemoveChecklistImage = () => {
    setChecklistImageUri(null);
    updateChecklistImage(checklist.id, null);
  };

  const handleAddTask = () => {
    if (newTask.trim().length === 0) return;

    // Add task to checklist first
    addItem(checklist.id, newTask.trim(), imageUri);

    // Show confirmation dialog to save for future
    Alert.alert(
      "Save Task",
      "Do you want to save this task for future reference?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            saveTask(newTask.trim(), imageUri);
          },
        },
      ],
    );

    // Reset modal state
    setNewTask("");
    setImageUri(null);
    setModalVisible(false);
  };

  const handleEditTask = () => {
    if (editTaskText.trim().length === 0) return;
    editItem(checklist.id, editingTask.id, editTaskText.trim(), editImageUri);
    setEditModalVisible(false);
    setEditingTask(null);
    setEditTaskText("");
    setEditImageUri(null);
  };

  const handleDeleteTask = (itemId, taskText) => {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${taskText}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => deleteItem(checklist.id, itemId),
          style: "destructive",
        },
      ],
    );
  };

  const handleDragEnd = ({ data }) => {
    reorderItems(checklist.id, data);
    setDragging(false);
  };

  const openEditModal = (item) => {
    setEditingTask(item);
    setEditTaskText(item.text);
    setEditImageUri(item.image);
    setEditModalVisible(true);
  };

  const handleCompleteTask = () => {
    const completed = completeCurrentTask(checklist.id);
    const newState = getActiveScheduleState(checklist.id);
    setActiveState(newState);

    if (completed) {
      setShowCongrats(true);
      setTimeout(() => {
        setShowCongrats(false);
        router.push("/");
      }, 2000);
    }
  };

  const handleEditButtonPress = () => {
    Alert.alert(
      "Edit Ongoing Schedule",
      "Are you sure you want to edit an ongoing schedule?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () =>
            router.push(`/checklist/${checklist.id}?mode=edit&ongoing=true`),
        },
      ],
    );
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Stay", style: "cancel" },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => {
              setTempDisabledTaskIds([]);
              setHasUnsavedChanges(false);
              router.back(); //router.replace(`/checklist/${checklist.id}?mode=view`);
            },
          },
        ],
      );
    } else {
      router.back(); //router.replace(`/checklist/${checklist.id}?mode=view`);
    }
  };

  const handleSubmitChanges = () => {
    Alert.alert(
      "Confirm Changes",
      "Are you sure you want to apply these changes to the ongoing schedule?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            const originalDisabledIds = activeState?.disabledTaskIds || [];
            const newDisabledIds = tempDisabledTaskIds.filter(
              (id) => !originalDisabledIds.includes(id),
            );

            newDisabledIds.forEach((taskId) => {
              disableTask(checklist.id, taskId);
            });

            setHasUnsavedChanges(false);
            router.back(); // Go back to the original view mode screen
          },
        },
      ],
    );
  };

  const handleCancelTask = (taskId) => {
    // Update temp state instead of actual state
    if (!tempDisabledTaskIds.includes(taskId)) {
      setTempDisabledTaskIds([...tempDisabledTaskIds, taskId]);
      setHasUnsavedChanges(true);
    }
  };

  const isTaskDisabled = (taskId) => {
    // Check temp state during ongoing edit, otherwise check actual state
    if (isOngoingEdit) {
      return tempDisabledTaskIds.includes(taskId);
    }
    return activeState?.disabledTaskIds?.includes(taskId) || false;
  };

  const shouldShowCancelIcon = (item, index) => {
    if (!isOngoingEdit) return false;
    if (item.checked) return false;
    if (isTaskDisabled(item.id)) return false;
    if (index <= activeState?.currentTaskIndex) return false;
    return true;
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.leftContainer}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButtonLeft}
          >
            <Icon name="arrow-back" size={24} color="#76088b" />
          </TouchableOpacity>
        </View>
        <View style={styles.titleContainer}>
          {isNormalEdit && (
            <TouchableOpacity
              onPress={() => setChecklistImageModalVisible(true)}
              style={styles.editImageButton}
            >
              <Icon name="edit" size={20} color="#76088b" />
            </TouchableOpacity>
          )}
          {checklist?.image && (
            <Image
              source={{ uri: checklist.image }}
              style={styles.headerImage}
            />
          )}
          <Text style={styles.title}>{checklist.name}</Text>
        </View>
        <View style={styles.rightContainer}>
          {isNormalEdit ? (
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => {
                Alert.alert("Add Task", "Choose an option", [
                  {
                    text: "Add New Task",
                    onPress: () => setModalVisible(true),
                  },
                  {
                    text: "Add from Saved Tasks",
                    onPress: () => setShowSavedTasksModal(true),
                  },
                  { text: "Cancel", style: "cancel" },
                ]);
              }}
            >
              <Text style={styles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>
          ) : !activeState?.isActive ? (
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => {
                startSchedule(checklist.id);
                setActiveState(getActiveScheduleState(checklist.id));
              }}
            >
              <Text style={styles.addTaskButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={handleEditButtonPress}
            >
              <Text style={styles.addTaskButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {checklist.items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tasks yet</Text>
        </View>
      ) : isNormalEdit ? (
        // NORMAL EDIT MODE - Drag, edit, delete tasks
        <DraggableFlatList
          data={checklist.items}
          keyExtractor={(item) => item.id.toString()}
          onDragEnd={handleDragEnd}
          onDragBegin={() => setDragging(true)}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              <TouchableOpacity
                activeOpacity={1}
                onLongPress={drag}
                disabled={isActive}
                style={[
                  styles.taskRow,
                  isActive && { backgroundColor: "#f0f0f0", opacity: 0.8 },
                ]}
              >
                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.taskImage}
                  />
                )}
                <Text
                  style={[
                    styles.taskText,
                    item.checked && {
                      textDecorationLine: "line-through",
                      color: "gray",
                    },
                  ]}
                >
                  {item.text}
                </Text>
                <View style={styles.iconContainer}>
                  <TouchableOpacity onPress={() => openEditModal(item)}>
                    <Icon name="edit" size={24} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteTask(item.id, item.text)}
                  >
                    <Icon name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </ScaleDecorator>
          )}
        />
      ) : (
        // VIEW MODE OR ONGOING EDIT MODE
        <FlatList
          data={checklist.items}
          keyExtractor={(item) => item.id.toString()}
          ListFooterComponent={
            isOngoingEdit ? (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitChanges}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isHighlighted =
              activeState?.isActive && index === activeState?.currentTaskIndex;
            const isCheckboxDisabled =
              !activeState?.isActive ||
              index !== activeState?.currentTaskIndex ||
              isTaskDisabled(item.id);
            const canCheck =
              !item.checked && isHighlighted && !isTaskDisabled(item.id);
            const isDisabled = isTaskDisabled(item.id);
            const showCancelIcon = shouldShowCancelIcon(item, index);

            return (
              <View
                style={[
                  styles.taskRow,
                  isHighlighted && styles.highlightedTask,
                  isDisabled && styles.disabledTask,
                ]}
              >
                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.taskImage}
                  />
                )}
                <Text
                  style={[
                    styles.taskText,
                    item.checked && {
                      textDecorationLine: "line-through",
                      color: "gray",
                    },
                    isDisabled && styles.disabledTaskText,
                  ]}
                >
                  {item.text}
                </Text>
                {isDisabled && (
                  <View style={styles.disabledIconContainer}>
                    <Icon name="cancel" size={24} color="red" />
                  </View>
                )}
                {showCancelIcon && (
                  <TouchableOpacity
                    onPress={() => handleCancelTask(item.id)}
                    style={styles.cancelIconContainer}
                  >
                    <Icon name="close" size={24} color="red" />
                  </TouchableOpacity>
                )}
                <Checkbox
                  checked={item.checked}
                  disabled={isCheckboxDisabled}
                  onPress={() => {
                    if (canCheck) {
                      handleCompleteTask();
                    }
                  }}
                />
              </View>
            );
          }}
        />
      )}

      {/* Congratulations Modal */}
      <Modal visible={showCongrats} transparent animationType="fade">
        <View style={styles.congratsOverlay}>
          <View style={styles.congratsContent}>
            <Text style={styles.congratsEmoji}>👍😊</Text>
            <Text style={styles.congratsText}>Congratulations!</Text>
          </View>
        </View>
      </Modal>

      {/* Modal for editing checklist image - only in normal edit mode */}
      <Modal
        visible={checklistImageModalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Schedule Image</Text>

            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={handlePickChecklistImage}
            >
              {checklistImageUri ? (
                <Image
                  source={{ uri: checklistImageUri }}
                  style={styles.imagePreview}
                />
              ) : (
                <>
                  <Icon name="add-photo-alternate" size={40} color="gray" />
                  <Text style={styles.placeholderText}>
                    Tap to add image (optional)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {checklistImageUri && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveChecklistImage}
              >
                <Text style={styles.removeImageText}>Remove Image</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalButtons}>
              <Button
                title="Close"
                onPress={() => setChecklistImageModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Task Modal - only in normal edit mode */}
      {isNormalEdit && (
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Task</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter task name"
                value={newTask}
                onChangeText={setNewTask}
              />

              <TouchableOpacity
                style={styles.imagePlaceholder}
                onPress={handlePickImage}
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                  />
                ) : (
                  <>
                    <Icon name="add-photo-alternate" size={40} color="gray" />
                    <Text style={styles.placeholderText}>
                      Tap to add image (optional)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} />
                <Button title="Add" onPress={handleAddTask} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Task Modal - only in normal edit mode */}
      {isNormalEdit && (
        <Modal visible={editModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.editModalContent}>
              <Text style={styles.modalTitle}>Edit Task</Text>

              <TextInput
                style={styles.input}
                placeholder="Edit task name"
                value={editTaskText}
                onChangeText={setEditTaskText}
              />

              <TouchableOpacity
                style={styles.editImagePlaceholder}
                onPress={handleEditPickImage}
                activeOpacity={0.7}
              >
                {editImageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: editImageUri }}
                      style={styles.editImagePreview}
                    />
                    <View style={styles.imageActionsContainer}>
                      <TouchableOpacity
                        style={styles.imageActionButton}
                        onPress={handleEditPickImage}
                      >
                        <Icon name="edit" size={18} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.imageActionButton}
                        onPress={handleRemoveImageInEdit}
                      >
                        <Icon name="delete" size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <Icon name="add-photo-alternate" size={40} color="gray" />
                    <Text style={styles.placeholderText}>
                      Tap to add image (optional)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setEditModalVisible(false)}
                />
                <Button title="Save" onPress={handleEditTask} />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Saved Tasks Modal */}
      <Modal visible={showSavedTasksModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>Saved Tasks</Text>

            {getSavedTasks().length === 0 ? (
              <Text style={styles.emptyText}>No saved tasks yet</Text>
            ) : (
              <FlatList
                data={getSavedTasks()}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.savedTaskRow}>
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.savedTaskImage}
                      />
                    )}
                    <Text style={styles.savedTaskText}>{item.text}</Text>
                    <View style={styles.savedTaskButtons}>
                      <TouchableOpacity
                        onPress={() => {
                          addItem(checklist.id, item.text, item.image, item.id);
                          setShowSavedTasksModal(false);
                          Alert.alert("Success", "Task added to checklist");
                        }}
                        style={styles.savedTaskAddButton}
                      >
                        <Icon name="add" size={20} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            "Delete Saved Task",
                            `Delete "${item.text}" from saved tasks?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => deleteSavedTask(item.id),
                              },
                            ],
                          );
                        }}
                        style={styles.savedTaskDeleteButton}
                      >
                        <Icon name="delete" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

            <View style={styles.modalButtons}>
              <Button
                title="Close"
                onPress={() => setShowSavedTasksModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
