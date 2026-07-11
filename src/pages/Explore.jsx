import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X, BadgeCheck, Flame, Sparkles, Eye, Heart, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStories, useCategories, useSearch } from "../lib/hooks";
import { StoryRow, StoryCard } from "../components/StoryCard";
import { ListItemSkeleton, SkeletonBox } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import Img from "../components/Img";
import Seo from "../components/Seo";
import { compact } from "../lib/format";
import { CategoryIcon } from "../components/Art";
import { categoryLabel } from "../lib/categories";

const SORTS = [
  { key: "trending", tKey: "explore.sortTrending", Icon: Flame },
  { key: "latest", tKey: "explore.sortLatest", Icon: Sparkles },
  { key: "most_viewed", tKey: "explore.sortMostViewed", Icon: Eye },
  { key: "most_liked", tKey: "explore.sortMostLiked", Icon: Heart },
  { key: "top_rated", tKey: "explore.sortTopRated", Icon: Star },
];

export default function Explore() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [debounced, setDebounced] = useState(q);
  const category = params.get("category") || "";
  const sort = params.get("sort") || "trending";

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 350);
    return () => clearTimeout(id);
  }, [q]);

  const cats = useCategories();
  const searching = debounced.trim().length > 1;
  const search = useSearch(debounced);
  const browse = useStories(
    // when a category is picked, drop the language filter so every story in that
    // category shows (content is mixed hindi/english/hinglish)
    { sort_by: sort, page_size: 24, ...(category ? { category, language: null } : {}) },
  );

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k !== "q") next.delete("q");
    setParams(next, { replace: true });
  };

  // SEO: category pages get their own canonical URL + title so each category
  // ranks on its own; internal search results stay out of the index.
  const activeCat = category ? (cats.data || []).find((c) => c.slug === category) : null;
  const catName = activeCat?.name || (category ? category.replace(/-/g, " ") : "");

  return (
    <div className="page">
      <Seo
        title={catName ? `${catName} — Hindi Horror Stories` : "Explore Hindi Horror Stories"}
        description={
          catName
            ? `Read the best ${catName} horror stories in Hindi on Pretika — free bhootiya kahaniyan, updated daily by independent writers.`
            : "Explore thousands of Hindi horror stories on Pretika — trending, latest, top rated. Ghost, chudail, jinn, haunted and urban-legend stories."
        }
        path={category ? `/explore?category=${category}` : "/explore"}
        keywords={catName ? `${catName.toLowerCase()} stories, ${catName.toLowerCase()} in hindi, hindi horror stories, bhootiya kahani` : undefined}
        robots={searching ? "noindex, follow" : undefined}
      />
      <div className="page-scroll">
        <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(244,239,228,.88)", backdropFilter: "saturate(180%) blur(12px)", WebkitBackdropFilter: "saturate(180%) blur(12px)", paddingTop: 12 }}>
          <div className="container">
            <div className="input-wrap">
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }}><Search size={18} /></span>
              <input className="input" style={{ paddingLeft: 42 }} placeholder={t("explore.placeholder")}
                value={q} onChange={(e) => { setQ(e.target.value); }} />
              {q && (
                <button className="input-icon-btn" onClick={() => { setQ(""); setDebounced(""); }}><X size={18} /></button>
              )}
            </div>
          </div>

          {!searching && (
            <>
              <div className="hscroll container" style={{ marginTop: 12 }}>
                <button className={`chip ${!category ? "active" : ""}`} onClick={() => setParam("category", "")}>{t("explore.all")}</button>
                {(cats.data || []).filter((c) => (c.total_stories ?? 0) > 0).map((c) => (
                  <button key={c.id} className={`chip ${category === c.slug ? "active" : ""}`} onClick={() => setParam("category", c.slug)}>
                    <CategoryIcon name={c.name} size={14} /> {categoryLabel(c)}
                  </button>
                ))}
              </div>
              <div className="hscroll container" style={{ marginTop: 8, paddingBottom: 6, borderBottom: "1px solid var(--border-solid)" }}>
                {SORTS.map((s) => (
                  <button key={s.key} className={`chip ${sort === s.key ? "active" : ""}`} onClick={() => setParam("sort", s.key)}>
                    <s.Icon size={14} /> {t(s.tKey)}
                  </button>
                ))}
              </div>
            </>
          )}
        </header>

        {/* Search results */}
        {searching ? (
          <SearchResults state={search} q={debounced} />
        ) : (
          <Browse state={browse} />
        )}
      </div>
    </div>
  );
}

function Browse({ state }) {
  const { t } = useTranslation();
  const items = state.data?.items || [];
  if (state.isLoading) return (
    <div className="container poster-grid" style={{ marginTop: 16 }}>
      {Array.from({ length: 8 }).map((_, i) => <SkeletonBox key={i} h={210} r={16} />)}
    </div>
  );
  if (!items.length) return <EmptyState title={t("explore.noStories")} sub={t("explore.tryFilter")} />;
  return (
    <div className="container poster-grid" style={{ marginTop: 16, paddingBottom: 12 }}>
      {items.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}
    </div>
  );
}

function SearchResults({ state, q }) {
  const { t } = useTranslation();
  if (state.isLoading) return <div style={{ marginTop: 8 }}>{Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)}</div>;
  const stories = state.data?.stories?.items || [];
  const users = state.data?.users || [];
  if (!stories.length && !users.length) return <EmptyState icon={<Search size={32} />} sub={t("explore.noResults", { q })} />;

  return (
    <div style={{ marginTop: 8 }}>
      {users.length > 0 && (
        <>
          <div className="section-title container" style={{ fontSize: 14, marginBottom: 6 }}>{t("explore.people")}</div>
          <div className="hscroll container" style={{ marginBottom: 8 }}>
            {users.map((u) => (
              <Link key={u.id} to={`/u/${u.username}`} style={{ textAlign: "center", width: 76 }}>
                <Img path={u.avatar_url} seed={u.username} kind="avatar" alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--indigo-50)" }} />
                <div className="row gap-4" style={{ justifyContent: "center", marginTop: 6 }}>
                  <span className="clamp-1" style={{ fontSize: 11.5, fontWeight: 600 }}>{u.display_name || u.username}</span>
                  {u.is_verified_creator && <BadgeCheck size={12} color="var(--blue)" />}
                </div>
                <div className="tertiary" style={{ fontSize: 10 }}>{compact(u.total_followers)} {t("common.followers")}</div>
              </Link>
            ))}
          </div>
          <div className="divider" style={{ margin: "4px 16px 8px" }} />
        </>
      )}
      {stories.length > 0 && (
        <>
          <div className="section-title container" style={{ fontSize: 14, marginBottom: 4 }}>{t("explore.stories")}</div>
          {stories.map((s, i) => <StoryRow key={s.id} story={s} index={i} />)}
        </>
      )}
    </div>
  );
}
