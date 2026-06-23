"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function FavoriteButton({ playerId }: { playerId: string }) {
  const { user, supabase } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("coach_favorites")
          .select("id")
          .eq("coach_id", user.id)
          .eq("player_id", playerId)
          .single();
        
        if (data && !error) {
          setIsFavorite(true);
        }
      } catch (err) {
        // Not found or error
      } finally {
        setLoading(false);
      }
    };
    checkFavorite();
  }, [user, playerId, supabase]);

  const toggleFavorite = async () => {
    if (!user) return;
    setLoading(true);
    
    if (isFavorite) {
      // Remove
      await supabase
        .from("coach_favorites")
        .delete()
        .eq("coach_id", user.id)
        .eq("player_id", playerId);
      setIsFavorite(false);
    } else {
      // Add
      await supabase
        .from("coach_favorites")
        .insert({ coach_id: user.id, player_id: playerId });
      setIsFavorite(true);
    }
    setLoading(false);
  };

  if (loading) return <div className="w-8 h-8 animate-pulse bg-[#333] rounded-full"></div>;

  return (
    <button 
      onClick={toggleFavorite}
      className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-500 bg-opacity-20 hover:bg-opacity-30' : 'text-gray-400 bg-[#333] hover:text-white hover:bg-[#444]'}`}
      title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    </button>
  );
}
