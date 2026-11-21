import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  DemoAccount, Guidance, HistoryItem, Impact, Listing, Needs, NewListing, Offer, Org, Session, Status, Storage, Category, Task,
} from "./types";

// Live updates invalidate these keys (see useLiveEvents); polling every 15 s covers a dropped stream.
const POLL_MS = 15_000;

export const useAccounts = () => useQuery({ queryKey: ["accounts"], queryFn: () => api<DemoAccount[]>("/demo/accounts"), staleTime: Infinity });

export const useLogin = () =>
  useMutation({ mutationFn: (account_id: string) => api<Session>("/auth/demo-login", { method: "POST", body: { account_id } }) });

export const useListings = (status?: Status) =>
  useQuery({
    queryKey: ["listings", status ?? "all"],
    queryFn: () => api<Listing[]>(`/listings${status ? `?status=${status}` : ""}`),
    refetchInterval: POLL_MS,
  });

export const useListing = (id: string) =>
  useQuery({ queryKey: ["listing", id], queryFn: () => api<Listing>(`/listings/${id}`), refetchInterval: POLL_MS });

export const useGuidance = (categories: Category[], storage: Storage, cookedAt: string, veg: boolean) =>
  useQuery({
    queryKey: ["guidance", categories.join(","), storage, cookedAt, veg],
    enabled: categories.length > 0,
    queryFn: () =>
      api<Guidance>(`/guidance?categories=${categories.join(",")}&storage=${storage}&cooked_at=${encodeURIComponent(cookedAt)}&veg=${veg}`),
  });

export const useOffers = () => useQuery({ queryKey: ["offers"], queryFn: () => api<Offer[]>("/offers"), refetchInterval: POLL_MS });
export const useOffer = (id: string) =>
  useQuery({ queryKey: ["offer", id], queryFn: () => api<Offer>(`/offers/${id}`), refetchInterval: POLL_MS });
export const useHistory = () => useQuery({ queryKey: ["history"], queryFn: () => api<HistoryItem[]>("/receiver/history") });
export const useNeeds = () => useQuery({ queryKey: ["needs"], queryFn: () => api<Needs>("/receiver/needs") });

export const useTasks = () => useQuery({ queryKey: ["tasks"], queryFn: () => api<Task[]>("/tasks"), refetchInterval: POLL_MS });

export const useImpact = (scope: "me" | "city") =>
  useQuery({ queryKey: ["impact", scope], queryFn: () => api<Impact>(`/impact?scope=${scope}`), refetchInterval: 60_000 });
export const useMap = () =>
  useQuery({ queryKey: ["map"], queryFn: () => api<{ donors: Org[]; receivers: Org[]; recent: Record<string, unknown>[] }>("/map") });

// Every mutation refreshes everything it could have touched; the data set is small.
function useAct<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries() });
}

export const usePostListing = () => useAct((b: NewListing) => api<Listing>("/listings", { method: "POST", body: b }));
export const useCancelListing = () => useAct((id: string) => api<Listing>(`/listings/${id}/cancel`, { method: "POST" }));
export const useAcceptOffer = () => useAct((id: string) => api<Listing>(`/offers/${id}/accept`, { method: "POST" }));
export const useDeclineOffer = () => useAct((id: string) => api<{ ok: boolean }>(`/offers/${id}/decline`, { method: "POST" }));
export const useSaveNeeds = () => useAct((n: Needs) => api<Needs>("/receiver/needs", { method: "PUT", body: n }));
export const useAcceptTask = () => useAct((id: string) => api<Task>(`/tasks/${id}/accept`, { method: "POST" }));
export const usePickup = () =>
  useAct((v: { id: string; code: string }) => api<Listing>(`/tasks/${v.id}/pickup`, { method: "POST", body: { code: v.code } }));
export const useDeliver = () =>
  useAct((v: { id: string; code: string; meals: number }) =>
    api<Listing>(`/tasks/${v.id}/deliver`, { method: "POST", body: { code: v.code, meals_delivered: v.meals } }),
  );
export const useAvailability = () =>
  useAct((available: boolean) => api<{ ok: boolean }>("/volunteer/availability", { method: "PUT", body: { available } }));
export const useRunScenario = () =>
  useAct<void, { started: boolean }>(() => api<{ started: boolean }>("/demo/scenario", { method: "POST", body: { name: "wedding_night" } }));
