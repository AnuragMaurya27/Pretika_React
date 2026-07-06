/* ===========================================================================
   Art.jsx — hand-drawn SVG illustrations that render PIXEL-IDENTICAL on every
   platform (Windows / macOS / Android / iOS).  We use these instead of emoji
   for any large, focal graphic, because OS emoji fonts (Segoe UI Emoji on
   Windows vs Apple Color Emoji on macOS) look completely different and often
   flat / cartoonish.  Pure SVG = same everywhere, plus we control glow + motion.
   =========================================================================== */
import {
  Ghost, Skull, Flame, Castle, Trees, Wind, Droplet, Swords, Eye,
  BookOpen, Heart, Scroll, Sparkles, Wheat, Tornado,
  Crown, MoonStar, Cloud, UserRound,
} from "lucide-react";

/* ------------------------------------------------------------- Eye logo ---- */
/* THE brand mark v2 — a realistic 3D weeping eye: shaded sclera with corner
   shadows, fibrous crimson iris with slit pupil, glossy speculars, bloodshot
   veins, thorn lashes, tear duct and a glossy blood tear.
   `tile={false}` drops the dark app-icon tile for already-dark surfaces. */
const EYE_OPEN = "M60 252 Q 250 106 452 246 Q 258 378 60 252 Z";
const FIB_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

function EyeDefs({ u }) {
  return (
    <defs>
      <radialGradient id={`${u}-bg`} cx="50%" cy="36%" r="82%">
        <stop offset="0%" stopColor="#2e0e0c" /><stop offset="55%" stopColor="#170606" /><stop offset="100%" stopColor="#070202" />
      </radialGradient>
      <radialGradient id={`${u}-sc`} cx="50%" cy="42%" r="62%">
        <stop offset="0%" stopColor="#fdf9ec" /><stop offset="45%" stopColor="#f2e7d0" /><stop offset="78%" stopColor="#d8c6a6" /><stop offset="100%" stopColor="#99805c" />
      </radialGradient>
      <radialGradient id={`${u}-ir`} cx="44%" cy="38%" r="70%">
        <stop offset="0%" stopColor="#ff5238" /><stop offset="30%" stopColor="#e01c10" /><stop offset="62%" stopColor="#970808" /><stop offset="100%" stopColor="#3c0202" />
      </radialGradient>
      <radialGradient id={`${u}-gl`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255,60,40,.55)" /><stop offset="100%" stopColor="rgba(255,60,40,0)" />
      </radialGradient>
      <radialGradient id={`${u}-dr`} cx="35%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#ff6a4f" /><stop offset="45%" stopColor="#c01008" /><stop offset="100%" stopColor="#5c0303" />
      </radialGradient>
      <filter id={`${u}-b4`}><feGaussianBlur stdDeviation="4" /></filter>
      <filter id={`${u}-b9`}><feGaussianBlur stdDeviation="9" /></filter>
      <filter id={`${u}-b16`}><feGaussianBlur stdDeviation="16" /></filter>
      <clipPath id={`${u}-op`}><path d={EYE_OPEN} /></clipPath>
      <g id={`${u}-fw`}>
        <path d="M256 182 L 256 214" stroke="#ff8a5e" strokeWidth="2.6" opacity=".45" fill="none" strokeLinecap="round" />
        <path d="M268 184 L 263 215" stroke="#5e0303" strokeWidth="2.8" opacity=".6" fill="none" strokeLinecap="round" />
        <path d="M244 184 L 249 215" stroke="#ffc09a" strokeWidth="1.7" opacity=".3" fill="none" strokeLinecap="round" />
        <path d="M262 183 Q 258 200 259 214" stroke="#8f1206" strokeWidth="1.9" opacity=".5" fill="none" strokeLinecap="round" />
      </g>
    </defs>
  );
}

