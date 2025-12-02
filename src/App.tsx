import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/DashboardPage";
import GroupDetails from "./pages/GroupDetails";
import JoinGroupPage from "./pages/JoinGroupPage";
import TaskPage from "./pages/TaskPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, ready } = useAuth();
  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
  if (!token) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Navbar />
        <div className="container mx-auto mt-6 px-4 pb-12">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
            <Route path="/join" element={<ProtectedRoute><JoinGroupPage /></ProtectedRoute>} />
            <Route path="/task/:taskId" element={<ProtectedRoute><TaskPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;