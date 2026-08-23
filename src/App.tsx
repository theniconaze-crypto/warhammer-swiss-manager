import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/Layout";
import { RequirePermission } from "./components/RequirePermission";
import { Login } from "./routes/Login";
import { UserManagement } from "./routes/UserManagement";
import { Home } from "./routes/Home";
import { TournamentCreate } from "./routes/TournamentCreate";
import { TournamentDetail } from "./routes/TournamentDetail";
import { RoundView } from "./routes/RoundView";
import { PlayerProfile } from "./routes/PlayerProfile";
import { GlobalPlayers } from "./routes/GlobalPlayers";
import { Standings } from "./routes/Standings";
import { SettingsPage } from "./routes/SettingsPage";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const { hydrated, ensureSeedAdmin, currentUserId } = useAuthStore();

  useEffect(() => {
    if (!hydrated) ensureSeedAdmin();
  }, [hydrated, ensureSeedAdmin]);

  if (!hydrated) return null;

  if (!currentUserId) {
    return (
      <HashRouter>
        <Login />
        <Toaster position="top-center" />
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/tournament/new"
            element={
              <RequirePermission permission="manage_tournaments">
                <TournamentCreate />
              </RequirePermission>
            }
          />
          <Route
            path="/tournament/:id"
            element={
              <RequirePermission permission="manage_tournaments">
                <TournamentDetail />
              </RequirePermission>
            }
          />
          <Route
            path="/tournament/:id/round/:roundNumber"
            element={
              <RequirePermission permission="manage_tournaments">
                <RoundView />
              </RequirePermission>
            }
          />
          <Route
            path="/tournament/:tournamentId/player/:playerId"
            element={
              <RequirePermission permission="manage_tournaments">
                <PlayerProfile />
              </RequirePermission>
            }
          />
          <Route path="/standings" element={<Standings />} />
          <Route
            path="/players"
            element={
              <RequirePermission permission="manage_players">
                <GlobalPlayers />
              </RequirePermission>
            }
          />
          <Route
            path="/settings"
            element={
              <RequirePermission permission="manage_settings">
                <SettingsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/users"
            element={
              <RequirePermission permission="manage_users">
                <UserManagement />
              </RequirePermission>
            }
          />
        </Routes>
      </Layout>
      <Toaster position="top-center" />
    </HashRouter>
  );
}
