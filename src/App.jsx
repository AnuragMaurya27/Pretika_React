import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Forgot from "./pages/Forgot";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CreatorProfile from "./pages/CreatorProfile";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import StoryDetail from "./pages/StoryDetail";
import Reader from "./pages/Reader";
import ChatStories from "./pages/ChatStories";
import ChatStoryPlay from "./pages/ChatStoryPlay";
import CreateChatStory from "./pages/CreateChatStory";
import CreatorDashboard from "./pages/CreatorDashboard";
import MyStories from "./pages/MyStories";
import CreateStory from "./pages/CreateStory";
import BecomeCreator from "./pages/BecomeCreator";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

export default function App() {
  const init = useAuth((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<Forgot />} />
      {/* full-screen phone reader — outside Layout (no nav/footer/transition filter) */}
      <Route path="/chat-stories/:slug" element={<ChatStoryPlay />} />

      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/u/:username" element={<CreatorProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/chat-stories" element={<ChatStories />} />
        <Route path="/creator/chat-story/new" element={<ProtectedRoute><CreateChatStory /></ProtectedRoute>} />
        <Route path="/creator/chat-story/:id/edit" element={<ProtectedRoute><CreateChatStory /></ProtectedRoute>} />
        <Route path="/story/:slug" element={<StoryDetail />} />
        <Route path="/read/:storyId/:episodeId" element={<Reader />} />
        <Route path="/become-creator" element={<ProtectedRoute><BecomeCreator /></ProtectedRoute>} />
        <Route path="/creator-dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
        <Route path="/creator/stories" element={<ProtectedRoute><MyStories /></ProtectedRoute>} />
        <Route path="/creator/story/new" element={<ProtectedRoute><CreateStory /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
