import {
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

export default function ChecklistItem({ item, onToggle, onDelete }) {
  // Render the swipe action (appears when swiping left)
  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => onDelete(item.id)}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View style={styles.itemRow}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text style={item.checked ? styles.checkedText : styles.text}>
          {item.text}
        </Text>
        <Button
          title={item.checked ? "✓" : "☐"}
          onPress={onToggle}
          color={item.checked ? "green" : "gray"}
        />
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  image: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 18,
    flex: 1,
  },
  checkedText: {
    fontSize: 18,
    textDecorationLine: "line-through",
    color: "gray",
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
});