/* eyeball innards, clipped to the almond opening; `loader` adds blink lids */
function EyeBall({ u, loader }) {
  return (
    <g clipPath={`url(#${u}-op)`}>
      <path d={EYE_OPEN} fill={`url(#${u}-sc)`} />
      <ellipse cx="92" cy="256" rx="42" ry="62" fill="#5a2418" opacity=".45" filter={`url(#${u}-b9)`} />
      <ellipse cx="426" cy="252" rx="44" ry="58" fill="#5a2418" opacity=".4" filter={`url(#${u}-b9)`} />
      <ellipse cx="256" cy="146" rx="220" ry="74" fill="#240a06" opacity=".55" filter={`url(#${u}-b9)`} />
      {/* bloodshot veins */}
      <g fill="none" stroke="#b23327" strokeLinecap="round" opacity=".75">
        <path d="M74 250 C 112 234 138 238 168 250" strokeWidth="3" />
        <path d="M96 268 C 128 262 150 266 172 262" strokeWidth="2" />
        <path d="M438 244 C 404 230 372 236 346 248" strokeWidth="3" />
        <path d="M420 268 C 392 262 372 264 352 258" strokeWidth="2" />
        <path d="M170 320 C 200 310 216 312 232 306" strokeWidth="1.8" />
        <path d="M340 314 C 316 306 300 308 286 304" strokeWidth="1.8" />
      </g>
      {/* iris — fibres, rings, slit pupil, glossy speculars */}
      <g className={loader ? "pk3d-iris" : undefined}>
        <circle cx="256" cy="246" r="92" fill={`url(#${u}-gl)`} />
        <circle cx="256" cy="246" r="76" fill={`url(#${u}-ir)`} />
        {FIB_ANGLES.map((a) => (
          <use key={a} href={`#${u}-fw`} transform={a ? `rotate(${a} 256 246)` : undefined} />
        ))}
        <circle cx="256" cy="246" r="52" fill="none" stroke="#ff5238" strokeWidth="10" opacity=".18" filter={`url(#${u}-b4)`} />
        <circle cx="256" cy="246" r="76" fill="none" stroke="#160101" strokeWidth="9" opacity=".9" filter={`url(#${u}-b4)`} />
        <circle cx="256" cy="246" r="30" fill="none" stroke="#1c0101" strokeWidth="8" opacity=".7" filter={`url(#${u}-b4)`} />
        <path d="M256 180 C 236 214 236 278 256 314 C 276 278 276 214 256 180 Z" fill="#080101" filter={`url(#${u}-b4)`} />
        <path d="M256 186 C 240 216 240 276 256 308 C 272 276 272 216 256 186 Z" fill="#040000" />
        <ellipse cx="222" cy="200" rx="30" ry="17" transform="rotate(-26 222 200)" fill="#fff" opacity=".8" filter={`url(#${u}-b4)`} />
        <circle cx="214" cy="196" r="8" fill="#fff" opacity=".95" />
        <circle cx="298" cy="292" r="9" fill="#fff" opacity=".3" filter={`url(#${u}-b4)`} />
      </g>
      {/* wet lower-lid light */}
      <path d="M120 300 Q 256 366 396 296" stroke="#fff" strokeWidth="7" fill="none" opacity=".3" filter={`url(#${u}-b9)`} />
      {loader && (
        <>
          <g className="pk3d-tlid"><path d={EYE_OPEN} fill="#1e0a0c" /></g>
          <g className="pk3d-blid"><path d={EYE_OPEN} fill="#170709" /></g>
        </>
      )}
    </g>
  );
}

/* lids, lashes, duct and the blood tear — drawn over the eyeball */
function EyeFace({ u }) {
  return (
    <>
      <path d="M60 252 q 16 -12 30 -1 q -13 15 -30 1 Z" fill="#8e2016" />
      <circle cx="76" cy="250" r="3.4" fill="#ffb9a6" opacity=".8" />
      <path d="M60 252 Q 250 106 452 246" fill="none" stroke="#1c0705" strokeWidth="16" strokeLinecap="round" />
      <path d="M60 252 Q 250 106 452 246" fill="none" stroke="#a91607" strokeWidth="5" strokeLinecap="round" opacity=".85" />
      <path d="M60 252 Q 258 378 452 246" fill="none" stroke="#2a0c08" strokeWidth="11" strokeLinecap="round" />
      <path d="M84 266 Q 258 362 430 258" fill="none" stroke="#e98a74" strokeWidth="3.4" opacity=".5" />
      {/* thorn lashes */}
      <g fill="#150304">
        <path d="M110 212 Q 92 186 80 170 Q 100 184 122 206 Z" />
        <path d="M168 186 Q 158 158 146 142 Q 168 160 180 184 Z" />
        <path d="M226 174 Q 220 146 214 128 Q 234 148 240 172 Z" />
        <path d="M266 174 Q 272 144 278 126 Q 284 150 280 174 Z" />
        <path d="M324 184 Q 338 156 350 140 Q 340 166 338 186 Z" />
        <path d="M384 206 Q 402 180 416 166 Q 402 190 396 210 Z" />
        <path d="M424 228 Q 444 208 458 198 Q 442 218 434 236 Z" />
      </g>
      {/* blood tear — tapered trail + glossy drop */}
      <path d="M268 330 C 260 358 266 384 261 406 C 259 417 259 424 261 430 L 268 429 C 272 408 274 386 275 362 C 275 346 272 337 268 330 Z" fill="#9c0f07" />
      <path d="M258 428 C 242 456 240 474 257 485 C 274 474 272 455 258 428 Z" fill={`url(#${u}-dr)`} />
      <ellipse cx="250" cy="460" rx="4.5" ry="7" transform="rotate(-15 250 460)" fill="#fff" opacity=".55" />
    </>
  );
}

