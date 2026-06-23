"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";


export default function EditProfilePage() {
  const { user, userData, refreshUserData, loading: authLoading, supabase } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"player" | "coach" | "club">("player");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    city: "",
    birthDate: "",
    heightCm: "",
    weightKg: "",
    sport: "",
    category: "",
    position: "",
    strongFoot: "",
    experienceYears: "",
    currentClub: "",
    specialty: "",
    certifications: "",
    clubName: "",
    sponsors: "",
    currentClubId: "",
    aboutMe: "",
    availabilityStatus: "Disponible",
    availabilityDate: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  });

  const [availableClubs, setAvailableClubs] = useState<any[]>([]);
  const [showClubDropdown, setShowClubDropdown] = useState(false);

  const [mainCharacteristics, setMainCharacteristics] = useState<string[]>([]);
  const [characteristicInput, setCharacteristicInput] = useState("");
  const [experienceList, setExperienceList] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }
    
    if (userData) {
      const currentRole = userData.role as "player" | "coach" | "club" || "player";
      setRole(currentRole);
      
      let profile = userData.player_profile;
      if (currentRole === "coach") profile = userData.coach_profile;
      if (currentRole === "club") profile = userData.club_profile;

      setFormData({
        firstName: userData.basic_info?.firstName || "",
        lastName: userData.basic_info?.lastName || "",
        city: userData.basic_info?.location?.city || "",
        birthDate: profile?.birthDate || "",
        heightCm: profile?.heightCm?.toString() || "",
        weightKg: profile?.weightKg?.toString() || "",
        sport: profile?.sport || "",
        category: profile?.category || "",
        position: profile?.position || "",
        strongFoot: profile?.strongFoot || "",
        experienceYears: profile?.experienceYears?.toString() || "",
        currentClub: profile?.currentClub || "",
        currentClubId: profile?.currentClubId || "",
        specialty: profile?.specialty || "",
        certifications: profile?.certifications || "",
        clubName: profile?.clubName || "",
        sponsors: profile?.sponsors ? profile.sponsors.join(', ') : "",
        aboutMe: profile?.aboutMe || "",
        availabilityStatus: profile?.availabilityStatus || "Disponible",
        availabilityDate: profile?.availabilityDate || "",
        instagram: profile?.instagram || "",
        youtube: profile?.youtube || "",
        tiktok: profile?.tiktok || "",
      });

      if (currentRole !== "club") {
        if (Array.isArray(profile?.mainCharacteristics)) {
          setMainCharacteristics(profile.mainCharacteristics);
        } else if (Array.isArray(profile?.characteristics)) {
          setMainCharacteristics(profile.characteristics);
        } else if (typeof profile?.characteristics === 'string' && profile.characteristics) {
          setMainCharacteristics([profile.characteristics]);
        } else {
          setMainCharacteristics([]);
        }
        setExperienceList(profile?.experience || []);
      }
      const fetchClubs = async () => {
        const { data, error } = await supabase.from('users').select('id, club_profile').eq('role', 'club');
        if (data && !error) {
          setAvailableClubs(data.map(d => ({ id: d.id, ...d.club_profile })));
        }
      };
      fetchClubs();
    }
  }, [userData, authLoading, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCharacteristic = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (characteristicInput.trim() && !mainCharacteristics.includes(characteristicInput.trim())) {
      setMainCharacteristics([...mainCharacteristics, characteristicInput.trim()]);
      setCharacteristicInput("");
    }
  };

  const handleRemoveCharacteristic = (charToRemove: string) => {
    setMainCharacteristics(mainCharacteristics.filter(s => s !== charToRemove));
  };

  const handleAddExperience = () => {
    setExperienceList([...experienceList, { club: "", yearStart: "", yearEnd: "", achievements: "" }]);
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
    const newList = [...experienceList];
    newList[index] = { ...newList[index], [field]: value };
    setExperienceList(newList);
  };

  const handleRemoveExperience = (index: number) => {
    const newList = [...experienceList];
    newList.splice(index, 1);
    setExperienceList(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const basicInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        location: {
          city: formData.city,
          country: "Argentina"
        }
      };

      const baseUpsert: any = {
        id: user.id,
        email: user.email,
        display_name: `${basicInfo.firstName} ${basicInfo.lastName}`,
        role: role,
        basic_info: basicInfo,
      };

      if (role === "club") {
        baseUpsert.club_profile = {
          clubName: formData.clubName,
          sport: formData.sport,
          sponsors: formData.sponsors.split(',').map(s => s.trim()).filter(s => s),
        };
      } else {
        const profile = role === "player" ? userData?.player_profile : userData?.coach_profile;
        const baseProfile = {
          birthDate: formData.birthDate,
          sport: formData.sport,
          experienceYears: Number(formData.experienceYears) || 0,
          currentClub: formData.currentClub,
          currentClubId: formData.currentClubId,
          mainCharacteristics: mainCharacteristics,
          characteristics: mainCharacteristics, // keep for compatibility
          experience: experienceList,
          aboutMe: formData.aboutMe,
          instagram: formData.instagram,
          youtube: formData.youtube,
          tiktok: formData.tiktok,
        };

        if (formData.currentClubId && formData.currentClubId !== profile?.currentClubId) {
          await supabase.from('club_memberships').insert({
            user_id: user.id,
            club_id: formData.currentClubId,
            user_name: `${basicInfo.firstName} ${basicInfo.lastName}`,
            user_role: role,
            status: "pending",
          });
        }

        if (role === "player") {
          baseUpsert.player_profile = {
            ...baseProfile,
            heightCm: Number(formData.heightCm) || null,
            weightKg: Number(formData.weightKg) || null,
            position: formData.position,
            strongFoot: formData.strongFoot,
            category: formData.category,
            availabilityStatus: formData.availabilityStatus,
            availabilityDate: formData.availabilityDate,
            clubVerified: profile?.currentClubId === formData.currentClubId ? profile?.clubVerified : false,
          };
        } else if (role === "coach") {
          baseUpsert.coach_profile = {
            ...baseProfile,
            specialty: formData.specialty,
            certifications: formData.certifications,
            clubVerified: profile?.currentClubId === formData.currentClubId ? profile?.clubVerified : false,
          };
        }
      }

      const { error } = await supabase.from('users').upsert(baseUpsert);
      if (error) throw error;

      await refreshUserData();
      router.push("/profile");
    } catch (error) {
      console.error("Error saving profile", error);
      alert("Hubo un error al guardar tu perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-[#1a1a1a] p-8 rounded-2xl border border-[#333]">
        <div className="flex justify-between items-center mb-8 border-b border-[#333] pb-4">
          <h1 className="text-3xl font-bold font-poppins">Editar Perfil</h1>
          <button onClick={() => router.push("/profile")} className="text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-1 bg-[#222] rounded-xl border border-[#333]">
            <button 
              type="button" 
              onClick={() => setRole("player")} 
              className={`flex-1 py-2 rounded-lg font-medium transition-colors text-sm ${role === 'player' ? 'bg-justo-green text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              Jugador
            </button>
            <button 
              type="button" 
              onClick={() => setRole("coach")} 
              className={`flex-1 py-2 rounded-lg font-medium transition-colors text-sm ${role === 'coach' ? 'bg-justo-green text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              Entrenador
            </button>
            <button 
              type="button" 
              onClick={() => setRole("club")} 
              className={`flex-1 py-2 rounded-lg font-medium transition-colors text-sm ${role === 'club' ? 'bg-justo-green text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              Club
            </button>
          </div>

          <section className="flex flex-col gap-6 bg-[#222] p-6 rounded-xl border border-[#333]">
            <h2 className="text-xl font-semibold text-justo-green">
              {role === 'club' ? 'Datos del Coordinador / Representante' : 'Información Personal'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Nombre *</label>
                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Apellido *</label>
                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Ciudad de residencia / sede *</label>
              <input required type="text" name="city" value={formData.city} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
            </div>
            
            {role !== 'club' && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Fecha de Nacimiento</label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" style={{ colorScheme: "dark" }} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Sobre Mí</label>
                  <textarea name="aboutMe" value={formData.aboutMe} onChange={handleChange} rows={4} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green resize-none" placeholder="Cuéntanos un poco sobre ti, tu trayectoria y tus objetivos..."></textarea>
                </div>
              </>
            )}
          </section>

          {role === 'club' ? (
            <section className="flex flex-col gap-6 bg-[#222] p-6 rounded-xl border border-[#333]">
              <h2 className="text-xl font-semibold text-justo-green">Información del Club</h2>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Nombre del Club *</label>
                <input required type="text" name="clubName" value={formData.clubName} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Ej. Club Atlético San Martín" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Deporte Principal *</label>
                <select required name="sport" value={formData.sport} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green">
                  <option value="">Selecciona...</option>
                  <option value="Fútbol">Fútbol</option>
                  <option value="Futsal">Futsal</option>
                  <option value="Básquet">Básquet</option>
                  <option value="Vóley">Vóley</option>
                  <option value="Hockey">Hockey</option>
                  <option value="Handball">Handball</option>
                  <option value="Multideporte">Multideporte</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Sponsors (Separados por coma)</label>
                <input type="text" name="sponsors" value={formData.sponsors} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Ej. Nike, Gatorade, Banco Nación" />
              </div>
            </section>
          ) : (
            <>
              {role === "player" && (
                <section className="flex flex-col gap-6 bg-[#222] p-6 rounded-xl border border-[#333]">
                  <h2 className="text-xl font-semibold text-justo-green">Deportivo y Físico</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Deporte *</label>
                      <select required name="sport" value={formData.sport} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green">
                        <option value="">Selecciona...</option>
                        <option value="Fútbol">Fútbol</option>
                        <option value="Futsal">Futsal</option>
                        <option value="Básquet">Básquet</option>
                        <option value="Vóley">Vóley</option>
                        <option value="Hockey">Hockey</option>
                        <option value="Handball">Handball</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Posición</label>
                      <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="Ej. Mediocampista Central" className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Pierna Hábil</label>
                      <select name="strongFoot" value={formData.strongFoot} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green">
                        <option value="">Selecciona...</option>
                        <option value="Derecha">Derecha</option>
                        <option value="Izquierda">Izquierda</option>
                        <option value="Ambidiestro">Ambidiestro</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Categoría / Liga</label>
                      <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Ej. Primera A, Sub 20..." className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Estatura (cm)</label>
                      <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Peso (kg)</label>
                      <input type="number" step="0.1" name="weightKg" value={formData.weightKg} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
                    </div>
                  </div>
                </section>
              )}

              {role === "coach" && (
                <section className="flex flex-col gap-6 bg-[#222] p-6 rounded-xl border border-[#333]">
                  <h2 className="text-xl font-semibold text-justo-green">Perfil Profesional</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Deporte *</label>
                      <select required name="sport" value={formData.sport} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green">
                        <option value="">Selecciona...</option>
                        <option value="Fútbol">Fútbol</option>
                        <option value="Futsal">Futsal</option>
                        <option value="Básquet">Básquet</option>
                        <option value="Vóley">Vóley</option>
                        <option value="Hockey">Hockey</option>
                        <option value="Handball">Handball</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Especialidad</label>
                      <select name="specialty" value={formData.specialty} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green">
                        <option value="">Selecciona...</option>
                        <option value="Director Técnico">Director Técnico</option>
                        <option value="Preparador Físico">Preparador Físico</option>
                        <option value="Ayudante de Campo">Ayudante de Campo</option>
                        <option value="Entrenador Arqueros">Entrenador Arqueros</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300">Certificaciones y Cursos</label>
                    <textarea name="certifications" value={formData.certifications} onChange={handleChange} rows={3} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green resize-none" placeholder="Ej. Licencia PRO CONMEBOL, Curso de Preparación Física Nivel 1..."></textarea>
                  </div>
                </section>
              )}

              {role === "player" && (
                <section className="flex flex-col gap-6 bg-[#222] p-6 rounded-xl border border-[#333]">
                  <h2 className="text-xl font-semibold text-justo-green">Disponibilidad</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Estado de Disponibilidad</label>
                      <select name="availabilityStatus" value={formData.availabilityStatus} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green">
                        <option value="Disponible">Disponible (Libre)</option>
                        <option value="En Club">Actualmente en un Club</option>
                        <option value="Abierto a propuestas">Abierto a propuestas</option>
                        <option value="Lesionado">Recuperación / Lesionado</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Fecha de disponibilidad (Opcional)</label>
                      <input type="date" name="availabilityDate" value={formData.availabilityDate} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" style={{ colorScheme: "dark" }} />
                    </div>
                  </div>
                </section>
              )}

              <section className="flex flex-col gap-6 bg-[#222] p-6 rounded-xl border border-[#333]">
                <h2 className="text-xl font-semibold text-justo-green">Experiencia Actual y Pasada</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300">Años de experiencia</label>
                    <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
                  </div>

                  <div className="flex flex-col gap-2 relative">
                    <label className="text-sm font-medium text-gray-300">Club Actual (Opcional)</label>
                    <input 
                      type="text" 
                      name="currentClub" 
                      value={formData.currentClub} 
                      onChange={(e) => { handleChange(e); setShowClubDropdown(true); }} 
                      onFocus={() => setShowClubDropdown(true)}
                      className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" 
                      placeholder="Busca tu club..." 
                      autoComplete="off"
                    />
                    {showClubDropdown && formData.currentClub && (
                      <div className="absolute top-full mt-1 w-full bg-[#1a1a1a] border border-[#444] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {availableClubs.filter(c => c.clubName?.toLowerCase().includes(formData.currentClub.toLowerCase())).length > 0 ? (
                          availableClubs.filter(c => c.clubName?.toLowerCase().includes(formData.currentClub.toLowerCase())).map(c => (
                            <div 
                              key={c.id} 
                              onClick={() => {
                                setFormData({ ...formData, currentClub: c.clubName, currentClubId: c.id });
                                setShowClubDropdown(false);
                              }}
                              className="p-3 hover:bg-[#333] cursor-pointer text-white text-sm border-b border-[#333] last:border-0"
                            >
                              {c.clubName}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-gray-400 text-sm italic">No se encontraron clubes. Guarda para crearlo libremente.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex justify-between items-center border-b border-[#444] pb-2">
                    <h3 className="text-lg font-medium text-white">Línea Histórica (Clubes previos)</h3>
                    <button type="button" onClick={handleAddExperience} className="text-sm text-justo-green hover:text-white font-medium bg-[#333] px-3 py-1.5 rounded-lg transition-colors">
                      + Agregar experiencia
                    </button>
                  </div>
                  
                  {experienceList.length === 0 && (
                    <p className="text-gray-500 text-sm italic">Aún no has agregado experiencia previa.</p>
                  )}

                  {experienceList.map((exp, index) => (
                    <div key={index} className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333] flex flex-col gap-4 relative">
                      <button type="button" onClick={() => handleRemoveExperience(index)} className="absolute top-3 right-4 text-gray-500 hover:text-red-500 font-bold transition-colors">
                        ✕
                      </button>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="text-xs text-gray-400 uppercase tracking-wide">Club / Equipo</label>
                          <input type="text" value={exp.club} onChange={(e) => handleExperienceChange(index, "club", e.target.value)} className="bg-[#222] border border-[#444] rounded p-2 text-white text-sm focus:outline-none focus:border-justo-green" placeholder="Nombre del club" />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex flex-col gap-2 w-24">
                            <label className="text-xs text-gray-400 uppercase tracking-wide">Año Inicio</label>
                            <input type="number" value={exp.yearStart} onChange={(e) => handleExperienceChange(index, "yearStart", e.target.value)} className="bg-[#222] border border-[#444] rounded p-2 text-white text-sm focus:outline-none focus:border-justo-green" placeholder="2020" />
                          </div>
                          <div className="flex flex-col gap-2 w-24">
                            <label className="text-xs text-gray-400 uppercase tracking-wide">Año Fin</label>
                            <input type="number" value={exp.yearEnd} onChange={(e) => handleExperienceChange(index, "yearEnd", e.target.value)} className="bg-[#222] border border-[#444] rounded p-2 text-white text-sm focus:outline-none focus:border-justo-green" placeholder="2023" />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wide">Rol / Logros (Opcional)</label>
                        <input type="text" value={exp.achievements} onChange={(e) => handleExperienceChange(index, "achievements", e.target.value)} className="bg-[#222] border border-[#444] rounded p-2 text-white text-sm focus:outline-none focus:border-justo-green" placeholder="Ej. Entrenador categoría Sub-15, Campeón invicto..." />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-6 bg-[#222] p-6 rounded-xl border border-[#333]">
                <h2 className="text-xl font-semibold text-justo-green">Redes Sociales y Multimedia</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300">Instagram</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">@</span>
                      <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 pl-8 w-full text-white focus:outline-none focus:border-justo-green" placeholder="usuario" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300">YouTube</label>
                    <input type="text" name="youtube" value={formData.youtube} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Enlace al canal o video" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300">TikTok</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">@</span>
                      <input type="text" name="tiktok" value={formData.tiktok} onChange={handleChange} className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3 pl-8 w-full text-white focus:outline-none focus:border-justo-green" placeholder="usuario" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-6 bg-[#222] p-6 rounded-xl border border-[#333]">
                <h2 className="text-xl font-semibold text-justo-green">Mis Características (Etiquetas)</h2>
                <p className="text-sm text-gray-400">Agrega tus principales aptitudes técnicas o físicas (ej. Velocidad, Regate, Liderazgo).</p>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={characteristicInput} 
                      onChange={(e) => setCharacteristicInput(e.target.value)} 
                      onKeyDown={handleAddCharacteristic}
                      className="flex-1 bg-[#1a1a1a] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" 
                      placeholder="Escribe una característica y presiona Enter" 
                    />
                    <button type="button" onClick={handleAddCharacteristic} className="bg-[#333] hover:bg-[#444] text-white px-6 rounded-lg font-bold transition-colors">
                      Añadir
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mainCharacteristics.map((char, index) => (
                      <div key={index} className="flex items-center gap-2 bg-justo-green/20 text-justo-green border border-justo-green/30 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                        {char}
                        <button type="button" onClick={() => handleRemoveCharacteristic(char)} className="text-justo-green hover:text-white font-bold ml-1 transition-colors">
                          &times;
                        </button>
                      </div>
                    ))}
                    {mainCharacteristics.length === 0 && (
                      <span className="text-gray-500 text-sm italic">No hay características añadidas.</span>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="sticky bottom-4 z-10">
            <button type="submit" disabled={loading} className="w-full bg-justo-green text-[#1a1a1a] py-4 rounded-xl font-bold text-lg hover:bg-[#a6d84f] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(191,255,81,0.2)]">
              {loading ? "Guardando..." : "Guardar Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
