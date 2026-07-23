import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "./api";
import { useAuth } from "../store/auth";

/* ═══ Referral 2.0 ("Bulawa") data layer ═══
   Nothing is paid at signup. The referrer earns as their friend actually
   engages: verify → read 3 chapters → first recharge → 90-day capped 5%
   revenue-share. All rewards are non-cashable reader coins, and every rate
   comes from the API (coin_config), never hardcoded here. */

export function useMyReferral(enabled = true) {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ["referral", "me"],
    queryFn: () => get("/referrals/me"),
    enabled: !!user && enabled,
    staleTime: 1000 * 30,
  });
}

/* Settle my own milestones now (I am the referee). The backend sweep does this
   every 5 minutes anyway — this just makes a freshly-earned reward show up
   immediately. Idempotent, so calling it on page load is safe. */
export function useSyncReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post("/referrals/sync"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral", "me"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

/* Full share URL for the current origin, e.g. https://pretika.in/register?ref=ABCD1234 */
export function referralUrl(sharePath) {
  if (!sharePath) return "";
  if (typeof window === "undefined") return sharePath;
  return `${window.location.origin}${sharePath}`;
}