export function EyeLogo({ size = 32, tile = true, className = "", style }) {
  const u = nextId("eye");
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className}
      style={style} role="img" aria-label="Pretika" focusable="false">
      <EyeDefs u={u} />
      {tile && (
        <>
          <rect width="512" height="512" rx="110" fill={`url(#${u}-bg)`} />
          <ellipse cx="256" cy="468" rx="210" ry="64" fill={`url(#${u}-gl)`} opacity=".6" />
          <ellipse cx="256" cy="398" rx="175" ry="34" fill="#000" opacity=".5" filter={`url(#${u}-b16)`} />
        </>
      )}
      <EyeBall u={u} />
      <EyeFace u={u} />
    </svg>
  );
}

/* --------------------------------------------------------- Eye loader ------ */
/* Background-less blinking eye for slow loads: lids blink, iris glances
   around, the under-glow breathes (CSS in index.css, `pk3d-*`). */
export function EyeLoader({ size = 110, className = "", style, label = "Loading" }) {
  const u = nextId("eyeld");
  return (
    <div className={`pk3d-loader ${className}`} style={style} role="status" aria-label={label}>
      <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden focusable="false">
        <EyeDefs u={u} />
        <g className="pk3d-breath">
          <ellipse className="pk3d-glowpulse" cx="256" cy="410" rx="150" ry="30" fill={`url(#${u}-gl)`} />
          <EyeBall u={u} loader />
          <EyeFace u={u} />
        </g>
      </svg>
    </div>
  );
}

/* Full-page centred variant — drop-in replacement for page skeletons. */
export function PageLoader({ label, minHeight = "60dvh" }) {
  return (
    <div style={{ minHeight, display: "grid", placeItems: "center" }}>
      <EyeLoader size={120} label={label} />
    </div>
  );
}

/* ---------------------------------------------------------------- Moon ----- */
/* Glowing crescent moon. The dark side is masked to transparent, so it sits
   beautifully on ANY background (light auth badge or dark hero). */
let _uid = 0;
const nextId = (p) => `${p}-${(_uid++).toString(36)}`;

export function Moon({ size = 56, className = "", style, glow = true }) {
  const u = nextId("moon");
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}
      style={style} role="img" aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${u}-face`} cx="36%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="52%" stopColor="#eceafb" />
          <stop offset="100%" stopColor="#b5aeea" />
        </radialGradient>
        <radialGradient id={`${u}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(173,162,255,.6)" />
          <stop offset="60%" stopColor="rgba(150,138,240,.22)" />
          <stop offset="100%" stopColor="rgba(150,138,240,0)" />
        </radialGradient>
        <mask id={`${u}-crescent`}>
          <rect width="100" height="100" fill="black" />
          <circle cx="49" cy="51" r="33" fill="white" />
          <circle cx="66" cy="40" r="29" fill="black" />
        </mask>
      </defs>
      {glow && <circle cx="49" cy="51" r="48" fill={`url(#${u}-glow)`} />}
      <g mask={`url(#${u}-crescent)`}>
        <circle cx="49" cy="51" r="33" fill={`url(#${u}-face)`} />
        <g fill="#c8c1ee" opacity=".75">
          <circle cx="38" cy="40" r="3.6" />
          <circle cx="33" cy="57" r="5" />
          <circle cx="44" cy="65" r="2.6" />
          <circle cx="30" cy="46" r="2.2" />
        </g>
      </g>
    </svg>
  );
}

