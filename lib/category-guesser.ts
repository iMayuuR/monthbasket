import { Category } from "@/types";

export function guessCategory(name: string): Category {
  const lowerName = name.toLowerCase();

  // Grains & Cereals keywords
  const grains = ["rice", "bajri", "bajra", "jowar", "jwaari", "wheat", "gehu", "oats", "otts", "maida", "flour", "atta", "poha", "shevaya", "noodles", "pasta"];
  if (grains.some(k => lowerName.includes(k))) return "Grains";

  // Pulses & Lentils
  const pulses = ["dal", "daal", "toor", "tur", "moong", "mug", "udid", "gram", "besan", "chana", "lentil"];
  if (pulses.some(k => lowerName.includes(k))) return "Pulses";

  // Spices
  const spices = ["salt", "mirchi", "chili", "turmeric", "haldi", "hing", "asafoetida", "cumin", "coriander", "spice", "powder", "tikh", "garam masala", " teasing", "cardamom", "clove", "cinnamon"];
  if (spices.some(k => lowerName.includes(k))) return "Spices";

  // Dairy
  const dairy = ["milk", "dudh", "butter", "makhan", "ghee", "desi ghee", "cheese", "paneer", "curd", "yogurt", "cream"];
  if (dairy.some(k => lowerName.includes(k))) return "Dairy";

  // Snacks
  const snacks = ["biscuit", "cookie", "cracker", "chips", "fryums", "murukku", "chakna", "snack", "namkeen", "mixture"];
  if (snacks.some(k => lowerName.includes(k))) return "Snacks";

  // Beverages
  const beverages = ["tea", "chai", "coffee", "cafe", "cold drink", "juice", "smoothie", "milkshake"];
  if (beverages.some(k => lowerName.includes(k))) return "Beverages";

  return "Other";
}
