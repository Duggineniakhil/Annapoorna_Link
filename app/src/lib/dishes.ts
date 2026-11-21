import type { Allergen, Category } from "../types/api";

/** A common dish offered as a one-tap chip on Quick Post. */
export interface Dish {
  id: string;
  name: string; // stored on the listing (English)
  name_te: string; // chip label in Telugu
  category: Category;
  veg: boolean;
  allergens: Allergen[];
}

export const CATEGORY_ORDER: Category[] = [
  "rice_dish",
  "curry",
  "bread",
  "dry_snack",
  "sweet",
  "dairy_based",
  "salad_cut_fruit",
];

// Typical Hyderabad function / mess menu. Allergen defaults are a starting point; the donor can edit.
export const DISHES: Dish[] = [
  {
    id: "veg-biryani",
    name: "Veg biryani",
    name_te: "వెజ్ బిర్యానీ",
    category: "rice_dish",
    veg: true,
    allergens: [],
  },
  {
    id: "chicken-biryani",
    name: "Chicken biryani",
    name_te: "చికెన్ బిర్యానీ",
    category: "rice_dish",
    veg: false,
    allergens: [],
  },
  {
    id: "pulihora",
    name: "Pulihora",
    name_te: "పులిహోర",
    category: "rice_dish",
    veg: true,
    allergens: ["peanuts"],
  },
  {
    id: "jeera-rice",
    name: "Jeera rice",
    name_te: "జీరా రైస్",
    category: "rice_dish",
    veg: true,
    allergens: [],
  },
  { id: "dal", name: "Dal", name_te: "పప్పు", category: "curry", veg: true, allergens: [] },
  { id: "sambar", name: "Sambar", name_te: "సాంబార్", category: "curry", veg: true, allergens: [] },
  {
    id: "paneer-curry",
    name: "Paneer curry",
    name_te: "పనీర్ కూర",
    category: "curry",
    veg: true,
    allergens: ["dairy"],
  },
  {
    id: "mixed-veg-curry",
    name: "Mixed veg curry",
    name_te: "మిక్స్ వెజ్ కూర",
    category: "curry",
    veg: true,
    allergens: [],
  },
  {
    id: "chicken-curry",
    name: "Chicken curry",
    name_te: "చికెన్ కూర",
    category: "curry",
    veg: false,
    allergens: [],
  },
  {
    id: "egg-curry",
    name: "Egg curry",
    name_te: "గుడ్డు కూర",
    category: "curry",
    veg: false,
    allergens: ["egg"],
  },
  {
    id: "chapati",
    name: "Chapati",
    name_te: "చపాతీ",
    category: "bread",
    veg: true,
    allergens: ["gluten"],
  },
  {
    id: "naan",
    name: "Naan",
    name_te: "నాన్",
    category: "bread",
    veg: true,
    allergens: ["gluten", "dairy"],
  },
  { id: "puri", name: "Puri", name_te: "పూరీ", category: "bread", veg: true, allergens: ["gluten"] },
  {
    id: "samosa",
    name: "Samosa",
    name_te: "సమోసా",
    category: "dry_snack",
    veg: true,
    allergens: ["gluten"],
  },
  { id: "vada", name: "Vada", name_te: "వడ", category: "dry_snack", veg: true, allergens: [] },
  { id: "pakoda", name: "Pakoda", name_te: "పకోడీ", category: "dry_snack", veg: true, allergens: [] },
  {
    id: "gulab-jamun",
    name: "Gulab jamun",
    name_te: "గులాబ్ జామూన్",
    category: "sweet",
    veg: true,
    allergens: ["dairy", "gluten"],
  },
  {
    id: "double-ka-meetha",
    name: "Double ka meetha",
    name_te: "డబుల్ కా మీఠా",
    category: "sweet",
    veg: true,
    allergens: ["dairy", "gluten", "nuts"],
  },
  {
    id: "curd-rice",
    name: "Curd rice",
    name_te: "పెరుగన్నం",
    category: "dairy_based",
    veg: true,
    allergens: ["dairy"],
  },
  {
    id: "raita",
    name: "Raita",
    name_te: "రైతా",
    category: "dairy_based",
    veg: true,
    allergens: ["dairy"],
  },
  {
    id: "payasam",
    name: "Payasam",
    name_te: "పాయసం",
    category: "dairy_based",
    veg: true,
    allergens: ["dairy", "nuts"],
  },
  {
    id: "salad",
    name: "Salad",
    name_te: "సలాడ్",
    category: "salad_cut_fruit",
    veg: true,
    allergens: [],
  },
  {
    id: "cut-fruit",
    name: "Cut fruit",
    name_te: "కోసిన పండ్లు",
    category: "salad_cut_fruit",
    veg: true,
    allergens: [],
  },
];

export const ALL_ALLERGENS: Allergen[] = [
  "nuts",
  "peanuts",
  "dairy",
  "gluten",
  "egg",
  "seafood",
  "soy",
  "sesame",
];

/** Words that mark a typed dish name as non-veg (English and common Telugu transliterations). */
const NON_VEG_PATTERN =
  /\b(chicken|mutton|lamb|goat|beef|pork|meat|keema|kheema|egg|eggs|omelette|fish|prawn|prawns|shrimp|crab|kodi|gudd[ua]|chepa|royyalu|mamsam)\b/i;

/** True when a dish name contains a non-veg word ("Chicken 65", "Egg fried rice", "Fish fry"). */
export function detectNonVeg(name: string): boolean {
  return NON_VEG_PATTERN.test(name);
}

/** Allergens suggested by a typed name, e.g. "Egg fried rice" → egg, "Fish curry" → seafood. */
export function allergensFromName(name: string): Allergen[] {
  const out: Allergen[] = [];
  if (/\begg/i.test(name)) out.push("egg");
  if (/\b(fish|prawn|prawns|shrimp|crab|chepa|royyalu)\b/i.test(name)) out.push("seafood");
  if (/\b(paneer|curd|raita|kheer|payasam|ghee|butter|cream|malai)\b/i.test(name))
    out.push("dairy");
  if (/\b(peanut|groundnut)\b/i.test(name)) out.push("peanuts");
  return out;
}

/** A listing is veg only when every item is veg. */
export function listingIsVeg(items: { veg: boolean }[]): boolean {
  return items.every((item) => item.veg);
}

/** Union of default allergens across items, in a stable order. */
export function defaultAllergens(items: { allergens: Allergen[] }[]): Allergen[] {
  const set = new Set(items.flatMap((item) => item.allergens));
  return ALL_ALLERGENS.filter((a) => set.has(a));
}

/** Meals for a kg quantity (docs/11: 0.4 kg per meal), at least 1. */
export const KG_PER_MEAL = 0.4;
export function mealsFromKg(kg: number): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0;
  return Math.max(1, Math.round(kg / KG_PER_MEAL));
}

/** Time from opening the form to submitting it, never negative. */
export function postedInMs(openedAtMs: number, submittedAtMs: number): number {
  return Math.max(0, Math.round(submittedAtMs - openedAtMs));
}
