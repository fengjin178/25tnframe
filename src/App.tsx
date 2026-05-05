import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./store/AppContext";
import { BottomNav } from "./components/BottomNav";
import { FeedPage } from "./pages/FeedPage";
import { ExplorePage } from "./pages/ExplorePage";
import { MessagesPage } from "./pages/MessagesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CharacterPage } from "./pages/CharacterPage";
import { ChatPage } from "./pages/ChatPage";
import { GroupPage } from "./pages/GroupPage";

function Shell() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/character/:characterId" element={<CharacterPage />} />
        <Route path="/chat/:characterId" element={<ChatPage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
      <Routes>
        <Route path="/chat/:characterId" element={null} />
        <Route path="/group/:groupId" element={null} />
        <Route path="*" element={<BottomNav />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  );
}
