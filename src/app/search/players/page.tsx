"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import FavoriteButton from "@/components/FavoriteButton";
import Link from "next/link";

export default function SearchPlayersPage() {
  const { user, supabase } = useAuth();
  const [activeTab, setActiveTab] = useState<"search" | "favorites">("search");
  
  // Search state
  const [players, setPlayers] = useState<any[]>([]);
  const [favoritePlayers, setFavoritePlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    minAge: "",
    maxAge: "",
    position: "",
    strongFoot: "",
    category: "",
    currentClub: "",
    minHeight: "",
    maxHeight: "",
    minWeight: "",
    maxWeight: "",
    experienceYears: "",
    characteristics: "",
    sortBy: "recent"
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      minAge: "",
      maxAge: "",
      position: "",
      strongFoot: "",
      category: "",
      currentClub: "",
      minHeight: "",
      maxHeight: "",
      minWeight: "",
      maxWeight: "",
      experienceYears: "",
      characteristics: "",
      sortBy: "recent"
    });
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase.from('users').select('*').eq('role', 'player');
      
      const { data, error } = await query;
      
      if (data && !error) {
        let results = data;
        
        // Manual JSONB filtering (Supabase JS doesn't easily support complex nested JSONB filtering with > < easily without raw SQL, so we do it client side for now as it's a small dataset, or we use standard eq).
        // A real app would use Postgres Functions or Computed Columns.
        
        if (filters.position) {
          results = results.filter(p => p.player_profile?.position === filters.position);
        }
        if (filters.strongFoot) {
          results = results.filter(p => p.player_profile?.strongFoot === filters.strongFoot);
        }
        if (filters.category) {
          results = results.filter(p => p.player_profile?.category?.toLowerCase().includes(filters.category.toLowerCase()));
        }
        if (filters.minHeight) {
          results = results.filter(p => (p.player_profile?.heightCm || 0) >= Number(filters.minHeight));
        }
        if (filters.maxHeight) {
          results = results.filter(p => (p.player_profile?.heightCm || 0) <= Number(filters.maxHeight));
        }
        if (filters.minWeight) {
          results = results.filter(p => (p.player_profile?.weightKg || 0) >= Number(filters.minWeight));
        }
        if (filters.maxWeight) {
          results = results.filter(p => (p.player_profile?.weightKg || 0) <= Number(filters.maxWeight));
        }
        
        setPlayers(results);
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: favs, error: favsError } = await supabase
        .from('coach_favorites')
        .select('player_id')
        .eq('coach_id', user.id);
        
      if (favs && !favsError) {
        const playerIds = favs.map(f => f.player_id);
        if (playerIds.length > 0) {
          const { data, error } = await supabase.from('users').select('*').in('id', playerIds);
          if (data && !error) {
            setFavoritePlayers(data);
          }
        } else {
          setFavoritePlayers([]);
        }
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "search") {
      fetchPlayers();
    } else {
      fetchFavorites();
    }
  }, [activeTab]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full">
      <h1 className="text-3xl font-bold font-poppins mb-6">Buscar jugadores</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-[#333] mb-6">
        <button 
          onClick={() => setActiveTab('search')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'search' ? 'text-justo-green' : 'text-gray-400 hover:text-white'}`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Buscar
          </span>
          {activeTab === 'search' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-justo-green rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('favorites')}
          className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'favorites' ? 'text-justo-green' : 'text-gray-400 hover:text-white'}`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            Jugadores Favoritos
          </span>
          {activeTab === 'favorites' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-justo-green rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 mb-8">
          <h3 className="font-semibold mb-4">Filtros de búsqueda</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Posición</label>
              <select name="position" value={filters.position} onChange={handleFilterChange} className="bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none">
                <option value="">Todas</option>
                <option value="Arquero">Arquero</option>
                <option value="Defensor">Defensor</option>
                <option value="Mediocampista">Mediocampista</option>
                <option value="Delantero">Delantero</option>
                <option value="Pivot">Pivot</option>
                <option value="Cierre">Cierre</option>
                <option value="Ala">Ala</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Pie hábil</label>
              <select name="strongFoot" value={filters.strongFoot} onChange={handleFilterChange} className="bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none">
                <option value="">Todos</option>
                <option value="Derecha">Derecha</option>
                <option value="Izquierda">Izquierda</option>
                <option value="Ambidiestro">Ambidiestro</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Categoría</label>
              <input type="text" name="category" value={filters.category} onChange={handleFilterChange} className="bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none" placeholder="Ej. Primera, 2005" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Altura (cm)</label>
              <div className="flex items-center gap-2">
                <input type="number" name="minHeight" value={filters.minHeight} onChange={handleFilterChange} className="w-full bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none" placeholder="Mín." />
                <span className="text-gray-500">-</span>
                <input type="number" name="maxHeight" value={filters.maxHeight} onChange={handleFilterChange} className="w-full bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none" placeholder="Máx." />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Peso (kg)</label>
              <div className="flex items-center gap-2">
                <input type="number" name="minWeight" value={filters.minWeight} onChange={handleFilterChange} className="w-full bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none" placeholder="Mín." />
                <span className="text-gray-500">-</span>
                <input type="number" name="maxWeight" value={filters.maxWeight} onChange={handleFilterChange} className="w-full bg-[#222] border border-[#444] rounded-lg p-2 text-white text-sm focus:border-justo-green outline-none" placeholder="Máx." />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 border-t border-[#333] pt-6">
            <button onClick={clearFilters} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
              Limpiar filtros
            </button>
            <button onClick={fetchPlayers} className="bg-justo-green text-justo-black px-6 py-2 rounded-lg text-sm font-semibold hover:bg-justo-dark-green transition-colors">
              Buscar jugadores
            </button>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12 animate-pulse">Buscando...</div>
        ) : (
          (activeTab === 'search' ? players : favoritePlayers).map(p => (
            <div key={p.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden hover:border-justo-green transition-colors">
              <div className="h-32 bg-gradient-to-br from-[#2a2a2a] to-[#111] relative">
                <div className="absolute top-4 right-4 z-10">
                  <FavoriteButton playerId={p.id} />
                </div>
              </div>
              <div className="p-5 pt-0 relative">
                <div className="w-20 h-20 rounded-xl bg-[#333] border-4 border-[#1a1a1a] -mt-10 relative overflow-hidden mb-3">
                   {/* Imagen de placeholder */}
                   <svg className="w-full h-full text-gray-500 p-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4-4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">{p.display_name}</h3>
                <p className="text-justo-green font-medium text-sm mb-4">{p.player_profile?.position || 'Sin posición'}</p>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="uppercase text-[10px] tracking-wider">Pie Hábil</span>
                    <span className="text-white font-medium">{p.player_profile?.strongFoot || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="uppercase text-[10px] tracking-wider">Categoría</span>
                    <span className="text-white font-medium">{p.player_profile?.category || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="uppercase text-[10px] tracking-wider">Altura</span>
                    <span className="text-white font-medium">{p.player_profile?.heightCm ? `${p.player_profile.heightCm} cm` : '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="uppercase text-[10px] tracking-wider">Peso</span>
                    <span className="text-white font-medium">{p.player_profile?.weightKg ? `${p.player_profile.weightKg} kg` : '-'}</span>
                  </div>
                </div>
                
                <Link href={`/profile/${p.id}`} className="w-full bg-[#222] hover:bg-[#333] text-white py-2 rounded-lg text-sm font-medium transition-colors border border-[#444] block text-center">
                  Ver perfil completo
                </Link>
              </div>
            </div>
          ))
        )}
        
        {!loading && (activeTab === 'search' ? players : favoritePlayers).length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 mb-2">No se encontraron jugadores.</p>
            {activeTab === 'search' ? (
              <p className="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda.</p>
            ) : (
              <p className="text-sm text-gray-500">Busca jugadores y dales click al ❤️ para guardarlos aquí.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
