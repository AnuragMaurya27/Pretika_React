import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import ForYouFeed from "../components/ForYouFeed";
import MobileHeaderActions from "../components/MobileHeaderActions";
import { EyeLogo } from "../components/Art";

// The dedicated Feed destination (bottom-nav / desktop-nav tab). The curated
// Home page is untouched; this is the personalized "For You" + "Following"
// surface, given its own full-page infinite-scroll home so it isn't buried.
export default function Feed() {
  const { t } = useTranslation();

  return (
    <div className="page">
      {/* Personalized → keep it out of the index (like search results). */}
      <Seo
        title={`${t("nav.feed")} — Pretika`}
        description="Your personalized Pretika feed — new horror from creators you follow plus fresh picks to discover."
        path="/feed"
        robots="noindex, follow"
      />
      <div className="page-scroll">
        {/* Mobile charcoal header — mirrors Home's, titled for this tab */}
        <header className="only-mobile" style={mHeader}>
          <div className="between" style={{ padding: "12px 16px" }}>
            <div className="row gap-10">
              <EyeLogo size={30} />
              <div className="display" style={{ color: "#fff", fontSize: 19, fontWeight: 700 }}>{t("nav.feed")}</div>
            </div>
            <MobileHeaderActions dark />
          </div>
        </header>

        {/* Desktop title */}
        <div className="only-desktop container" style={{ paddingTop: 24 }}>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{t("nav.feed")}</h1>
        </div>

        <ForYouFeed />
        <div style={{ height: 18 }} />
      </div>
    </div>
  );
}

const mHeader = { background: "linear-gradient(180deg, #2a0a07, #150605)", position: "sticky", top: 0, zIndex: 20 };
