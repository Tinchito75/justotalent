"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function OpportunitiesPage() {
  const { userData } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sportFilter, setSportFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const oppsRef = collection(db, "opportunities");
      // Ideally we would order by createdAt desc, but Firestore requires a composite index for where(status) + orderBy(createdAt).
      // So for now, we just query by status and sort in memory.
      const q = query(oppsRef, where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      
      const oppsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort by creation time (newest first)
      oppsList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setOpportunities(oppsList);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    if (sportFilter && opp.sport !== sportFilter) return false;
    if (locationFilter && !opp.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-8">
      
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#1a1a1a] p-8 rounded-2xl border border-[#333]">
        <div>
          <h1 className="text-3xl font-bold font-poppins mb-2">Buscador de Oportunidades</h1>
          <p className="text-gray-400">Encuentra tu próximo desafío deportivo en los clubes de nuestra red.</p>
        </div>
        
        {userData?.role === "club" && (
          <Link href="/opportunities/new" className="bg-justo-green text-white px-6 py-3 rounded-xl font-bold hover:bg-justo-dark-green transition-colors whitespace-nowrap shadow-sm">
            + Publicar Búsqueda
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
        <div className="flex-1 flex items-center gap-2 bg-[#222] border border-[#444] rounded-lg px-3">
          <span className="text-gray-500">🏆</span>
          <select 
            value={sportFilter} 
            onChange={(e) => setSportFilter(e.target.value)} 
            className="flex-1 bg-transparent p-3 text-white focus:outline-none"
          >
            <option value="">Todos los Deportes</option>
            <option value="Fútbol">Fútbol</option>
            <option value="Futsal">Futsal</option>
            <option value="Básquet">Básquet</option>
            <option value="Vóley">Vóley</option>
            <option value="Hockey">Hockey</option>
            <option value="Handball">Handball</option>
          </select>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-[#222] border border-[#444] rounded-lg px-3">
          <span className="text-gray-500">📍</span>
          <input 
            type="text" 
            placeholder="Filtrar por ciudad o zona..." 
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="flex-1 bg-transparent p-3 text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando oportunidades...</div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="text-center py-16 bg-[#1a1a1a] border border-[#333] rounded-2xl">
          <p className="text-xl text-gray-300 font-medium mb-2">No se encontraron búsquedas</p>
          <p className="text-gray-500">Intenta cambiar los filtros para ver otros resultados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opp) => (
            <div key={opp.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col justify-between hover:border-justo-green transition-colors group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-justo-green text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                    {opp.sport}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {opp.createdAt ? new Date(opp.createdAt.toMillis()).toLocaleDateString() : "Reciente"}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-justo-green transition-colors">{opp.title}</h3>
                <p className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                  🏦 {opp.clubName}
                </p>
                <p className="text-sm text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                  {opp.description}
                </p>
                
                <div className="flex flex-col gap-2 mb-6">
                  <p className="text-xs text-gray-500">📍 {opp.location}</p>
                  {opp.requirements && (
                    <p className="text-xs text-gray-500">📋 <span className="italic">Req:</span> {opp.requirements}</p>
                  )}
                </div>
              </div>
              
              <button 
                className="w-full bg-[#222] text-white font-medium py-3 rounded-xl border border-[#444] hover:bg-justo-green hover:border-justo-green hover:text-[#111] transition-all"
                onClick={() => {
                  alert("¡Próximamente! Podrás postularte con un solo clic enviando tu perfil directamente al club.");
                }}
              >
                Postularme
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
