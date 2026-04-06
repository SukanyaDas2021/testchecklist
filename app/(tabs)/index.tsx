import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Button,
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

export default function IndexScreen() {
  const {
    checklists,
    createChecklist,
    renameChecklist,
    deleteChecklist,
    reorderChecklists,
  } = useChecklist();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleCreate = () => {
    createChecklist(newName.trim());
    setNewName("");
    setModalVisible(false);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      "Delete Checklist",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => deleteChecklist(id),
          style: "destructive",
        },
      ],
    );
  };

  const handleDragEnd = ({ data }: { data: typeof checklists }) => {
    reorderChecklists(data);
  };

  return (
    <LinearGradient
      colors={["#d2fcfc", "#ffc6d0", "#f7fcb5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <LinearGradient
        colors={["#e7e2eb", "#dcb8fd77"]}
        locations={[0, 0.95]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.titleContainer}
      >
        <Text style={styles.title}>My Schedules</Text>
      </LinearGradient>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.createButtonText}>Create Schedule</Text>
      </TouchableOpacity>

      {checklists.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No Schedules yet</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={checklists}
          keyExtractor={(cl) => cl.id.toString()}
          onDragEnd={handleDragEnd}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              <TouchableOpacity
                activeOpacity={1}
                onLongPress={drag}
                disabled={isActive}
              >
                <View style={styles.checklistRow}>
                  <TouchableOpacity
                    style={styles.checklistNameContainer}
                    onPress={() =>
                      router.push(`/checklist/${item.id}?mode=view`)
                    } // CHANGE: Add ?mode=view
                  >
                    <Text style={styles.checklistName}>{item.name}</Text>
                  </TouchableOpacity>

                  <View style={styles.buttonContainer}>
                    {/* Edit button */}
                    <TouchableOpacity
                      onPress={() =>
                        router.push(`/checklist/${item.id}?mode=edit`)
                      }
                    >
                      <Icon name="edit" size={24} color="#007AFF" />
                    </TouchableOpacity>

                    {/* Delete button */}
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.name)}
                    >
                      <Icon name="delete" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </ScaleDecorator>
          )}
        />
      )}

      {/* Modal for naming checklist */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Schedule</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter schedule name"
              value={newName}
              onChangeText={setNewName}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Create" onPress={handleCreate} />
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titleContainer: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 13,
    marginTop: 8,
    borderWidth: 3,
    borderColor: "#76088b",
    marginHorizontal: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#76088b",
  },
  createButton: {
    backgroundColor: "#9a12b6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-end",
    marginBottom: 20,
    marginHorizontal: 1,
  },
  createButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 2,
    borderWidth: 2,
    borderColor: "#76088b",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f9f5fb",
  },
  checklistNameContainer: {
    flex: 1,
  },
  checklistName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "gray", marginBottom: 20 },
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
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
});
