import React, { useState } from "react";
import api from "../api";
import { Check, X, Edit2, Save } from "lucide-react";

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status?: "A_FAIRE" | "EN_COURS" | "TERMINE";
  group?: string | { _id: string; name?: string };
  owner?: { _id: string; email?: string } | string;
  assignedTo?: { _id: string; email?: string } | null;
  deadline?: string | null;
}

interface TaskProps {
  task: ITask;
  onUpdated: () => void;
  onDeleted: () => void;
}

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

function formatDateForInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // yyyy-mm-dd local
}

const Task: React.FC<TaskProps> = ({ task, onUpdated, onDeleted }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [deadline, setDeadline] = useState(formatDateForInput(task.deadline)); // yyyy-mm-dd
  const [loading, setLoading] = useState(false);

  const isDone = task.status === "TERMINE";

  const toggleComplete = async () => {
    try {
      const newStatus = isDone ? "EN_COURS" : "TERMINE";
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      onUpdated();
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour:", err);
      alert(err?.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  const deleteTask = async () => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onDeleted();
    } catch (err: any) {
      console.error("Erreur lors de la suppression:", err);
      alert(err?.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const saveEdit = async () => {
    if (!title.trim()) {
      alert("Le titre ne peut pas être vide");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/tasks/${task._id}`, {
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? endOfDayISO(deadline) : null,
      });
      setEditing(false);
      onUpdated();
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde:", err);
      alert(err?.response?.data?.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setTitle(task.title);
    setDescription(task.description || "");
    setDeadline(formatDateForInput(task.deadline));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre"
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg border border-gray-200"
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              onClick={cancelEdit}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md ${isDone ? "border-green-200 bg-green-50/30" : "border-gray-200"}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={toggleComplete}
          className={`mt-1 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${isDone ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-orange-400"}`}
        >
          {isDone ? <Check size={16} className="text-white" /> : null}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${isDone ? "text-gray-500 line-through" : "text-gray-800"}`}>{task.title}</h3>
          {task.description && <p className="text-gray-500 text-sm mt-1">{task.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {task.deadline && <span>Deadline: {new Date(task.deadline).toLocaleString()}</span>}
            {task.assignedTo && <span>• Assigné à: {(task.assignedTo as any).email}</span>}
            {task.owner && <span>• Propriétaire: {(task.owner as any).email || (typeof task.owner === "string" ? task.owner : "")}</span>}
            <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{task.status}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setEditing(true)} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all" title="Modifier">
            <Edit2 size={18} />
          </button>
          <button onClick={deleteTask} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Task;
