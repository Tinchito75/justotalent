"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  
  const [clubOpps, setClubOpps] = useState<any[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [memberships, setMemberships] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && userData?.role === "club") {
      fetchClubOpportunities();
      fetchClubMemberships();
    }
  }, [user, userData]);

  const fetchClubOpportunities = async () => {
    if (!user) return;
    setLoadingOpps(true);
    try {
      const q = query(collection(db, "opportunities"), where("clubId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const opps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by creation time manually
      opps.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA; // Descending
      });
      setClubOpps(opps);
    } catch (error) {
      console.error("Error fetching club opportunities:", error);
    } finally {
      setLoadingOpps(false);
    }
  };

  const fetchClubMemberships = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "club_memberships"), where("clubId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      setMemberships(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching memberships", error);
    }
  };

  const handleApproveMembership = async (membershipId: string, memberUserId: string, memberRole: string) => {
    if (!confirm("¿Aprobar solicitud? Este usuario aparecerá verificado en tu club.")) return;
    try {
      await updateDoc(doc(db, "club_memberships", membershipId), { status: "approved" });
      const userRef = doc(db, "users", memberUserId);
      if (memberRole === 'player') {
        await updateDoc(userRef, { "playerProfile.clubVerified": true });
      } else {
        await updateDoc(userRef, { "coachProfile.clubVerified": true });
      }
      fetchClubMemberships();
    } catch(err) {
      console.error(err);
    }
  };

  const handleRejectMembership = async (membershipId: string) => {
    if (!confirm("¿Rechazar solicitud?")) return;
    try {
      await updateDoc(doc(db, "club_memberships", membershipId), { status: "rejected" });
      fetchClubMemberships();
    } catch(err) {
      console.error(err);
    }
  };

  if (loading || !user) {
    return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  }

  const isCoach = userData?.role === "coach";
  const isClub = userData?.role === "club";
  
  let profile = userData?.playerProfile;
  if (isCoach) profile = userData?.coachProfile;
  if (isClub) profile = userData?.clubProfile;

  const expList = profile?.experience || [];
  const chars = profile?.characteristics;
  const charsList = Array.isArray(chars) ? chars : (typeof chars === 'string' && chars ? [chars] : []);
  const sponsors = isClub ? profile?.sponsors || [] : [];

  const displayName = isClub ? profile?.clubName : `${userData?.basicInfo?.firstName} ${userData?.basicInfo?.lastName}`;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full gap-6">
      
      {/* Header Card */}
      <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#333] relative">
        <Link href="/profile/edit" className="absolute top-6 right-6 text-sm text-justo-green hover:text-white border border-justo-green hover:border-white px-4 py-2 rounded-lg transition-colors">
          Editar Perfil
        </Link>
        <div className="flex items-center gap-6">
          <img 
            src={userData?.profilePictureUrl || "https://ui-avatars.com/api/?name=" + (isClub ? profile?.clubName : (userData?.basicInfo?.firstName || user.displayName || "U"))} 
            alt="Profile" 
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold">
              {displayName}
            </h1>
            <p className="text-justo-green font-medium text-lg">
              {isClub ? `Coordinador: ${userData?.basicInfo?.firstName} ${userData?.basicInfo?.lastName}` : (
                <>
                  {isCoach && profile?.specialty ? `${profile.specialty} de ` : ""}
                  {profile?.sport}
                  {profile?.currentClub && (
                    <span className="text-gray-400 flex items-center gap-1 inline-flex ml-2">
                      • {profile.currentClub}
                      {profile.clubVerified && (
                        <span title="Verificado por el club" className="text-blue-400 bg-blue-500/20 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] ml-1">
                          ✓
                        </span>
                      )}
                    </span>
                  )}
                </>
              )}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              📍 {userData?.basicInfo?.location?.city}, {userData?.basicInfo?.location?.country} {isClub && ` • Deporte: ${profile?.sport}`}
            </p>
          </div>
        </div>

        {!isClub && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {!isCoach && profile?.heightCm && (
              <div className="bg-[#222] p-4 rounded-xl border border-[#333] text-center">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Estatura</p>
                <p className="text-xl font-semibold text-white">{profile.heightCm} cm</p>
              </div>
            )}
            {profile?.experienceYears !== undefined && (
              <div className="bg-[#222] p-4 rounded-xl border border-[#333] text-center">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Experiencia</p>
                <p className="text-xl font-semibold text-white">{profile.experienceYears} años</p>
              </div>
            )}
            {profile?.birthDate && (
              <div className="bg-[#222] p-4 rounded-xl border border-[#333] text-center">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Edad</p>
                <p className="text-xl font-semibold text-white">
                  {new Date().getFullYear() - new Date(profile.birthDate).getFullYear()} años
                </p>
              </div>
            )}
          </div>
        )}

        {isCoach && profile?.certifications && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-2">Certificaciones</h3>
            <p className="text-gray-300 leading-relaxed bg-[#222] p-4 rounded-xl border border-[#333] whitespace-pre-line">
              {profile.certifications}
            </p>
          </div>
        )}

        {charsList.length > 0 && !isClub && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-3">Aptitudes y Características</h3>
            <div className="flex flex-wrap gap-2">
              {charsList.map((skill: string, index: number) => (
                <span key={index} className="bg-justo-green text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {isClub && sponsors.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-3">Sponsors</h3>
            <div className="flex flex-wrap gap-2">
              {sponsors.map((sponsor: string, index: number) => (
                <span key={index} className="bg-[#222] border border-[#444] text-gray-300 px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                  {sponsor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isClub ? (
        /* Experience Timeline for Players/Coaches */
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#333]">
          <h3 className="text-xl font-semibold text-white mb-6">Línea Histórica</h3>
          {expList.length === 0 ? (
            <p className="text-gray-500 italic">No hay historial deportivo cargado.</p>
          ) : (
            <div className="flex flex-col gap-6 relative border-l border-[#333] ml-4 pl-6">
              {expList.map((exp: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className="absolute w-3 h-3 bg-justo-green rounded-full -left-[31px] top-1.5 border-4 border-[#1a1a1a]"></div>
                  <h4 className="text-lg font-semibold text-white">{exp.club}</h4>
                  <p className="text-sm text-justo-green font-medium">
                    {exp.yearStart} {exp.yearEnd ? `- ${exp.yearEnd}` : "- Presente"}
                  </p>
                  {exp.achievements && (
                    <p className="text-gray-400 text-sm mt-2">{exp.achievements}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Club Specific Sections (Plantel, Oportunidades, etc.) */
        <div className="flex flex-col gap-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#333]">
            <h3 className="text-xl font-semibold text-white mb-2">Plantel y Cuerpo Técnico</h3>
            <p className="text-gray-400 mb-6 text-sm">Los jugadores y entrenadores aprobados por el coordinador aparecerán aquí.</p>
            
            <div className="flex flex-col gap-4">
              {memberships.filter(m => m.status === 'pending').length > 0 && (
                <div className="mb-4">
                  <h4 className="text-justo-orange font-semibold mb-3 flex items-center gap-2">
                    Solicitudes Pendientes ({memberships.filter(m => m.status === 'pending').length})
                  </h4>
                  <div className="flex flex-col gap-3">
                    {memberships.filter(m => m.status === 'pending').map(m => (
                      <div key={m.id} className="bg-[#222] border border-[#444] rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">{m.userName}</p>
                          <p className="text-sm text-gray-400 capitalize">{m.userRole === 'player' ? 'Jugador' : 'Entrenador'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveMembership(m.id, m.userId, m.userRole)} className="bg-justo-green text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-justo-dark-green transition-colors">
                            Aprobar
                          </button>
                          <button onClick={() => handleRejectMembership(m.id)} className="bg-[#333] text-gray-300 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-[#444] transition-colors">
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-justo-green font-semibold mb-3 flex items-center gap-2">
                  Miembros Aprobados ({memberships.filter(m => m.status === 'approved').length})
                </h4>
                {memberships.filter(m => m.status === 'approved').length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed border-[#333] rounded-xl">
                    <p className="text-gray-500 italic">Aún no has aprobado miembros para tu club.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {memberships.filter(m => m.status === 'approved').map(m => (
                      <div key={m.id} className="bg-[#222] border border-[#333] rounded-lg p-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center text-gray-400 font-bold">
                          {m.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{m.userName}</p>
                          <p className="text-xs text-gray-400 capitalize">{m.userRole === 'player' ? 'Jugador' : 'Entrenador'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#333]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Búsquedas Activas</h3>
                <p className="text-gray-400 text-sm mt-1">Oportunidades publicadas por el club.</p>
              </div>
              <Link href="/opportunities/new" className="bg-justo-green text-white px-4 py-2 rounded-lg font-medium hover:bg-justo-dark-green transition-colors text-sm">
                + Crear Búsqueda
              </Link>
            </div>
            
            {loadingOpps ? (
              <div className="text-center p-8 border border-[#333] rounded-xl">
                <p className="text-gray-400">Cargando búsquedas...</p>
              </div>
            ) : clubOpps.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-[#333] rounded-xl">
                <p className="text-gray-500 italic">Aún no hay búsquedas activas publicadas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clubOpps.map(opp => (
                  <div key={opp.id} className="bg-[#222] border border-[#444] rounded-xl p-5 hover:border-justo-green transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-justo-green text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {opp.sport}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${opp.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {opp.status === 'active' ? 'Activa' : 'Cerrada'}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1">{opp.title}</h4>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{opp.description}</p>
                    <p className="text-xs text-gray-500">📍 {opp.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
