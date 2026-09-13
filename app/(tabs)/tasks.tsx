import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useChecklist } from "../../context/ChecklistProvider";
import { useTabBar } from "../../context/TabBarContext";

export default function TasksScreen() {
  const { tabBarHeight } = useTabBar();
  const insets = useSafeAreaInsets();
  const bottomPadding = tabBarHeight + insets.bottom + 16;
  const bottomMargin = tabBarHeight + insets.bottom;
  const { height: screenHeight } = useWindowDimensions();
  const listHeight = screenHeight * 0.6;
  const router = useRouter();
  const {
    getSavedTasks,
    deleteSavedTask,
    updateSavedTask,
    isSavedTaskInUse,
    checklists,
  } = useChecklist();

  const [savedTasks, setSavedTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date"); // date, name
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState("");
  const [editImageUri, setEditImageUri] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editAudioUri, setEditAudioUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    const tasks = getSavedTasks();
    setSavedTasks(tasks);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
    setRefreshing(false);
  };

  const getSortedAndFilteredTasks = () => {
    let filtered = [...savedTasks];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((task) =>
        task.text.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort
    if (sortBy === "date") {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.text.localeCompare(b.text));
    }

    return filtered;
  };

  const handleDeleteTask = (task) => {
    const inUse = isSavedTaskInUse(task.id);

    if (inUse) {
      Alert.alert(
        "Cannot Delete",
        `"${task.text}" is currently used in one or more schedules. Please remove it from all schedules before deleting.`,
        [{ text: "OK" }],
      );
    } else {
      Alert.alert(
        "Delete Task",
        `Are you sure you want to delete "${task.text}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deleteSavedTask(task.id);
              loadTasks();
            },
          },
        ],
      );
    }
  };

  const handleEditTask = (task) => {
    const inUse = isSavedTaskInUse(task.id);

    if (inUse) {
      Alert.alert(
        "Cannot Edit",
        `"${task.text}" is currently used in one or more schedules. Please remove it from all schedules before editing.`,
        [{ text: "OK" }],
      );
    } else {
      setEditingTask(task);
      setEditText(task.text);
      setEditImageUri(task.image || null);
      setEditModalVisible(true);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim().length === 0) return;
    updateSavedTask(
      editingTask.id,
      editText.trim(),
      editImageUri,
      editAudioUri,
    );
    setEditModalVisible(false);
    setEditingTask(null);
    setEditText("");
    setEditImageUri(null);
    setEditAudioUri(null);
    loadTasks();
  };

  const handlePickImage = async () => {
    const ImagePicker = require("expo-image-picker");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setEditImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setEditImageUri(null);
  };

  // Audio Recording and Playback Functions
  const startRecording = async () => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Microphone permission is needed to record audio",
        );
        return;
      }

      // Clean up any existing recording first
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      // Small delay to ensure cleanup completes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start new recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log("Recording started successfully");
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setIsRecording(false);

    if (uri) {
      setEditAudioUri(uri);
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });
      if (result.assets && result.assets[0]) {
        setEditAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick audio file");
    }
  };

  const playAudio = async (uri) => {
    if (!uri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setSound(null);
        }
      });
    } catch (err) {
      console.log("Error playing audio:", err);
    }
  };

  const removeEditAudio = () => {
    setEditAudioUri(null);
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditText(task.text);
    setEditImageUri(task.image || null);
    setEditAudioUri(task.audioUri || null);
    setEditModalVisible(true);
  };

  const renderTaskItem = ({ item }) => {
    const inUse = isSavedTaskInUse(item.id);

    return (
      <View style={[styles.taskCard, inUse && styles.taskCardInUse]}>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.taskImage} />
        )}
        <View style={styles.taskContent}>
          <View style={styles.taskTextRow}>
            <Text style={[styles.taskText, inUse && styles.taskTextInUse]}>
              {item.text}
            </Text>
            {item.audioUri && (
              <TouchableOpacity
                onPress={() => playAudio(item.audioUri)}
                style={styles.soundIcon}
              >
                <Icon name="volume-up" size={20} color="#76088b" />
              </TouchableOpacity>
            )}
          </View>
          {inUse && <Text style={styles.inUseBadge}>In use</Text>}
        </View>
        <View style={styles.taskActions}>
          <TouchableOpacity
            onPress={() => handleEditTask(item)}
            style={[styles.actionButton, inUse && styles.actionButtonDisabled]}
            disabled={inUse}
          >
            <Icon name="edit" size={22} color={inUse ? "#ccc" : "#007AFF"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteTask(item)}
            style={styles.actionButton}
          >
            <Icon name="delete" size={22} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const sortedFilteredTasks = getSortedAndFilteredTasks();

  return (
    <LinearGradient
      colors={["#d2fcfc", "#ffc6d0", "#f7fcb5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { paddingBottom: bottomMargin }]}
    >
      {/* Header with back arrow - Modified heading style */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#76088b" />
        </TouchableOpacity>
        <LinearGradient
          colors={["#e7e2eb", "#dcb8fd77"]}
          locations={[0, 0.95]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.titleContainer}
        >
          <Text style={styles.headerTitle}>Saved Tasks</Text>
        </LinearGradient>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "date" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("date")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "date" && styles.sortButtonTextActive,
            ]}
          >
            Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "name" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("name")}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "name" && styles.sortButtonTextActive,
            ]}
          >
            Name
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      {sortedFilteredTasks.length === 0 ? (
        <View style={[styles.emptyState, { paddingBottom: bottomMargin }]}>
          <Icon name="folder-open" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? "No matching tasks found" : "No saved tasks yet"}
          </Text>
          <Text style={styles.emptySubText}>
            Save tasks when adding them to schedules
          </Text>
        </View>
      ) : (
        <FlatList
          style={{ height: listHeight }}
          data={sortedFilteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTaskItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPadding },
          ]} // Add padding bottom
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Edit Task Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Saved Task</Text>

            <TextInput
              style={styles.input}
              placeholder="Task name"
              value={editText}
              onChangeText={setEditText}
            />

            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={handlePickImage}
            >
              {editImageUri ? (
                <Image
                  source={{ uri: editImageUri }}
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

            {editImageUri && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Text style={styles.removeImageText}>Remove Image</Text>
              </TouchableOpacity>
            )}

            {/* Audio Recording Section */}
            <View style={styles.audioSection}>
              <Text style={styles.audioLabel}>Audio (Optional):</Text>
              <View style={styles.audioButtons}>
                {!isRecording ? (
                  <TouchableOpacity
                    style={styles.audioButton}
                    onPress={startRecording}
                  >
                    <Icon name="mic" size={24} color="#76088b" />
                    <Text style={styles.audioButtonText}>Record</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.audioButton}
                    onPress={stopRecording}
                  >
                    <Icon name="stop" size={24} color="red" />
                    <Text style={styles.audioButtonText}>Stop Recording</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.audioButton}
                  onPress={pickAudio}
                >
                  <Icon name="folder-open" size={24} color="#76088b" />
                  <Text style={styles.audioButtonText}>Browse</Text>
                </TouchableOpacity>
              </View>
              {editAudioUri && (
                <View style={styles.audioAttached}>
                  <Icon name="audiotrack" size={20} color="green" />
                  <Text style={styles.audioAttachedText}>Audio attached</Text>
                  <TouchableOpacity
                    onPress={() => playAudio(editAudioUri)}
                    style={styles.playButton}
                  >
                    <Icon name="play-circle" size={24} color="#76088b" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={removeEditAudio}>
                    <Icon name="close" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setEditModalVisible(false)}
              />
              <Button title="Save" onPress={handleSaveEdit} />
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  backButton: {
    padding: 8,
    zIndex: 1,
  },
  titleContainer: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 8,
    borderWidth: 3,
    borderColor: "#76088b",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#76088b",
  },
  headerPlaceholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: "#666",
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  sortButtonActive: {
    backgroundColor: "#76088b",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
  },
  sortButtonTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  taskCardInUse: {
    backgroundColor: "#fafafa",
    opacity: 0.7,
  },
  taskImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  taskTextInUse: {
    color: "#999",
  },
  inUseBadge: {
    fontSize: 12,
    color: "#ff9800",
    marginTop: 4,
  },
  taskActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#76088b",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  placeholderText: {
    color: "gray",
    fontSize: 12,
    marginTop: 8,
  },
  removeImageButton: {
    backgroundColor: "#ff4444",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  removeImageText: {
    color: "white",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  audioSection: {
    marginBottom: 15,
  },
  audioLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#76088b",
    marginBottom: 8,
  },
  audioButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  audioButtonText: {
    fontSize: 14,
    color: "#333",
  },
  audioAttached: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 8,
    borderRadius: 6,
    gap: 8,
    marginTop: 5,
  },
  audioAttachedText: {
    flex: 1,
    fontSize: 12,
    color: "green",
  },
  playButton: {
    padding: 2,
  },
  soundIcon: {
    marginLeft: 8,
    marginRight: 20,
  },
  taskTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
