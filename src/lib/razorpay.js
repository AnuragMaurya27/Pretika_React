// Razorpay hosted checkout loader (spec 4.1).
// The browser callback is only a fast-path UX confirm — the backend webhook is
// the source of truth for crediting coins, so a lost callback self-heals via
// the server's 15-minute reconciliation job.

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Publishable key id (safe for the client). Falls back to the current test key.
export const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SVtjgq1ZfGYKNY";

let scriptPromise = null;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("razorpay script failed"));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Open checkout for a server-created order.
 * Resolves with the gateway response on payment success, rejects on
 * dismiss/failure. Caller then POSTs /wallet/recharge/verify.
 */
export async function openCheckout({ orderId, amountInr, name, description, prefill }) {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      order_id: orderId,
      amount: Math.round(amountInr * 100),
      currency: "INR",
      name: name || "Pretika",
      description: description || "",
      theme: { color: "#9c1c14" },
      prefill: prefill || {},
      handler: (resp) => resolve(resp),
      modal: { ondismiss: () => reject(new Error("dismissed")) },
    });
    rzp.on("payment.failed", (resp) =>
      reject(Object.assign(new Error("failed"), { detail: resp?.error }))
    );
    rzp.open();
  });
}
