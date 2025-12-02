// DashboardPage.tsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { Copy, Users, Loader, Edit2, Check, X, Save } from "lucide-react";

function endOfDayISO(dateStr: string | null) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const d = new Date(year, month, day, 23, 59, 59, 999); // local end of day
  return d.toISOString();
}

function formatDateForInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // yyyy-mm-dd local
}

const DashboardPage: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [creating, setCreating] = useState(false);

  // quick join
  const [inviteCodeQuick, setInviteCodeQuick] = useState("");
  const [joiningQuick, setJoiningQuick] = useState(false);

  // personal task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState(""); // yyyy-mm-dd
  const [creatingTask, setCreatingTask] = useState(false);

  // edit modal
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await api.get("/groups");
      setGroups(res.data || []);
    } catch (err) {
      console.error("Erreur fetchGroups:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await api.get("/tasks");
      setTasks(res.data || []);
    } catch (err) {
      console.error("Erreur fetchTasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/groups", { name: name.trim() });
      setGroups((prev) => [res.data, ...prev]);
      setName("");
      await fetchTasks();
      alert("Groupe créé avec succès !");
    } catch (err: any) {
      console.error("Erreur création groupe:", err);
      alert(err?.response?.data?.message || "Erreur lors de la création du groupe");
    } finally {
      setCreating(false);
    }
  };

  const handleQuickJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteCodeQuick.trim()) return alert("Entre un code d'invitation valide");
    setJoiningQuick(true);
    try {
      await api.post(`/groups/join/${inviteCodeQuick.trim()}`);
      await fetchGroups();
      await fetchTasks();
      setInviteCodeQuick("");
      alert("Groupe rejoint !");
    } catch (err: any) {
      console.error("Erreur rejoindre:", err);
      alert(err?.response?.data?.message || "Erreur lors de la jonction");
    } finally {
      setJoiningQuick(false);
    }
  };

  const createPersonalTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return alert("Titre requis");
    setCreatingTask(true);
    try {
      const res = await api.post("/tasks", {
        title: taskTitle.trim(),
        description: taskDesc || null,
        deadline: endOfDayISO(taskDate || null),
      });

      if (res && res.data) {
        setTasks((prev) => [res.data, ...prev]);
      } else {
        await fetchTasks();
      }

      setTaskTitle("");
      setTaskDesc("");
      setTaskDate("");
      alert("Tâche personnelle créée !");
    } catch (err: any) {
      console.error("Erreur création tâche perso:", err);
      alert(err?.response?.data?.message || "Erreur lors de la création de la tâche");
    } finally {
      setCreatingTask(false);
    }
  };

  const copyInvite = async (invite: string) => {
    try {
      await navigator.clipboard.writeText(invite);
      alert("Invite copiée !");
    } catch {
      alert("Impossible de copier");
    }
  };

  // -----------------------
  // Handlers for personal tasks: toggle, delete, edit
  // -----------------------

  // Identify personal tasks: task without group (backend returns group:null for personal)
  const personalTasks = tasks.filter((t) => !t.group);

  const toggleCompletePersonal = async (task: any) => {
    try {
      const isDone = task.status === "TERMINE";
      const newStatus = isDone ? "EN_COURS" : "TERMINE";
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      // update local state optimistically
      setTasks((prev) => prev.map((p) => (p._id === task._id ? { ...p, status: newStatus } : p)));
    } catch (err: any) {
      console.error("Erreur mise à jour statut :", err);
      alert(err?.response?.data?.message || "Erreur lors de la mise à jour du statut");
    }
  };

  const handleDeletePersonalTask = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche personnelle ?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err: any) {
      console.error("Erreur suppression tâche perso :", err);
      alert(err?.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const openEditPersonalTask = (task: any) => {
    setEditingTask({
      ...task,
      // prefill date input with yyyy-mm-dd
      _localDate: formatDateForInput(task.deadline),
    });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    if (!editingTask.title?.trim()) return alert("Titre requis");
    setEditLoading(true);
    try {
      const payload: any = {
        title: editingTask.title.trim(),
        description: editingTask.description?.trim() || null,
        deadline: editingTask._localDate ? endOfDayISO(editingTask._localDate) : null,
      };

      const res = await api.put(`/tasks/${editingTask._id}`, payload);

      const updated = res.data;
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));

      setEditingTask(null);
      alert("Tâche mise à jour !");
    } catch (err: any) {
      console.error("Erreur modification tâche perso :", err);
      alert(err?.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setEditLoading(false);
    }
  };

  // -----------------------
  // Render
  // -----------------------
  return (
    <div className="animate-fadeIn p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Tableau de bord</h1>
        <p className="text-gray-500">Gère tes groupes et tâches personnelles</p>
      </div>

      {/* Quick join */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex gap-3 items-center">
          <input
            value={inviteCodeQuick}
            onChange={(e) => setInviteCodeQuick(e.target.value)}
            placeholder="Entrer le code d'invitation"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none"
          />
          <button
            onClick={() => handleQuickJoin()}
            disabled={joiningQuick}
            className="px-4 py-3 bg-orange-500 text-white rounded-xl"
          >
            {joiningQuick ? "Connexion..." : "Rejoindre"}
          </button>
        </div>
      </div>

      {/* Create group */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Créer un nouveau groupe</h2>
        <form onSubmit={create} className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du groupe"
            disabled={creating}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl"
          >
            {creating ? "Création..." : "Créer"}
          </button>
        </form>
      </div>

      {/* Groups list */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Mes groupes</h2>
        {loadingGroups ? (
          <div className="flex items-center justify-center py-6">
            <Loader className="animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users />
            </div>
            <p className="text-gray-600">Aucun groupe pour l'instant</p>
            <p className="text-gray-400 mt-2">Crée-en un pour commencer !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g) => (
              <div key={g._id} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Users />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{g.name}</h3>
                      <div className="text-xs text-gray-500">{(g.members?.length || 0)} membre(s)</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">#{String(g._id).slice(-6)}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      copyInvite(g.inviteLink);
                    }}
                    className="flex-1 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <Copy className="inline-block mr-2" /> Copier
                  </button>
                  <Link to={`/groups/${g._id}`} className="px-4 py-2 bg-orange-500 text-white rounded-lg">
                    Voir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal task form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ajouter une tâche personnelle</h2>
        <form onSubmit={createPersonalTask} className="space-y-3">
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Titre de la tâche"
            className="w-full px-4 py-3 rounded-xl border border-gray-200"
          />
          <input
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            placeholder="Description (optionnel)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200"
          />
          <div className="flex gap-2 items-center">
            <input
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              type="date"
              className="px-4 py-2 rounded-xl border border-gray-200"
            />
            <button disabled={creatingTask} className="px-4 py-2 bg-orange-500 text-white rounded-xl">
              {creatingTask ? "Création..." : "Créer tâche perso"}
            </button>
          </div>
        </form>
      </div>

      {/* Personal tasks list (styled like your Task component) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Mes tâches personnelles</h2>
        {loadingTasks ? (
          <div className="flex items-center justify-center py-6">
            <Loader className="animate-spin" />
          </div>
        ) : personalTasks.length === 0 ? (
          <div className="text-gray-500">Aucune tâche personnelle pour l'instant.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalTasks.map((t) => {
              const isDone = t.status === "TERMINE";
              return (
                <div
                  key={t._id}
                  className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
                    isDone ? "border-green-200 bg-green-50/30" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Toggle complete (left) */}
                    <button
                      onClick={() => toggleCompletePersonal(t)}
                      className={`mt-1 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        isDone ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-orange-400"
                      }`}
                      title={isDone ? "Marquer comme non terminé" : "Marquer comme terminé"}
                    >
                      {isDone ? <Check size={16} className="text-white" /> : null}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${isDone ? "text-gray-500 line-through" : "text-gray-800"}`}>{t.title}</h3>
                      {t.description && <p className="text-gray-500 text-sm mt-1">{t.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {t.deadline && <span>Deadline: {new Date(t.deadline).toLocaleString()}</span>}
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{t.status}</span>
                      </div>
                    </div>

                    {/* Actions (right) */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditPersonalTask(t)}
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeletePersonalTask(t._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Group tasks (read-only view) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tâches de groupe</h2>
        {loadingTasks ? (
          <div className="flex items-center justify-center py-6">
            <Loader className="animate-spin" />
          </div>
        ) : tasks.filter((t) => t.group).length === 0 ? (
          <div className="text-gray-500">Aucune tâche de groupe pour l'instant.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks
              .filter((t) => t.group)
              .map((t) => (
                <div key={t._id} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{t.title}</h3>
                      {t.description && <p className="text-gray-500 text-sm mt-1">{t.description}</p>}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        {t.deadline && <span>Deadline: {new Date(t.deadline).toLocaleString()}</span>}
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{t.status}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">#{String(t.group._id || t.group).slice(-6)}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Edit modal for personal task (kept as before) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancelEdit} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Modifier la tâche</h3>
              <button onClick={handleCancelEdit} className="p-2 rounded hover:bg-gray-100"><X /></button>
            </div>

            <div className="space-y-3">
              <input
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />
              <input
                value={editingTask.description || ""}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />
              <input
                type="date"
                value={editingTask._localDate || ""}
                onChange={(e) => setEditingTask({ ...editingTask, _localDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />

              <div className="flex gap-2 justify-end">
                <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-100 rounded-xl">Annuler</button>
                <button onClick={handleSaveEdit} disabled={editLoading} className="px-4 py-2 bg-orange-500 text-white rounded-xl flex items-center gap-2">
                  <Save />
                  {editLoading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default DashboardPage;
