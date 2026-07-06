import { useState, useEffect } from "react";
import { thumbFor, fallbackThumb } from "../lib/constants";

// Free generated avatar when a user has no (or a broken) avatar.
function avatarFallback(seed = "") {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed || "pretika")}&backgroundColor=faece7`;
}

/**
 * Image with automatic graceful fallback:
 *  - story/cover thumbnails fall back to free Unsplash horror art
 *  - avatars fall back to a generated dicebear avatar
 * Handles relative API paths and self-hosted absolute URLs via thumbFor().
 */
export default function Img({ path, seed = "", kind = "story", alt = "", style, className, loading = "lazy" }) {
  const fb = kind === "avatar" ? avatarFallback(seed) : fallbackThumb(seed);
  const [src, setSrc] = useState(thumbFor(path, seed) || fb);

  useEffect(() => {
    setSrc(thumbFor(path, seed) || fb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, seed]);

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      style={style}
      onError={() => { if (src !== fb) setSrc(fb); }}
    />
  );
}
