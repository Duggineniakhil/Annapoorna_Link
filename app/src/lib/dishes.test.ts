import { describe, expect, it } from "vitest";
import {
  DISHES,
  allergensFromName,
  defaultAllergens,
  detectNonVeg,
  listingIsVeg,
  mealsFromKg,
  postedInMs,
} from "./dishes";

const dish = (id: string) => {
  const found = DISHES.find((d) => d.id === id);
  if (!found) throw new Error(`missing dish ${id}`);
  return found;
};

describe("veg auto-detection", () => {
  it.each([
    "Chicken 65",
    "Egg fried rice",
    "Fish fry",
    "Mutton curry",
    "Prawn biryani",
    "Kodi kura",
  ])("marks %s as non-veg", (name) => {
    expect(detectNonVeg(name)).toBe(true);
  });

  it.each(["Veg biryani", "Paneer butter masala", "Eggplant curry", "Gobi manchurian"])(
    "keeps %s veg",
    (name) => {
      expect(detectNonVeg(name)).toBe(false);
    },
  );

  it("catalogue non-veg dishes are flagged", () => {
    expect(dish("chicken-biryani").veg).toBe(false);
    expect(dish("egg-curry").veg).toBe(false);
  });

  it("a listing with any non-veg item is non-veg", () => {
    expect(listingIsVeg([dish("veg-biryani"), dish("dal")])).toBe(true);
    expect(listingIsVeg([dish("veg-biryani"), dish("chicken-curry")])).toBe(false);
  });
});

describe("allergen defaults", () => {
  it("curd rice suggests dairy and chapati suggests gluten", () => {
    expect(defaultAllergens([dish("curd-rice"), dish("chapati")])).toEqual(["dairy", "gluten"]);
  });

  it("merges without duplicates in a stable order", () => {
    expect(defaultAllergens([dish("naan"), dish("double-ka-meetha"), dish("pulihora")])).toEqual([
      "nuts",
      "peanuts",
      "dairy",
      "gluten",
    ]);
  });

  it("is empty for dishes without allergens", () => {
    expect(defaultAllergens([dish("dal"), dish("sambar")])).toEqual([]);
  });

  it("suggests allergens from a typed name", () => {
    expect(allergensFromName("Egg fried rice")).toEqual(["egg"]);
    expect(allergensFromName("Fish curry")).toEqual(["seafood"]);
    expect(allergensFromName("Paneer tikka")).toEqual(["dairy"]);
  });
});

describe("quantities and timing", () => {
  it("converts kg to meals at 0.4 kg per meal", () => {
    expect(mealsFromKg(20)).toBe(50);
    expect(mealsFromKg(0.1)).toBe(1);
    expect(mealsFromKg(0)).toBe(0);
    expect(mealsFromKg(Number.NaN)).toBe(0);
  });

  it("posted_in_ms is the time since the form opened", () => {
    expect(postedInMs(1_000, 43_000)).toBe(42_000);
  });

  it("posted_in_ms is never negative", () => {
    expect(postedInMs(5_000, 1_000)).toBe(0);
  });
});
