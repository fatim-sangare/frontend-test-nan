import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { UserPlus, Loader } from "lucide-react";

const JoinGroupPage: React.FC = () => {
  const [invite, setInvite] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/groups/join/${invite.trim()}`);
      alert('Groupe rejoint avec succès !');
      // The API returns { message, group }
      navigate(`/groups/${res.data.group._id}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la jonction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <UserPlus className="text-orange-600" size={32} />
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Rejoindre un groupe
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Entrez le code d'invitation
        </p>

        <form onSubmit={join} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code d'invitation
            </label>
            <input
              value={invite}
              onChange={e => setInvite(e.target.value)}
              placeholder="ABC123"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-center font-mono text-lg uppercase"
            />
          </div>

          <button
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Connexion...
              </>
            ) : (
              'Rejoindre le groupe'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
          >
            Annuler
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default JoinGroupPage;
