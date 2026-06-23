"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function NewOpportunityPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    sport: "",
    location: "",
    description: "",
    requirements: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/");
        return;
      }
      if (userData?.role !== "club") {
        router.push("/profile");
      }
    }
  }, [user, userData, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userData?.role !== "club") return;

    setLoading(true);
    try {
      await addDoc(collection(db, "opportunities"), {
        clubId: user.uid,
        clubName: userData.clubProfile?.clubName || "Club",
        title: formData.title,
        sport: formData.sport,
        location: formData.location,
        description: formData.description,
        requirements: formData.requirements,
        status: "active",
        createdAt: serverTimestamp(),
      });
      router.push("/profile");
    } catch (error) {
      console.error("Error creating opportunity:", error);
      alert("Hubo un error al crear la búsqueda.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-[#1a1a1a] p-8 rounded-2xl border border-[#333]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold font-poppins">Nueva Búsqueda</h1>
          <Link href="/profile" className="text-gray-400 hover:text-white">
            Cancelar
          </Link>
        </div>

        <p className="text-gray-400 mb-8">
          Publica una nueva oportunidad para encontrar el talento que tu club necesita.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Título de la Búsqueda *</label>
            <input 
              required 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" 
              placeholder="Ej. Prueba de jugadores Categoría 2005" 
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Deporte *</label>
              <select 
                required 
                name="sport" 
                value={formData.sport} 
                onChange={handleChange} 
                className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green"
              >
                <option value="">Selecciona...</option>
                <option value="Fútbol">Fútbol</option>
                <option value="Futsal">Futsal</option>
                <option value="Básquet">Básquet</option>
                <option value="Vóley">Vóley</option>
                <option value="Hockey">Hockey</option>
                <option value="Handball">Handball</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Ubicación / Predio *</label>
              <input 
                required 
                type="text" 
                name="location" 
                value={formData.location} 
                onChange={handleChange} 
                className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" 
                placeholder="Ej. Rosario, Santa Fe" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Descripción *</label>
            <textarea 
              required 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={4} 
              className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green resize-none" 
              placeholder="Describe qué están buscando. Ej. Buscamos defensores centrales para el torneo regional..."
            ></textarea>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Requisitos (Opcional)</label>
            <textarea 
              name="requirements" 
              value={formData.requirements} 
              onChange={handleChange} 
              rows={3} 
              className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green resize-none" 
              placeholder="Ej. Llevar apto físico, venir con botines sin tapones de aluminio..."
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full mt-4 bg-justo-green text-justo-white py-4 rounded-xl font-bold hover:bg-justo-dark-green transition-colors disabled:opacity-50"
          >
            {loading ? "Publicando..." : "Publicar Búsqueda"}
          </button>
        </form>
      </div>
    </div>
  );
}
