import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Button, Image, StyleSheet, TextInput, View } from "react-native";

export default function AddItemInput({ onAdd }) {
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState(null);

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text, imageUri); // pass both text and image
      setText("");
      setImageUri(null);
    }
  };

  const pickImage = async () => {
    // Ask for permission
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Add new task..."
        value={text}
        onChangeText={setText}
      />
      <Button title="Pick Image" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      <Button title="Add" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 10,
    paddingVertical: 5,
  },
  preview: {
    width: 60,
    height: 60,
    marginVertical: 10,
    borderRadius: 5,
  },
});
