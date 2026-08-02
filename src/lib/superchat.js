// Super Chat coin tiers — always multiples of 10 (per spec). The colour gets
// "hotter" with the amount (YouTube-style) and is what highlights the bubble.
export const SUPERCHAT_TIERS = [
  { coins: 10,  color: "#2f9bd6" },
  { coins: 20,  color: "#18b0a6" },
  { coins: 50,  color: "#1fae4d" },
  { coins: 100, color: "#e0a800" },
  { coins: 200, color: "#e6721e" },
  { coins: 500, color: "#d63333" },
];

export function tierColor(coins) {
  let c = SUPERCHAT_TIERS[0].color;
  for (const t of SUPERCHAT_TIERS) if (coins >= t.coins) c = t.color;
  return c;
}
