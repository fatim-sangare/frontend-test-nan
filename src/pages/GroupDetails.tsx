import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Task, { ITask } from "./Task";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Copy, Trash2, Plus, Users, Loader } from "lucide-react";

function endOfDayISO(dateStr: string | null) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const d = new Date(year, month, day, 23, 59, 59, 999);
  return d.toISOString();
}

interface IUser { _id: string; email: string }
interface IGroup { _id: string; name: string; inviteLink?: string; members: IUser[]; createdBy?: string | IUser }

const GroupDetails: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<IGroup | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<string>(""); // date-only yyyy-mm-dd
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGroup = async () => {
    if (!groupId) return;
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    if (!groupId) return;
    try {
      const res = await api.get(`/tasks/group/${groupId}`);
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !title.trim()) return;
    try {
      await api.post("/tasks", {
        title: title.trim(),
        description,
        group: groupId,
        deadline: endOfDayISO(deadline || null),
      });
      setTitle("");
      setDescription("");
      setDeadline("");
      fetchTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Erreur");
    }
  };

  const copyInvite = async () => {
    if (!group?.inviteLink) return;
    await navigator.clipboard.writeText(group.inviteLink);
    alert("Invite copiée !");
  };

  const removeMember = async (memberId: string) => {
    if (!groupId) return;
    if (!confirm("Supprimer ce membre ? Ses tâches assignées seront délier.")) return;
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      fetchGroup();
      fetchTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Erreur");
    }
  };

  const leaveGroup = async () => {
    if (!groupId) return;
    if (!confirm("Voulez-vous quitter ce groupe ?")) return;
    try {
      await api.post(`/groups/${groupId}/leave`);
      navigate("/");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Erreur");
    }
  };

  const deleteGroup = async () => {
    if (!confirm("Supprimer le groupe ? Cette action est irréversible.")) return;
    try {
      await api.delete(`/groups/${group?._id}`);
      navigate("/");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Erreur");
    }
  };

  if (loading || !group) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Retour aux groupes
      </button>

      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <div className="flex items-center gap-3 text-orange-100">
              <span className="flex items-center gap-1">
                <Users size={16} />
                {group.members.length} membre{group.members.length > 1 ? "s" : ""}
              </span>
              <span className="font-mono bg-white/20 px-3 py-1 rounded-lg text-sm">
                {group.inviteLink}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyInvite}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all flex items-center gap-2"
            >
              <Copy size={18} />
              Copier
            </button>
            {group.createdBy && user && (typeof group.createdBy === "string" ? group.createdBy === user._id : (group.createdBy as any)._id === user._id) && (
              <button
                onClick={deleteGroup}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl transition-all flex items-center gap-2"
              >
                <Trash2 size={18} />
                Supprimer
              </button>
            )}
            {group.createdBy && user && (typeof group.createdBy === "string" ? group.createdBy !== user._id : (group.createdBy as any)._id !== user._id) && (
              <button
                onClick={leaveGroup}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl transition-all"
              >
                Quitter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Nouvelle tâche</h2>
            <form onSubmit={createTask} className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la tâche"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optionnel)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              />

              <div>
                <label className="block text-sm text-gray-600 mb-2">Deadline (optionnel)</label>
                <input
                  type="date"
                  value={deadline ?? ""}
                  onChange={(e) => setDeadline(e.target.value || "")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                />
              </div>

              <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                <Plus size={20} />
                Ajouter la tâche
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tâches</h2>
            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500">Aucune tâche pour l'instant</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((t) => (
                  <Task key={t._id} task={t} onUpdated={fetchTasks} onDeleted={fetchTasks} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} />
              Membres
            </h2>
            <div className="space-y-2">
              {group.members.map((m) => (
                <div key={m._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {m.email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-gray-700">{m.email}</span>
                  </div>
                  {group.createdBy && user && (typeof group.createdBy === "string" ? group.createdBy === user._id : (group.createdBy as any)._id === user._id) && m._id !== user._id && (
                    <button
                      onClick={() => removeMember(m._id)}
                      className="text-red-500 hover:text-red-600 text-sm transition-colors"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default GroupDetails;
