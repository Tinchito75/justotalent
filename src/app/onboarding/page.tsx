"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function OnboardingPage() {
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
    sport: "",
    experienceYears: "",
    currentClub: "",
    specialty: "",
    certifications: "",
    clubName: "",
    sponsors: "",
    currentClubId: "",
  });

  const [availableClubs, setAvailableClubs] = useState<any[]>([]);
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      const timeout = setTimeout(() => {
        if (!user) router.push("/");
      }, 1000);
      return () => clearTimeout(timeout);
    }
    
    if (userData?.basic_info) {
      router.push("/profile");
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    const fetchClubs = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, club_profile')
        .eq('role', 'club');
      if (data && !error) {
        setAvailableClubs(data.map(d => ({ id: d.id, ...d.club_profile })));
      }
    };
    fetchClubs();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
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
        display_name: `${formData.firstName} ${formData.lastName}`,
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
        const baseProfile = {
          birthDate: formData.birthDate,
          sport: formData.sport,
          experienceYears: Number(formData.experienceYears) || 0,
          currentClub: formData.currentClub,
          currentClubId: formData.currentClubId,
          characteristics: skills,
          experience: [],
        };

        if (formData.currentClubId) {
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
            clubVerified: false,
          };
        } else if (role === "coach") {
          baseUpsert.coach_profile = {
            ...baseProfile,
            specialty: formData.specialty,
            certifications: formData.certifications,
            clubVerified: false,
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

  if (authLoading || (!userData?.basic_info && user === null)) {
    return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl bg-[#1a1a1a] p-8 rounded-2xl border border-[#333]">
        <h1 className="text-3xl font-bold font-poppins mb-2 text-justo-green">Completa tu perfil</h1>
        <p className="text-gray-400 mb-8">Necesitamos algunos datos más para que puedas empezar.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">¿Qué rol ocupas en el deporte? *</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                type="button" 
                onClick={() => setRole("player")} 
                className={`flex-1 py-3 rounded-lg border font-medium transition-colors text-sm ${role === 'player' ? 'border-justo-green bg-justo-green bg-opacity-20 text-justo-green' : 'border-[#444] text-gray-400 hover:border-gray-500'}`}
              >
                Jugador / Deportista
              </button>
              <button 
                type="button" 
                onClick={() => setRole("coach")} 
                className={`flex-1 py-3 rounded-lg border font-medium transition-colors text-sm ${role === 'coach' ? 'border-justo-green bg-justo-green bg-opacity-20 text-justo-green' : 'border-[#444] text-gray-400 hover:border-gray-500'}`}
              >
                Entrenador / PF
              </button>
              <button 
                type="button" 
                onClick={() => setRole("club")} 
                className={`flex-1 py-3 rounded-lg border font-medium transition-colors text-sm ${role === 'club' ? 'border-justo-green bg-justo-green bg-opacity-20 text-justo-green' : 'border-[#444] text-gray-400 hover:border-gray-500'}`}
              >
                Club / Coordinador
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Nombre (Tu nombre) *</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Ej. Juan" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Apellido *</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Ej. Pérez" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Ciudad de residencia / sede *</label>
            <input required type="text" name="city" value={formData.city} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Ej. Rosario" />
          </div>

          {role === "club" ? (
            // Campos de Club
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Nombre del Club *</label>
                <input required type="text" name="clubName" value={formData.clubName} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Ej. Club Atlético San Martín" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Deporte Principal *</label>
                <select required name="sport" value={formData.sport} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green">
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
                <input type="text" name="sponsors" value={formData.sponsors} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Ej. Nike, Gatorade, Banco Nación" />
              </div>
            </>
          ) : (
            // Campos Jugador / Entrenador
            <>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Deporte *</label>
                  <select required name="sport" value={formData.sport} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green">
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
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Fecha de Nacimiento</label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" style={{ colorScheme: "dark" }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {role === "player" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300">Estatura (cm)</label>
                    <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Ej. 180" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300">Especialidad</label>
                    <select name="specialty" value={formData.specialty} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green">
                      <option value="">Selecciona...</option>
                      <option value="Director Técnico">Director Técnico</option>
                      <option value="Preparador Físico">Preparador Físico</option>
                      <option value="Ayudante de Campo">Ayudante de Campo</option>
                      <option value="Entrenador Arqueros">Entrenador Arqueros</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Años de experiencia</label>
                  <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" placeholder="Ej. 5" />
                </div>
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-sm font-medium text-gray-300">Club Actual (Opcional)</label>
                <input 
                  type="text" 
                  name="currentClub" 
                  value={formData.currentClub} 
                  onChange={(e) => { handleChange(e); setShowClubDropdown(true); }} 
                  onFocus={() => setShowClubDropdown(true)}
                  className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" 
                  placeholder="Busca tu club..." 
                  autoComplete="off"
                />
                {showClubDropdown && formData.currentClub && (
                  <div className="absolute top-full mt-1 w-full bg-[#222] border border-[#444] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
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

              {role === "coach" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Certificaciones y Cursos</label>
                  <textarea name="certifications" value={formData.certifications} onChange={handleChange} rows={3} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green resize-none" placeholder="Ej. Licencia PRO CONMEBOL, Curso de Preparación Física Nivel 1..."></textarea>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Características y Aptitudes</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={skillInput} 
                    onChange={(e) => setSkillInput(e.target.value)} 
                    onKeyDown={handleAddSkill}
                    className="flex-1 bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" 
                    placeholder="Ej. Velocidad, Liderazgo (Presiona Enter)" 
                  />
                  <button type="button" onClick={handleAddSkill} className="bg-[#333] hover:bg-[#444] text-white px-4 rounded-lg font-bold transition-colors">
                    Añadir
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 bg-justo-green text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-white hover:text-gray-200 font-bold ml-1">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="w-full mt-2 bg-justo-green text-justo-white py-4 rounded-xl font-bold hover:bg-justo-dark-green transition-colors disabled:opacity-50">
            {loading ? "Guardando..." : "Finalizar y Ver Perfil"}
          </button>
        </form>
      </div>
    </div>
  );
}
