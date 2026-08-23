import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/Layout";
import { Home } from "./routes/Home";
import { TournamentCreate } from "./routes/TournamentCreate";
import { TournamentDetail } from "./routes/TournamentDetail";
import { RoundView } from "./routes/RoundView";
import { PlayerProfile } from "./routes/PlayerProfile";
import { GlobalPlayers } from "./routes/GlobalPlayers";
import { Standings } from "./routes/Standings";
import { SettingsPage } from "./routes/SettingsPage";

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tournament/new" element={<TournamentCreate />} />
          <Route path="/tournament/:id" element={<TournamentDetail />} />
          <Route path="/tournament/:id/round/:roundNumber" element={<RoundView />} />
          <Route path="/tournament/:tournamentId/player/:playerId" element={<PlayerProfile />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/players" element={<GlobalPlayers />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
      <Toaster position="top-center" />
    </HashRouter>
  );
}
