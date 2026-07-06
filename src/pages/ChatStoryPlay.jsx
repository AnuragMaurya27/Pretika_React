import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChatStory } from "../lib/hooks";
import { post } from "../lib/api";
import Seo from "../components/Seo";
import { EyeLoader } from "../components/Art";
import ChatStoryReader from "../components/chatstory/ChatStoryReader";
import { normalizeChatStory, SAMPLE_CHAT_STORY } from "../components/chatstory/chatStorySchema";

/**
 * Full-screen chat-story player. Lives OUTSIDE <Layout/> on purpose: the
 * page-transition filter would trap the fixed stage, and the phone must own
 * the whole viewport — no nav, no footer, just someone else's phone.
 * `/chat-stories/demo` plays the bundled sample JSON (schema example page).
 */
export default function ChatStoryPlay() {
  const { slug } = useParams();
  const nav = useNavigate();
  const isDemo = slug === "demo";
  const { data, isLoading, isError } = useChatStory(isDemo ? null : slug);
  const story = isDemo ? SAMPLE_CHAT_STORY : normalizeChatStory(data);

  // count the view once per open (fire-and-forget)
  const counted = useRef(false);
  useEffect(() => {
    if (!isDemo && data?.id && !counted.current) {
      counted.current = true;
      post(`/chat-stories/${data.id}/view`).catch(() => {});
    }
  }, [isDemo, data]);

  const exit = () => nav("/chat-stories");

  if (!isDemo && isLoading) {
    return (
      <div className="cht-stage">
        <EyeLoader label="Chat khul rahi hai…" />
      </div>
    );
  }

  if (!isDemo && (isError || !data)) {
    return (
      <div className="cht-stage">
        <div className="center" style={{ color: "#e9edef" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Yeh chat delete ho chuki hai…
          </div>
          <div style={{ color: "#8696a0", fontSize: 13.5, marginBottom: 18 }}>
            ya shayad kabhi thi hi nahi.
          </div>
          <button className="cht-end-btn primary" onClick={exit}>
            Aur kahaniyan
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={isDemo ? "Chat Story Demo" : story.title}
        description={
          story.description ||
          `${story.contactName} ki chat — ek found-footage Hindi horror kahani. Kisi aur ka phone, kisi aur ki raat.`
        }
        path={`/chat-stories/${slug}`}
        type="article"
        robots={isDemo ? "noindex, follow" : undefined}
      />
      <ChatStoryReader
        story={story}
        onExit={exit}
        shareUrl={`https://pretika.in/chat-stories/${slug}`}
      />
    </>
  );
}
