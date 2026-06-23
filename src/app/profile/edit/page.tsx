"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function EditProfilePage() {
  const { user, userData, refreshUserData, loading: authLoading } = useAuth();
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
  const [experienceList, setExperienceList] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }
    
    if (userData) {
      const currentRole = userData.role as "player" | "coach" | "club" || "player";
      setRole(currentRole);
      
      let profile = userData.playerProfile;
      if (currentRole === "coach") profile = userData.coachProfile;
      if (currentRole === "club") profile = userData.clubProfile;

      setFormData({
        firstName: userData.basicInfo?.firstName || "",
        lastName: userData.basicInfo?.lastName || "",
        city: userData.basicInfo?.location?.city || "",
        birthDate: profile?.birthDate || "",
        heightCm: profile?.heightCm?.toString() || "",
        sport: profile?.sport || "",
        experienceYears: profile?.experienceYears?.toString() || "",
        currentClub: profile?.currentClub || "",
        currentClubId: profile?.currentClubId || "",
        specialty: profile?.specialty || "",
        certifications: profile?.certifications || "",
        clubName: profile?.clubName || "",
        sponsors: profile?.sponsors ? profile.sponsors.join(', ') : "",
      });

      if (currentRole !== "club") {
        if (Array.isArray(profile?.characteristics)) {
          setSkills(profile.characteristics);
        } else if (typeof profile?.characteristics === 'string' && profile.characteristics) {
          setSkills([profile.characteristics]);
        } else {
          setSkills([]);
        }
        setExperienceList(profile?.experience || []);
      }
      const fetchClubs = async () => {
        const q = query(collection(db, "users"), where("role", "==", "club"));
        const snapshot = await getDocs(q);
        setAvailableClubs(snapshot.docs.map(d => ({ id: d.id, ...d.data().clubProfile })));
      };
      fetchClubs();
    }
  }, [userData, authLoading, user, router]);

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
          country: "Argentina" // Simplificado por ahora
        }
      };

      if (role === "club") {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          role: "club",
          basicInfo,
          clubProfile: {
            clubName: formData.clubName,
            sport: formData.sport,
            sponsors: formData.sponsors.split(',').map(s => s.trim()).filter(s => s),
          }
        });
      } else {
        const profile = role === "player" ? userData?.playerProfile : userData?.coachProfile;
        const baseProfile = {
          birthDate: formData.birthDate,
          sport: formData.sport,
          experienceYears: Number(formData.experienceYears) || 0,
          currentClub: formData.currentClub,
          currentClubId: formData.currentClubId,
          characteristics: skills,
          experience: experienceList,
        };

        if (formData.currentClubId && formData.currentClubId !== profile?.currentClubId) {
          await setDoc(doc(db, "club_memberships", `${user.uid}_${formData.currentClubId}`), {
            userId: user.uid,
            clubId: formData.currentClubId,
            userName: `${basicInfo.firstName} ${basicInfo.lastName}`,
            userRole: role,
            status: "pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        const userRef = doc(db, "users", user.uid);
        if (role === "player") {
          await updateDoc(userRef, {
            role: "player",
            basicInfo,
            playerProfile: {
              ...baseProfile,
              heightCm: Number(formData.heightCm) || null,
              clubVerified: profile?.currentClubId === formData.currentClubId ? profile?.clubVerified : false,
            }
          });
        } else if (role === "coach") {
          await updateDoc(userRef, {
            role: "coach",
            basicInfo,
            coachProfile: {
              ...baseProfile,
              specialty: formData.specialty,
              certifications: formData.certifications,
              clubVerified: profile?.currentClubId === formData.currentClubId ? profile?.clubVerified : false,
            }
          });
        }
      }

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
      <div className="w-full max-w-3xl bg-[#1a1a1a] p-8 rounded-2xl border border-[#333]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold font-poppins">Editar Perfil</h1>
          <button onClick={() => router.push("/profile")} className="text-gray-400 hover:text-white">
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
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

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-justo-green border-b border-[#333] pb-2">
              {role === 'club' ? 'Datos del Coordinador / Representante' : 'Datos Personales'}
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Nombre *</label>
                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Apellido *</label>
                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Ciudad de residencia / sede *</label>
              <input required type="text" name="city" value={formData.city} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
            </div>
            
            {role !== 'club' && (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Fecha de Nacimiento</label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" style={{ colorScheme: "dark" }} />
                </div>
              </div>
            )}
          </section>

          {role === 'club' ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-justo-green border-b border-[#333] pb-2">Información del Club</h2>
              
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
            </section>
          ) : (
            <>
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-justo-green border-b border-[#333] pb-2">Perfil Deportivo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
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
                  
                  {role === "player" ? (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">Estatura (cm)</label>
                      <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
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
                    <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="bg-[#222] border border-[#444] rounded-lg p-3 text-white focus:outline-none focus:border-justo-green" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 relative">
                  <label className="text-sm font-medium text-gray-300">Club Actual</label>
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
                      placeholder="Ej. Velocidad, Liderazgo, Visión de juego (Presiona Enter)" 
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
              </section>

              <section className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-[#333] pb-2">
                  <h2 className="text-xl font-semibold text-justo-green">Línea Histórica (Clubes)</h2>
                  <button type="button" onClick={handleAddExperience} className="text-sm text-justo-green hover:text-white font-medium">
                    + Agregar experiencia
                  </button>
                </div>
                
                {experienceList.length === 0 && (
                  <p className="text-gray-500 text-sm italic">Aún no has agregado experiencia previa.</p>
                )}

                {experienceList.map((exp, index) => (
                  <div key={index} className="bg-[#222] p-4 rounded-xl border border-[#444] flex flex-col gap-4 relative">
                    <button type="button" onClick={() => handleRemoveExperience(index)} className="absolute top-2 right-4 text-red-500 hover:text-red-400 text-sm font-bold">
                      X
                    </button>
                    <div className="flex flex-col md:flex-row gap-4 mt-2">
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="text-xs text-gray-400">Club / Equipo</label>
                        <input type="text" value={exp.club} onChange={(e) => handleExperienceChange(index, "club", e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-white text-sm focus:outline-none" placeholder="Nombre del club" />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col gap-2 w-24">
                          <label className="text-xs text-gray-400">Año Inicio</label>
                          <input type="number" value={exp.yearStart} onChange={(e) => handleExperienceChange(index, "yearStart", e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-white text-sm focus:outline-none" placeholder="2020" />
                        </div>
                        <div className="flex flex-col gap-2 w-24">
                          <label className="text-xs text-gray-400">Año Fin</label>
                          <input type="number" value={exp.yearEnd} onChange={(e) => handleExperienceChange(index, "yearEnd", e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-white text-sm focus:outline-none" placeholder="2023" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400">Rol / Logros (Opcional)</label>
                      <input type="text" value={exp.achievements} onChange={(e) => handleExperienceChange(index, "achievements", e.target.value)} className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-white text-sm focus:outline-none" placeholder="Ej. Entrenador categoría Sub-15, Campeón invicto..." />
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}

          <button type="submit" disabled={loading} className="w-full mt-4 bg-justo-green text-justo-white py-4 rounded-xl font-bold hover:bg-justo-dark-green transition-colors disabled:opacity-50">
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
