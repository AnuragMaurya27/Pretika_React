import Img from "./Img";
import { Moon, HaveliSkyline } from "./Art";

/**
 * Profile cover banner. Shows the user's uploaded cover when present, otherwise
 * a designed "daylight-horror" scene — crimson sky, a glowing moon and the
 * haunted-haveli skyline (with its one flickering lit window). Fill a positioned
 * parent such as `.pf-cover`.
 */
export default function ProfileCover({ coverUrl, id, seed }) {
  return (
    <>
      {coverUrl ? (
        <Img
          path={coverUrl}
          seed={id || seed}
          alt=""
          loading="eager"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div className="pf-cover-art" aria-hidden>
          <div className="aurora" style={{ opacity: 0.42 }} />
          <Moon size={52} className="pf-cover-moon" />
          <HaveliSkyline className="pf-cover-skyline" />
        </div>
      )}
      <div className="fog" style={{ opacity: 0.4 }} />
      <div className="pf-cover-shade" />
    </>
  );
}
