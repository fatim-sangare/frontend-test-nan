// Navbar.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext"; // adapte le chemin si besoin

const Navbar: React.FC = () => {
  const { user, logout } = useAuth() as { user: any | null; logout: () => void };
  const navigate = useNavigate();

  // safe initial — protège si user ou user.email n'existe pas encore
  const email = (user && (typeof user === "object" ? (user.email ?? "") : "")) || "";
  const initial = email?.[0] ? String(email[0]).toUpperCase() : "?";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    }
  };

  return (
    <nav className="w-full bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-gray-800">
          MesTâches
        </Link>
        <Link to="/groups" className="text-sm text-gray-600 hover:text-gray-800">
          Groupes
        </Link>
        <Link to="/tasks" className="text-sm text-gray-600 hover:text-gray-800">
          Tâches
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* si user non chargé -> bouton de connexion */}
        {!user ? (
          <Link to="/auth/login" className="px-3 py-1 rounded-md bg-gray-50 border border-gray-200 text-sm">
            Se connecter
          </Link>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-medium">
                {initial}
              </div>
              <div className="text-sm text-gray-700">
                <div className="font-medium">{email ? email.split("@")[0] : "Utilisateur"}</div>
                <div className="text-xs text-gray-400">{email || ""}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
              title="Se déconnecter"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
