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
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "1" ? "admin" : "home";
  });
  const [history, setHistory] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  function navigate(target) {
    setHistory(prev => [...prev, page]);
    setPage(target);
    window.scrollTo(0, 0);
  }

  function goBack() {
    setHistory(prev => {
      if (prev.length === 0) {
        setPage("home");
        return prev;
      }
      const next = [...prev];
      const previousPage = next.pop();
      setPage(previousPage);
      return next;
    });
    window.scrollTo(0, 0);
  }

  // Bottom nav "dashboard" key maps internally, but admin is reached via a hidden route
  const navPageKey = page === "editProfile" || page === "requests" || page === "favourites"
    || page === "notifications" || page === "accountSettings" || page === "recentlyViewed" ? "dashboard"
    : page === "profileDetails" ? "browse"
    : page;

  return (
    <Layout page={navPageKey} onNavigate={navigate} onBack={goBack}>
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