/* --------------------------------------------------------------- Candle ---- */
/* Wax candle with a living flame (flicker + halo via CSS, see index.css). */
export function Candle({ size = 110, className = "", style }) {
  const u = nextId("cd");
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 120 180" className={className}
      style={style} role="img" aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${u}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,196,92,.85)" />
          <stop offset="45%" stopColor="rgba(255,150,40,.35)" />
          <stop offset="100%" stopColor="rgba(255,150,40,0)" />
        </radialGradient>
        <radialGradient id={`${u}-fout`} cx="50%" cy="86%" r="72%">
          <stop offset="0%" stopColor="#ffe07a" />
          <stop offset="42%" stopColor="#ff8a1e" />
          <stop offset="100%" stopColor="#e23200" />
        </radialGradient>
        <radialGradient id={`${u}-fin`} cx="50%" cy="88%" r="66%">
          <stop offset="0%" stopColor="#fff6c8" />
          <stop offset="70%" stopColor="#ffb515" />
          <stop offset="100%" stopColor="#ff8a00" />
        </radialGradient>
        <linearGradient id={`${u}-wax`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff8ec" />
          <stop offset="30%" stopColor="#f7e9cd" />
          <stop offset="62%" stopColor="#ecd6ad" />
          <stop offset="100%" stopColor="#d9bd8c" />
        </linearGradient>
      </defs>

      {/* warm halo */}
      <ellipse className="pk-halo" cx="60" cy="42" rx="50" ry="44" fill={`url(#${u}-halo)`} />

      {/* candle body */}
      <path d="M44 78 Q44 74 48 74 L72 74 Q76 74 76 78 L76 162 Q76 168 70 168 L50 168 Q44 168 44 162 Z"
        fill={`url(#${u}-wax)`} />
      {/* soft melted top + drips */}
      <ellipse cx="60" cy="76" rx="16" ry="5.5" fill="#fff8ec" />
      <ellipse cx="60" cy="76" rx="16" ry="5.5" fill="none" stroke="#e7cfa3" strokeWidth="1" opacity=".7" />
      <path d="M47 82 q3 14 0 20 q-4 -3 -3 -12 z" fill="#f3e3c4" opacity=".9" />
      {/* left sheen */}
      <rect x="49" y="80" width="4.5" height="80" rx="2.2" fill="#fffdf7" opacity=".55" />

      {/* wick */}
      <path d="M60 76 q-2 -8 0 -16" fill="none" stroke="#4a3422" strokeWidth="2.4" strokeLinecap="round" />

      {/* flame (animated group) */}
      <g className="pk-flame">
        <path d="M60 14 C 47 32, 43 48, 51 58 C 55 63, 65 63, 69 58 C 77 48, 73 32, 60 14 Z"
          fill={`url(#${u}-fout)`} />
        <path d="M60 27 C 52 39, 50 50, 56 57 C 59 60, 61 60, 64 57 C 70 49, 67 39, 60 27 Z"
          fill={`url(#${u}-fin)`} />
        <ellipse cx="60" cy="52" rx="4" ry="7.5" fill="#fffdf2" />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- Ghost ---- */
export function Spook({ size = 88, className = "", style, tone = "light" }) {
  const u = nextId("gh");
  const body = tone === "light" ? "#f3f1ff" : "#2a2535";
  const edge = tone === "light" ? "#d9d4f5" : "#1b1726";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}
      style={style} role="img" aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${u}-g`} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="rgba(127,119,221,.5)" />
          <stop offset="100%" stopColor="rgba(127,119,221,0)" />
        </radialGradient>
        <linearGradient id={`${u}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={body} />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="52" rx="46" ry="46" fill={`url(#${u}-g)`} />
      <path d="M22 58 C22 33, 36 19, 50 19 C64 19, 78 33, 78 58
               L78 82 C78 87, 73 87, 70 83 C67 79, 62 79, 59 83
               C56 87, 51 87, 48 83 C45 79, 40 79, 37 83
               C34 87, 22 88, 22 80 Z"
        fill={`url(#${u}-b)`} stroke={edge} strokeWidth="1.2" />
      <ellipse cx="40" cy="48" rx="5.2" ry="6.6" fill="#2a2535" />
      <ellipse cx="61" cy="48" rx="5.2" ry="6.6" fill="#2a2535" />
      <circle cx="38.4" cy="45.6" r="1.7" fill="#fff" />
      <circle cx="59.4" cy="45.6" r="1.7" fill="#fff" />
      <ellipse cx="50.5" cy="60" rx="4.4" ry="5.6" fill="#2a2535" opacity=".85" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Flag ----- */
/* Windows renders regional-indicator flag emoji as plain letter boxes ("IN"),
   so we draw the two flags we ship as SVG → identical on every OS. */
export function Flag({ code, size = 30, className = "", style }) {
  const u = nextId("flag");
  const common = {
    width: size, height: Math.round(size * 0.68), viewBox: "0 0 60 40",
    className, role: "img", "aria-hidden": true, focusable: "false",
    style: { borderRadius: 5, display: "block", boxShadow: "0 1px 3px rgba(0,0,0,.22)", ...style },
  };
  if (code === "hindi") {
    return (
      <svg {...common}>
        <defs><clipPath id={`${u}-c`}><rect width="60" height="40" rx="5" /></clipPath></defs>
        <g clipPath={`url(#${u}-c)`}>
          <rect width="60" height="13.34" fill="#FF9933" />
          <rect y="13.33" width="60" height="13.34" fill="#ffffff" />
          <rect y="26.66" width="60" height="13.34" fill="#138808" />
          <circle cx="30" cy="20" r="5.3" fill="none" stroke="#0a3a8f" strokeWidth="1" />
          <circle cx="30" cy="20" r="1.1" fill="#0a3a8f" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <line key={i} x1="30" y1="20" x2={(30 + 5.3 * Math.cos(a)).toFixed(2)}
              y2={(20 + 5.3 * Math.sin(a)).toFixed(2)} stroke="#0a3a8f" strokeWidth="0.5" />;
          })}
        </g>
      </svg>
    );
  }
  // english → Union Jack
  return (
    <svg {...common}>
      <defs><clipPath id={`${u}-c`}><rect width="60" height="40" rx="5" /></clipPath></defs>
      <g clipPath={`url(#${u}-c)`}>
        <rect width="60" height="40" fill="#012169" />
        <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth="8" />
        <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="3.2" />
        <path d="M30 0 V40 M0 20 H60" stroke="#fff" strokeWidth="11" />
        <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="6.5" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------- Haveli skyline ---- */
/* Silhouette strip for the auth night scene: shraapit haveli with ONE lit,
   flickering window, a dead tree, leaning graves and bobbing bats. Bottom-
   anchored (preserveAspectRatio) so it hugs the panel floor at any width. */
const BAT = "M0 4 Q4 -2 9 2 Q10 -3 13 -3 Q16 -3 17 2 Q22 -2 26 4 Q19 5 13 11 Q7 5 0 4 Z";
export function HaveliSkyline({ className = "", style }) {
  const u = nextId("hv");
  return (
    <svg className={className} style={style} viewBox="0 0 1200 260" width="100%"
      preserveAspectRatio="xMidYMax slice" role="img" aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${u}-win`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffc26b" />
          <stop offset="100%" stopColor="#ff6a1e" />
        </radialGradient>
        <radialGradient id={`${u}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,150,60,.5)" />
          <stop offset="100%" stopColor="rgba(255,150,60,0)" />
        </radialGradient>
      </defs>

      {/* ground */}
      <path d="M0 230 Q150 219 330 225 T690 222 T1030 227 L1200 224 L1200 260 L0 260 Z" fill="#080302" />

      {/* haveli — hall + two domed towers + tattered pennant */}
      <g fill="#0c0404">
        <rect x="128" y="124" width="156" height="106" />
        <path d="M118 124 L206 84 L294 124 Z" />
        <rect x="86" y="142" width="44" height="90" />
        <path d="M84 142 Q108 102 132 142 Z" />
        <rect x="284" y="100" width="48" height="132" />
        <path d="M282 100 Q308 56 334 100 Z" />
        <path d="M308 62 L308 38" stroke="#0c0404" strokeWidth="3.5" />
        <path d="M308 40 L330 47 L308 54 Z" />
      </g>

      {/* dark arched windows + door */}
      <g fill="#1c0705">
        <path d="M150 178 v-10 a8 8 0 0 1 16 0 v10 z" />
        <path d="M240 178 v-10 a8 8 0 0 1 16 0 v10 z" />
        <path d="M194 230 v-32 a12 12 0 0 1 24 0 v32 z" />
        <circle cx="206" cy="106" r="6" />
        <path d="M101 192 v-8 a7 7 0 0 1 14 0 v8 z" />
      </g>

      {/* the ONE lit window — koi jaag raha hai */}
      <g className="flicker">
        <circle cx="308" cy="152" r="20" fill={`url(#${u}-halo)`} />
        <path d="M300 162 v-11 a8 8 0 0 1 16 0 v11 z" fill={`url(#${u}-win)`} />
      </g>

      {/* dead tree */}
      <g stroke="#0a0303" fill="none" strokeLinecap="round">
        <path d="M1010 228 C1006 194 1016 168 1004 138" strokeWidth="11" />
        <path d="M1006 168 C988 152 982 136 958 128" strokeWidth="5" />
        <path d="M1008 186 C1028 172 1036 162 1058 156" strokeWidth="5" />
        <path d="M1004 138 C1000 120 1006 110 996 92" strokeWidth="4" />
        <path d="M958 128 C948 122 942 112 928 110" strokeWidth="3" />
        <path d="M1058 156 C1068 150 1078 148 1088 138" strokeWidth="3" />
        <path d="M996 92 C992 82 994 74 988 64" strokeWidth="2.5" />
      </g>

      {/* leaning graves */}
      <g fill="#0c0404">
        <path d="M1112 230 v-24 a10 10 0 0 1 20 0 v24 z" transform="rotate(-7 1122 230)" />
        <path d="M1152 230 v-17 a8 8 0 0 1 16 0 v17 z" transform="rotate(6 1160 230)" />
      </g>

      {/* bats (outer g positions, inner path bobs — CSS transform won't clash) */}
      <g fill="#120505">
        <g transform="translate(430 66)"><path className="pk-bat" d={BAT} /></g>
        <g transform="translate(690 44) scale(0.78)"><path className="pk-bat" style={{ animationDelay: "-1.6s" }} d={BAT} /></g>
        <g transform="translate(555 104) scale(0.55)"><path className="pk-bat" style={{ animationDelay: "-2.8s" }} d={BAT} /></g>
      </g>
    </svg>
  );
}

