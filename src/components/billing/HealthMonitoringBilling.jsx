import React, { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { createCheckout } from "@/functions/createCheckout";

// Pay-what-you-want billing for personalized health monitoring. The patient
// picks an amount and one-time or monthly, then we hand off to Stripe Checkout.
// Checkout only works from the published app (not the builder preview iframe),
// so that case is blocked with a clear message before any network call.

const SUGGESTED = [5, 10, 25];

const inIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

export default function HealthMonitoringBilling() {
  const [amount, setAmount] = useState("10");
  const [cadence, setCadence] = useState("one_time");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("paid") === "1";
    } catch { return false; }
  });

  const dollars = Number(amount);
  const valid = Number.isFinite(dollars) && dollars >= 1 && dollars <= 100000;

  const pay = async () => {
    setError("");
    if (inIframe()) {
      setError("Checkout only works from the published app. Open it in a new tab to pay.");
      return;
    }
    if (!valid) {
      setError("Choose an amount of at least $1.");
      return;
    }
    setBusy(true);
    try {
      const origin = window.location.origin;
      const { data } = await createCheckout({
        amountCents: Math.round(dollars * 100),
        cadence,
        successUrl: `${origin}/profile?paid=1`,
        cancelUrl: `${origin}/profile`
      });
      if (data?.url) {
        // Redirect to Stripe Checkout. The page unloads, so no cleanup needed.
        window.location.href = data.url;
        return;
      }
      setError(data?.error || "Could not start checkout.");
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not start checkout.");
    }
    setBusy(false);
  };

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2">
        <Heart className="w-5 h-5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-xl uppercase leading-tight break-words">Donations accepted</div>
          <div className="text-sm font-semibold break-words">Pay what you want. One time or monthly.</div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {paid && (
          <div className="border-2 rounded-xl bg-accent text-accent-foreground p-3 text-sm font-bold break-words">
            Thank you — your payment went through.
          </div>
        )}

        <div className="space-y-2">
          <div className="nb-label">How often</div>
          <div className="flex gap-1.5">
            {[
              ["one_time", "One time"],
              ["month", "Monthly"]
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setCadence(k)}
                aria-pressed={cadence === k}
                className="nb-chip flex-1 justify-center"
                style={cadence === k ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="nb-label">Amount (USD)</div>
          <div className="flex gap-1.5">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setAmount(String(s))}
                aria-pressed={dollars === s}
                className="nb-chip flex-1 justify-center"
                style={dollars === s ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}
              >
                ${s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="nb-label w-6 shrink-0">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10"
              className="nb-input flex-1 min-w-0"
            />
          </div>
        </div>

        {error && <p className="text-sm font-bold text-destructive break-words">{error}</p>}

        <button
          type="button"
          className="nb-btn w-full h-14 bg-primary text-primary-foreground"
          onClick={pay}
          disabled={busy || !valid}
        >
          {busy ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
          ) : (
            <>{cadence === "month" ? "Subscribe" : `Pay $${Number.isFinite(dollars) ? dollars.toFixed(2) : ""}`}</>
          )}
        </button>

        <p className="text-2xs font-semibold text-muted-foreground break-words">
          Secure payment by Stripe. {cadence === "month" ? "Charges monthly until you cancel." : "A single charge."}
        </p>
      </div>
    </div>
  );
}