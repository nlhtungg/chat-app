import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import CallHistoryPage from "./pages/CallHistoryPage";
import VideoCall from "./components/VideoCall";
import IncomingCallNotification from "./components/IncomingCallNotification";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  console.log({ onlineUsers });
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  // Handle OAuth redirect with success/error query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success === 'true') {
      // OAuth login was successful
      toast.success("Logged in successfully with social account");
      checkAuth(); // Refresh user data after OAuth login
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error === 'true') {
      // OAuth login failed
      toast.error("Social login failed. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [checkAuth]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/calls" element={authUser ? <CallHistoryPage /> : <Navigate to="/login" />} />
        <Route path="/video-call/:callId" element={authUser ? <VideoCall /> : <Navigate to="/login" />} />
      </Routes>

      {/* Show incoming call notification if user is authenticated */}
      {authUser && <IncomingCallNotification />}

      <Toaster />
    </div>
  );
};
export default App;