/* --------------------------------------------------- Category line icons --- */
/* Thematic lucide icons (vector → identical on every OS). Keyed by name. */
const CAT_MAP = [
  [/bhoot|ghost|aatma|spirit/i, Ghost],
  [/churail|daayan|witch/i, Wind],
  [/shaitan|demon|narak/i, Flame],
  [/haveli|haunted|mansion|घर|कोठी/i, Castle],
  [/shamshaan|graveyard|kabra|कब्र|मौत|death/i, Skull],
  [/jungle|forest|जंगल|पेड़/i, Trees],
  [/gaon|village|गांव|गाँव/i, Wheat],
  [/shaap|curse|श्राप/i, Scroll],
  [/tantrik|ritual|jadu|जादू|black\s*magic/i, Eye],
  [/psycho|thriller|kill|murder|हत्या/i, Swords],
  [/revenge|blood|खून|बदला/i, Droplet],
  [/suspense|mystery|रहस्य/i, Tornado],
  [/love|romance|प्यार|इश्क/i, Heart],
  [/true|real|सच्ची|किताब/i, BookOpen],
];
const CAT_POOL = [Ghost, Skull, Flame, Castle, Droplet, Swords, Wind, Trees, Scroll, Eye];

export function CategoryIcon({ name = "", size = 15, ...rest }) {
  let Cmp = null;
  for (const [re, icon] of CAT_MAP) if (re.test(name)) { Cmp = icon; break; }
  if (!Cmp) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    Cmp = CAT_POOL[h % CAT_POOL.length];
  }
  return <Cmp size={size} {...rest} />;
}

/* ----------------------------------------------- Reader / creator ranks --- */
/* Vector rank crests (replaces emoji) — keyed by the API's fear-rank slug. */
const RANK_ICON = {
  // reader fear ranks (L1 → L5) — each distinct
  raat_ka_musafir: MoonStar,
  andheri_gali_explorer: Cloud,
  shamshaan_premi: Skull,
  horror_bhakt: Ghost,
  mahakaal_bhakt: Flame,
  // creator fear ranks (L1 → L6) — each distinct
  pret_aatma: UserRound,
  shraapit_lekhak: Scroll,
  andhkaar_rachnakar: Tornado,
  bhoot_samrat: Castle,
  tantrik_master: Eye,
  mahakaal_katha_samrat: Crown,
};
export function RankIcon({ rank = "", size = 24, ...rest }) {
  const Cmp = RANK_ICON[rank] || Ghost;
  return <Cmp size={size} {...rest} />;
}

export { Sparkles };
