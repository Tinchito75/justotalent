"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { FaInstagram, FaYoutube, FaTiktok, FaMapMarkerAlt } from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";
import FavoriteButton from "@/components/FavoriteButton";

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const { supabase, user } = useAuth();
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [clubOpps, setClubOpps] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", params.id)
          .single();
        
        if (data && !error) {
          setUserData(data);
          if (data.role === "club") {
            const { data: mems } = await supabase.from('club_memberships').select('*').eq('club_id', data.id).eq('status', 'approved');
            if (mems) setClubMembers(mems);
            const { data: opps } = await supabase.from('opportunities').select('*').eq('club_id', data.id).order('created_at', { ascending: false });
            if (opps) setClubOpps(opps);
          }
        } else {
          router.push("/search/players");
        }
      } catch (err) {
        console.error(err);
        router.push("/search/players");
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchUser();
    }
  }, [params.id, supabase, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-justo-green font-bold text-xl">Cargando perfil...</div>;
  }

  if (!userData) {
    return null;
  }

  const isCoach = userData?.role === "coach";
  const isClub = userData?.role === "club";
  const isPlayer = userData?.role === "player" || (!isCoach && !isClub);
  
  let profile = userData?.player_profile;
  if (isCoach) profile = userData?.coach_profile;
  if (isClub) profile = userData?.club_profile;

  const expList = profile?.experience || [];
  const charsList = Array.isArray(profile?.mainCharacteristics) 
    ? profile.mainCharacteristics 
    : (Array.isArray(profile?.characteristics) ? profile.characteristics : []);

  const displayName = isClub ? profile?.clubName : userData?.display_name;
  const age = profile?.birthDate ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear() : null;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full gap-8">
      
      {/* Header Profile Card - Redesigned */}
      <div className="bg-[#121212] rounded-3xl p-8 md:p-10 border border-[#2a2a2a] relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-justo-green/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="absolute top-6 right-6 z-20">
          {!isClub && user && user.id !== params.id && <FavoriteButton playerId={params.id} />}
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          
          <div className="relative group">
            <img 
              src={userData?.profilePictureUrl || "https://ui-avatars.com/api/?background=333&color=BFFF51&name=" + (isClub ? profile?.clubName : (userData?.basic_info?.firstName || userData?.display_name?.charAt(0) || "U"))} 
              alt="Profile" 
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#222] shadow-xl"
            />
            {!isClub && profile?.clubVerified && (
              <div className="absolute bottom-2 right-2 bg-[#121212] rounded-full p-1 border-2 border-[#222]" title="Verificado por su club">
                <FiCheckCircle className="text-blue-500 text-xl md:text-2xl" />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h1 className="text-4xl font-bold font-poppins text-white tracking-tight flex items-center gap-3">
                  {displayName}
                  {isClub && <FiCheckCircle className="text-blue-500 text-2xl" title="Club Oficial" />}
                </h1>
                
                <p className="text-justo-green font-medium text-lg mt-1 flex items-center gap-2 flex-wrap">
                  {isClub ? `Coordinador: ${userData?.basic_info?.firstName} ${userData?.basic_info?.lastName}` : (
                    <>
                      {isCoach && profile?.specialty ? `${profile.specialty} • ` : ""}
                      <span className="uppercase tracking-wide text-sm font-bold bg-justo-green/10 text-justo-green px-3 py-1 rounded-full">
                        {profile?.position || profile?.sport || 'Deportista'}
                      </span>
                      
                      {profile?.currentClub && (
                        <span className="text-gray-300 flex items-center gap-1">
                          en {profile.currentClub}
                        </span>
                      )}
                    </>
                  )}
                </p>

                <p className="text-gray-400 text-sm mt-3 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-500" />
                  {userData?.basic_info?.location?.city || "Sin ciudad"}, {userData?.basic_info?.location?.country || "Sin país"} {isClub && ` • Deporte: ${profile?.sport}`}
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3">
                {/* Redes Sociales */}
                <div className="flex gap-3 mt-1">
                  {profile?.instagram && (
                    <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#E1306C] transition-colors bg-[#1a1a1a] p-2.5 rounded-full border border-[#333]">
                      <FaInstagram size={18} />
                    </a>
                  )}
                  {profile?.youtube && (
                    <a href={profile.youtube} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#FF0000] transition-colors bg-[#1a1a1a] p-2.5 rounded-full border border-[#333]">
                      <FaYoutube size={18} />
                    </a>
                  )}
                  {profile?.tiktok && (
                    <a href={`https://tiktok.com/@${profile.tiktok.replace('@','')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors bg-[#1a1a1a] p-2.5 rounded-full border border-[#333]">
                      <FaTiktok size={18} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Banner for Player/Coach */}
            {!isClub && (
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4 pt-4 border-t border-[#2a2a2a]">
                {age && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Edad</span>
                    <span className="text-white font-medium">{age} años</span>
                  </div>
                )}
                {profile?.strongFoot && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pierna Hábil</span>
                    <span className="text-white font-medium">{profile.strongFoot}</span>
                  </div>
                )}
                {profile?.category && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Categoría</span>
                    <span className="text-white font-medium">{profile.category}</span>
                  </div>
                )}
                {profile?.experienceYears !== undefined && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Experiencia</span>
                    <span className="text-white font-medium">{profile.experienceYears} años</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: About & Details */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Availability Card */}
          {!isClub && (
            <div className={`p-6 rounded-2xl border ${profile?.availabilityStatus?.toLowerCase().includes('disponible') || profile?.availabilityStatus?.toLowerCase().includes('abierto') ? 'bg-justo-green/10 border-justo-green/30' : 'bg-[#1a1a1a] border-[#333]'}`}>
              <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Estado Actual</h3>
              <p className={`text-xl font-bold font-poppins ${profile?.availabilityStatus?.toLowerCase().includes('disponible') || profile?.availabilityStatus?.toLowerCase().includes('abierto') ? 'text-justo-green' : 'text-white'}`}>
                {profile?.availabilityStatus || "Disponible"}
              </p>
              {profile?.availabilityDate && (
                <p className="text-sm text-gray-400 mt-2">
                  A partir del: {new Date(profile.availabilityDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* About Me Section */}
          {!isClub && (
            <div className="bg-[#121212] p-6 rounded-2xl border border-[#2a2a2a] shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-[#2a2a2a] pb-3">Sobre Mí</h3>
              {profile?.aboutMe ? (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {profile.aboutMe}
                </p>
              ) : (
                <p className="text-gray-500 text-sm italic">El usuario aún no ha agregado una descripción.</p>
              )}

              {/* Physical Details List */}
              <div className="mt-6 flex flex-col gap-3">
                {profile?.heightCm && (
                  <div className="flex justify-between items-center border-b border-[#222] pb-2">
                    <span className="text-gray-400 text-sm">Estatura</span>
                    <span className="text-white font-medium">{profile.heightCm} cm</span>
                  </div>
                )}
                {profile?.weightKg && (
                  <div className="flex justify-between items-center border-b border-[#222] pb-2">
                    <span className="text-gray-400 text-sm">Peso</span>
                    <span className="text-white font-medium">{profile.weightKg} kg</span>
                  </div>
                )}
                {profile?.sport && (
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-gray-400 text-sm">Deporte</span>
                    <span className="text-white font-medium">{profile.sport}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isCoach && profile?.certifications && (
            <div className="bg-[#121212] p-6 rounded-2xl border border-[#2a2a2a] shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-[#2a2a2a] pb-3">Certificaciones</h3>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {profile.certifications}
              </p>
            </div>
          )}

        </div>

        {/* Right Column: Characteristics & Experience */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {!isClub ? (
            <>
              {/* Characteristics */}
              <div className="bg-[#121212] p-6 md:p-8 rounded-2xl border border-[#2a2a2a] shadow-lg">
                <h3 className="text-xl font-bold text-white mb-5">Características</h3>
                {charsList.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {charsList.map((skill: string, index: number) => (
                      <span key={index} className="bg-[#222] border border-[#333] text-justo-green px-5 py-2 rounded-xl text-sm font-semibold shadow-sm hover:border-justo-green/50 transition-colors">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm">No hay características destacadas.</p>
                )}
              </div>

              {/* Experience Timeline */}
              <div className="bg-[#121212] p-6 md:p-8 rounded-2xl border border-[#2a2a2a] shadow-lg">
                <h3 className="text-xl font-bold text-white mb-8">Trayectoria</h3>
                {expList.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No hay historial deportivo cargado.</p>
                ) : (
                  <div className="flex flex-col gap-8 relative border-l-2 border-[#333] ml-3 pl-8">
                    {expList.map((exp: any, idx: number) => (
                      <div key={idx} className="relative group">
                        <div className="absolute w-4 h-4 bg-[#121212] border-2 border-justo-green rounded-full -left-[41px] top-1.5 group-hover:bg-justo-green transition-colors shadow-[0_0_10px_rgba(191,255,81,0.5)]"></div>
                        
                        <h4 className="text-lg font-bold text-white">{exp.club}</h4>
                        <p className="text-sm text-justo-green font-semibold mt-1">
                          {exp.yearStart} {exp.yearEnd ? `- ${exp.yearEnd}` : "- Presente"}
                        </p>
                        {exp.achievements && (
                          <p className="text-gray-400 text-sm mt-3 bg-[#1a1a1a] p-3 rounded-lg border border-[#222]">
                            {exp.achievements}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Plantel del Club (Público) */}
              <div className="bg-[#121212] p-6 md:p-8 rounded-2xl border border-[#2a2a2a] shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6">Plantel Oficial</h3>
                {clubMembers.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">Este club aún no tiene miembros verificados en la plataforma.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clubMembers.map(m => (
                      <Link href={`/profile/${m.user_id}`} key={m.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3 hover:border-justo-green transition-colors">
                        <div className="w-10 h-10 bg-[#222] border border-[#333] rounded-full flex items-center justify-center text-justo-green font-bold">
                          {m.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{m.user_name}</p>
                          <p className="text-xs text-gray-400 capitalize">{m.user_role === 'player' ? 'Jugador' : 'Entrenador'}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Búsquedas del Club (Público) */}
              <div className="bg-[#121212] p-6 md:p-8 rounded-2xl border border-[#2a2a2a] shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6">Oportunidades Activas</h3>
                {clubOpps.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">Este club no tiene búsquedas publicadas por el momento.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {clubOpps.map(opp => (
                      <div key={opp.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 relative">
                        <div className="flex justify-between items-start mb-3">
                          <span className="bg-[#222] border border-[#333] text-justo-green px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                            {opp.sport}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${opp.status === 'active' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                            {opp.status === 'active' ? 'Activa' : 'Cerrada'}
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">{opp.title}</h4>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3 leading-relaxed">{opp.description}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                          <FaMapMarkerAlt /> {opp.location}
                        </p>
                        <Link href={`/opportunities`} className="text-justo-green text-sm font-bold hover:underline">
                          Ir a oportunidades &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
