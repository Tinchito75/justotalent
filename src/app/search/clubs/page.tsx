"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function SearchClubsPage() {
  const { supabase } = useAuth();
  
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    name: "",
    city: "",
    sport: ""
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      city: "",
      sport: ""
    });
  };

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'club');
      
      if (data && !error) {
        let results = data;
        
        if (filters.name) {
          results = results.filter(c => 
            c.club_profile?.clubName?.toLowerCase().includes(filters.name.toLowerCase()) || 
            c.display_name?.toLowerCase().includes(filters.name.toLowerCase())
          );
        }
        if (filters.city) {
          results = results.filter(c => 
            c.basic_info?.location?.city?.toLowerCase().includes(filters.city.toLowerCase())
          );
        }
        if (filters.sport) {
          results = results.filter(c => c.club_profile?.sport === filters.sport);
        }
        
        setClubs(results);
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full">
      <h1 className="text-3xl font-bold font-poppins mb-6">Buscar Clubes</h1>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 mb-8">
        <h3 className="font-semibold mb-4">Filtros de búsqueda</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Nombre del Club</label>
            <input type="text" name="name" value={filters.name} onChange={handleFilterChange} className="bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none" placeholder="Ej. Boca Juniors" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Ciudad</label>
            <input type="text" name="city" value={filters.city} onChange={handleFilterChange} className="bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none" placeholder="Ej. Buenos Aires" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Deporte</label>
            <select name="sport" value={filters.sport} onChange={handleFilterChange} className="bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none">
              <option value="">Todos</option>
              <option value="Fútbol">Fútbol</option>
              <option value="Futsal">Futsal</option>
              <option value="Básquet">Básquet</option>
              <option value="Vóley">Vóley</option>
              <option value="Hockey">Hockey</option>
              <option value="Handball">Handball</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 border-t border-[#333] pt-6">
          <button onClick={clearFilters} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
            Limpiar filtros
          </button>
          <button onClick={fetchClubs} className="bg-justo-green text-justo-black px-6 py-2 rounded-lg text-sm font-semibold hover:bg-justo-dark-green transition-colors">
            Buscar Clubes
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12 animate-pulse">Buscando clubes...</div>
        ) : (
          clubs.map(c => (
            <div key={c.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden hover:border-justo-green transition-colors flex flex-col">
              <div className="h-24 bg-gradient-to-br from-justo-green/20 to-[#111] relative border-b border-[#333]"></div>
              <div className="p-5 pt-0 relative flex-1 flex flex-col">
                <div className="w-16 h-16 rounded-xl bg-[#222] border-4 border-[#1a1a1a] -mt-8 relative overflow-hidden mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold text-justo-green">{c.club_profile?.clubName?.charAt(0) || 'C'}</span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">{c.club_profile?.clubName || c.display_name}</h3>
                <p className="text-justo-green font-medium text-sm mb-4 uppercase tracking-wider">{c.club_profile?.sport || 'Club'}</p>
                
                <div className="text-xs text-gray-400 mb-6 flex-1">
                  <div className="flex items-center gap-1 mb-2">
                    <FaMapMarkerAlt /> <span>{c.basic_info?.location?.city || 'Sin ciudad'}, {c.basic_info?.location?.country || 'Sin país'}</span>
                  </div>
                  {c.club_profile?.sponsors && c.club_profile.sponsors.length > 0 && (
                    <div className="mt-2 text-gray-500 italic">
                      Sponsors: {c.club_profile.sponsors.join(', ')}
                    </div>
                  )}
                </div>
                
                <Link href={`/profile/${c.id}`} className="w-full bg-[#222] hover:bg-[#333] text-white py-2 rounded-lg text-sm font-medium transition-colors border border-[#444] block text-center">
                  Ver perfil completo
                </Link>
              </div>
            </div>
          ))
        )}
        
        {!loading && clubs.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 mb-2">No se encontraron clubes.</p>
            <p className="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
