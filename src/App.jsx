import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import { Toast } from "./components/ui";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Browse from "./pages/Browse";
import ProfileDetails from "./pages/ProfileDetails";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import InterestRequests from "./pages/InterestRequests";
import Favourites from "./pages/Favourites";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/AdminDashboard";
import Notifications from "./pages/Notifications";
import AccountSettings from "./pages/AccountSettings";
import RecentlyViewed from "./pages/RecentlyViewed";

function AppShell() {
  const [page, setPage] = useState("home");
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  function navigate(target) {
    setPage(target);
    window.scrollTo(0, 0);
  }

  // Bottom nav "dashboard" key maps internally, but admin is reached via a hidden route
  const navPageKey = page === "editProfile" || page === "requests" || page === "favourites"
    || page === "notifications" || page === "accountSettings" || page === "recentlyViewed" ? "dashboard"
    : page === "profileDetails" ? "browse"
    : page;

  return (
    <Layout page={navPageKey} onNavigate={navigate}>
      <Toast message={toast} />
      {page === "home" && <Home onNavigate={navigate} />}
      {page === "register" && <Register onNavigate={navigate} showToast={showToast} />}
      {page === "login" && <Login onNavigate={navigate} showToast={showToast} />}
      {page === "browse" && <Browse onNavigate={navigate} setSelectedProfileId={setSelectedProfileId} />}
      {page === "profileDetails" && (
        <ProfileDetails profileId={selectedProfileId} onNavigate={navigate} showToast={showToast} />
      )}
      {page === "dashboard" && <Dashboard onNavigate={navigate} showToast={showToast} />}
      {page === "editProfile" && <EditProfile onNavigate={navigate} showToast={showToast} />}
      {page === "requests" && (
        <InterestRequests onNavigate={navigate} setSelectedProfileId={setSelectedProfileId} showToast={showToast} />
      )}
      {page === "favourites" && (
        <Favourites onNavigate={navigate} setSelectedProfileId={setSelectedProfileId} />
      )}
      {page === "contact" && <Contact showToast={showToast} />}
      {page === "notifications" && (
        <Notifications onNavigate={navigate} setSelectedProfileId={setSelectedProfileId} />
      )}
      {page === "accountSettings" && <AccountSettings onNavigate={navigate} showToast={showToast} />}
      {page === "recentlyViewed" && (
        <RecentlyViewed onNavigate={navigate} setSelectedProfileId={setSelectedProfileId} />
      )}
      {page === "admin" && (
        <AdminDashboard onNavigate={navigate} setSelectedProfileId={setSelectedProfileId} showToast={showToast} />
      )}

      {page !== "admin" && (
        <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
          <button onClick={() => navigate("admin")} style={{
            background: "none", border: "none", fontSize: 11.5, color: "#8a7a63", textDecoration: "underline",
          }}>
            Admin login
          </button>
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
