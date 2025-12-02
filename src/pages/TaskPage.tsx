import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import Task, { ITask } from "./Task";
import { ArrowLeft, Loader } from "lucide-react";

const TaskPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<ITask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setError("taskId manquant dans l'URL");
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/tasks/${taskId}`);
        setTask(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Impossible de récupérer la tâche.");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fadeIn max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="text-red-600 mb-4">
            <p className="font-semibold text-lg mb-2">Erreur</p>
            <p>{error}</p>
          </div>
          <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2 mx-auto">
            <ArrowLeft size={20} />
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="animate-fadeIn max-w-2xl mx-auto mt-12">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-600 mb-4">Tâche introuvable</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 mx-auto">
            <ArrowLeft size={20} />
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft size={20} />
        Retour
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Détails de la tâche</h1>
        <Task task={task} onDeleted={() => navigate(-1)} onUpdated={async () => {
          const res = await api.get(`/tasks/${taskId}`);
          setTask(res.data);
        }} />
      </div>

      <style>{`
        @keyframes fadeIn { from {opacity:0; transform:translateY(10px)} to {opacity:1; transform:translateY(0)} }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default TaskPage;
