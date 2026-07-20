import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "./api";
import { useAuth } from "../store/auth";

/* ═══ Monetization data layer — coin wallet, packs, Razorpay, gifts,
   unlocks, creator earnings, KYC, payouts (spec v1) ═══ */

/* ------------------------------ Coin wallet ------------------------------ */
export function useWallet() {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => get("/wallet"),
    enabled: !!user,
    staleTime: 1000 * 30,
  });
}

export function useWalletTransactions(enabled = true) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => get("/wallet/transactions", { params: { page_size: 30 } }),
    enabled: !!user && enabled,
  });
}

export function useRechargePacks() {
  return useQuery({
    queryKey: ["recharge-packs"],
    queryFn: () => get("/wallet/recharge-packs"),
    staleTime: 1000 * 60 * 10,
  });
}

export function useInitiateRecharge() {
  return useMutation({
    mutationFn: (packId) =>
      post("/wallet/recharge/initiate", { pack_id: packId, payment_gateway: "razorpay" }),
  });
}

export function useVerifyRecharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post("/wallet/recharge/verify", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });
}

/* --------------------------------- Gifts --------------------------------- */
export function useGiftCatalog() {
  return useQuery({
    queryKey: ["gift-catalog"],
    queryFn: () => get("/gifts/catalog"),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSendGift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post("/gifts/send", body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      if (vars?.story_id)
        qc.invalidateQueries({ queryKey: ["top-gifters", vars.story_id] });
    },
  });
}

export function useTopGifters(storyId) {
  return useQuery({
    queryKey: ["top-gifters", storyId],
    queryFn: () => get(`/gifts/story/${storyId}/top-gifters`),
    enabled: !!storyId,
    staleTime: 1000 * 60,
  });
}

/* -------------------------------- Unlocks -------------------------------- */
export function useUnlockEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (episodeId) => post(`/stories/episodes/${episodeId}/unlock`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["episode"] });
      qc.invalidateQueries({ queryKey: ["story"] });
    },
  });
}

/* --------------------------- Public config hints -------------------------- */
export function useMonetizationPublicConfig() {
  return useQuery({
    queryKey: ["monetization-public-config"],
    queryFn: () => get("/monetization/public-config"),
    staleTime: 1000 * 60 * 10,
    // pre-deploy backends 404 this — fall back to spec defaults silently
    retry: false,
    placeholderData: {
      min_free_chapters: 3,
      unlock_price_min: 5,
      unlock_price_max: 15,
      unlock_price_default: 8,
      valid_read_min_seconds: 30,
      valid_read_min_scroll_percent: 50,
      min_payout_paise: 50000,
      earning_hold_days: 7,
    },
  });
}

/* ------------------------- Creator: monetization -------------------------- */
export function useMonetizationEligibility(enabled = true) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["monetization-eligibility"],
    queryFn: () => get("/monetization/eligibility"),
    enabled: !!user && enabled,
  });
}

export function useApplyMonetization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post("/monetization/apply", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monetization-eligibility"] }),
  });
}

export function useEarningWallet(enabled = true) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["earning-wallet"],
    queryFn: () => get("/monetization/earnings/wallet"),
    enabled: !!user && enabled,
    staleTime: 1000 * 30,
  });
}

export function useEarningLedger(enabled = true) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["earning-ledger"],
    queryFn: () => get("/monetization/earnings/ledger", { params: { page_size: 30 } }),
    enabled: !!user && enabled,
  });
}

export function usePayouts(enabled = true) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["payouts"],
    queryFn: () => get("/monetization/payouts", { params: { page_size: 20 } }),
    enabled: !!user && enabled,
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amountPaise) => post("/monetization/payouts/request", { amount_paise: amountPaise }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payouts"] });
      qc.invalidateQueries({ queryKey: ["earning-wallet"] });
      qc.invalidateQueries({ queryKey: ["earning-ledger"] });
    },
  });
}

export function useLockChapters(storyId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post(`/monetization/stories/${storyId}/lock-chapters`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["story"] }),
  });
}

/* ----------------------- Valid-read heartbeat (spec 8) -------------------- */
export function reportValidRead(episodeId, seconds, scrollPercent) {
  // fire-and-forget; server dedupes per user/episode/day
  return post("/monetization/valid-read", {
    episode_id: episodeId,
    seconds: Math.round(seconds),
    scroll_percent: Math.round(scrollPercent),
  }).catch(() => {});
}

/* -------------------------------- Format --------------------------------- */
export const paiseToInr = (paise) =>
  `₹${((paise || 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
