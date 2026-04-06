import { nanoid } from "nanoid/non-secure"; // lightweight unique ID generator
import { useState } from "react";

export default function useChecklist() {
  const [items, setItems] = useState([
    {
      id: "1",
      text: "Buy groceries",
      checked: false,
      image: "https://via.placeholder.com/40",
    },
    {
      id: "2",
      text: "Finish React Native tutorial",
      checked: false,
      image: "https://via.placeholder.com/40",
    },
    {
      id: "3",
      text: "Call Mom",
      checked: false,
      image: "https://via.placeholder.com/40",
    },
  ]);

  const addItem = (text, imageUri) => {
    setItems((prev) => [
      ...prev,
      { id: nanoid(), text, checked: false, image: imageUri },
    ]);
  };

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, addItem, toggleItem, deleteItem };
}
