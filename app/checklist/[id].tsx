import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Image,
  Modal,
  StyleSheet,
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

  const numericId = Number(id);
  const isEditMode = mode === "edit";

  const {
    getChecklistById,
    addItem,
    toggleItem,
    deleteItem,
    editItem,
    reorderItems,
    startSchedule,
    completeCurrentTask,
    getActiveScheduleState,
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

  useEffect(() => {
    if (checklist) {
      const state = getActiveScheduleState(checklist.id);
      setActiveState(state);
    }
  }, [checklist, getActiveScheduleState]);

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

  const handleAddTask = () => {
    if (newTask.trim().length === 0) return;
    addItem(checklist.id, newTask.trim(), imageUri);
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

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{checklist.name}</Text>
        {isEditMode ? (
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => setModalVisible(true)}
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
            <Text style={styles.addTaskButtonText}>Start Schedule</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {checklist.items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tasks yet</Text>
        </View>
      ) : isEditMode ? (
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
        <FlatList
          data={checklist.items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => {
            const isHighlighted =
              activeState?.isActive && index === activeState.currentTaskIndex;
            const isCheckboxDisabled =
              !activeState?.isActive || index !== activeState.currentTaskIndex;
            const canCheck = !item.checked && isHighlighted;

            return (
              <View
                style={[
                  styles.taskRow,
                  isHighlighted && styles.highlightedTask,
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

      {isEditMode && (
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

      {isEditMode && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#76088b",
    flex: 1,
    textAlign: "center",
  },
  addTaskButton: {
    backgroundColor: "#9a12b6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addTaskButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "gray", marginBottom: 20 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#76088b",
    borderRadius: 10,
    backgroundColor: "white",
  },
  highlightedTask: {
    borderColor: "#ff6b6b",
    borderWidth: 3,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  taskText: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  taskImage: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 8,
  },
  iconContainer: {
    flexDirection: "row",
    gap: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  editModalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    width: "90%",
    maxHeight: "90%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  imagePlaceholder: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
    position: "relative",
  },
  editImagePlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    position: "relative",
    backgroundColor: "#f9f9f9",
  },
  imagePreviewContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
  },
  editImagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  imageActionsContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 8,
  },
  imageActionButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "gray",
    fontSize: 14,
    marginTop: 8,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  congratsOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  congratsContent: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  congratsEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#76088b",
  },
});
