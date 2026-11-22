import type { Category } from "../types/api";

// Photos and video for the redesign. All free-licence: photos from Unsplash (Unsplash License),
// video from Pexels (Pexels License); both allow use without attribution, credited in the homepage footer anyway.
// They load from the providers' CDNs and are not stored in the repo; every place that shows one
// has a coloured background behind it, so the page still reads fine offline.

const UNSPLASH = "https://images.unsplash.com/";

/** A sized, cropped, compressed Unsplash URL. */
export function photo(id: string, width: number, height?: number): string {
  const size = height ? `&h=${height}` : "";
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=${width}${size}&q=70`;
}

/** srcSet for responsive photos (1x / 2x at the given CSS width). */
export function photoSet(id: string, width: number, height?: number): string {
  const h2 = height ? height * 2 : undefined;
  return `${photo(id, width, height)} 1x, ${photo(id, width * 2, h2)} 2x`;
}

export const PHOTOS = {
  biryaniHandi: "photo-1563379091339-03b21ab4a4f8",
  biryaniBowl: "photo-1708782345014-db93ddd5608f",
  biryaniPlate: "photo-1589302168068-964664d93dc0",
  thali: "photo-1742281257687-092746ad6021",
  thaliSilver: "photo-1680993032090-1ef7ea9b51e5",
  weddingBuffet: "photo-1565556250026-9ba22083e3e0",
  clayPots: "photo-1777613112895-139720bd43c9",
  packingMeals: "photo-1593113616828-6f22bca04804",
  packingBags: "photo-1628717341663-0007b0ee2597",
  communityCooking: "photo-1761300463257-7a6b70d43c27",
  bigPot: "photo-1675080165804-049eecf31ee2",
  charminar: "photo-1696941515998-d83f24967aca",
  roti: "photo-1567337710282-00832b415979",
  samosa: "photo-1601050690597-df0568f70950",
  sweets: "photo-1695568181440-aca4dac18650",
  curdRice: "photo-1642821373181-696a54913e93",
  fruit: "photo-1564093497595-593b96d80180",
} as const;

/** One photo per food category, for listing and offer cards. */
export const CATEGORY_PHOTO: Record<Category, string> = {
  rice_dish: PHOTOS.biryaniPlate,
  curry: PHOTOS.thali,
  bread: PHOTOS.roti,
  dry_snack: PHOTOS.samosa,
  sweet: PHOTOS.sweets,
  dairy_based: PHOTOS.curdRice,
  salad_cut_fruit: PHOTOS.fruit,
};

/** Landing hero background: golden rice served from a pan (Pexels video 4912725). */
export const HERO_VIDEO = {
  src: "https://videos.pexels.com/video-files/4912725/4912725-hd_1280_720_24fps.mp4",
  poster: photo(PHOTOS.biryaniHandi, 1600, 900),
};

/** Play the hero video only on wide screens, without reduced motion or data saver. */
export function heroVideoAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return (
    window.matchMedia("(min-width: 768px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !conn?.saveData
  );
}
