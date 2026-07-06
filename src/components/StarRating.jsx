import { useState } from "react";
import { Star } from "lucide-react";

/**
 * Tap-to-rate star row (1–5). Mirrors the Flutter reader/story rating widget.
 * - value: the user's current rating (0 = not rated)
 * - onRate(n): called when a star is tapped
 * - readOnly: show stars without interaction (e.g. average display)
 */
export default function StarRating({ value = 0, onRate, size = 30, readOnly = false, disabled = false }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="row" style={{ gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= shown;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly || disabled}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onRate?.(n)}
            style={{
              padding: 2,
              cursor: readOnly || disabled ? "default" : "pointer",
              lineHeight: 0,
            }}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              size={size}
              fill={filled ? "var(--gold)" : "none"}
              color={filled ? "var(--gold)" : "var(--border-dark)"}
            />
          </button>
        );
      })}
    </div>
  );
}
