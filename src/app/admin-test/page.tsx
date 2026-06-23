"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

export default function AdminTestPage() {
  const router = useRouter();
  const { refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const mockProfiles = {
    player: {
      email: "player@demo.com",
      password: "password123",
      role: "player",
      basicInfo: { firstName: "Lionel", lastName: "Demo", location: { city: "Rosario", country: "Argentina" } },
      playerProfile: { sport: "Fútbol", position: "Delantero", dominantFoot: "Izquierdo", heightCm: 170, experienceYears: 15, birthDate: "1987-06-24", characteristics: ["Regate", "Definición", "Velocidad"] }
    },
    coach: {
      email: "coach@demo.com",
      password: "password123",
      role: "coach",
      basicInfo: { firstName: "Pep", lastName: "Demo", location: { city: "Barcelona", country: "España" } },
      coachProfile: { sport: "Fútbol", specialty: "Entrenador Principal", certifications: "Licencia PRO UEFA", experienceYears: 15, birthDate: "1971-01-18" }
    },
    club: {
      email: "club@demo.com",
      password: "password123",
      role: "club",
      basicInfo: { firstName: "Joan", lastName: "Demo", location: { city: "Barcelona", country: "España" } },
      clubProfile: { clubName: "FC Demo", location: "Barcelona", sport: "Fútbol", sponsors: ["Nike", "Spotify"] }
    }
  };

  const loginAs = async (type: "player" | "coach" | "club") => {
    setLoading(true);
    setMessage("");
    const profile = mockProfiles[type];

    try {
      // Intentar login primero
      try {
        const cred = await signInWithEmailAndPassword(auth, profile.email, profile.password);
        await refreshUserData();
        router.push("/profile");
      } catch (loginError: any) {
        // Si falla porque no existe, lo creamos
        if (loginError.code === "auth/user-not-found" || loginError.code === "auth/invalid-credential" || loginError.code === "auth/invalid-login-credentials") {
          const cred = await createUserWithEmailAndPassword(auth, profile.email, profile.password);
          
          // Crear documento en Firestore
          await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            email: profile.email,
            displayName: `${profile.basicInfo.firstName} ${profile.basicInfo.lastName}`,
            role: profile.role,
            basicInfo: profile.basicInfo,
            ...(type === 'player' ? { playerProfile: (profile as any).playerProfile } : {}),
            ...(type === 'coach' ? { coachProfile: (profile as any).coachProfile } : {}),
            ...(type === 'club' ? { clubProfile: (profile as any).clubProfile } : {}),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          await refreshUserData();
          router.push("/profile");
        } else {
          throw loginError;
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/operation-not-allowed") {
        setMessage("⚠️ ERROR: Debes habilitar 'Correo/Contraseña' en los métodos de acceso de Firebase Authentication.");
      } else {
        setMessage(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Panel de Pruebas (Admin)</h1>
        <p className="text-gray-400 mb-8 text-sm">
          Usa estos botones para iniciar sesión automáticamente con cuentas de prueba. 
          Si no existen, se crearán solas (requiere tener habilitado Email/Password en Firebase).
        </p>

        {message && (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button 
            disabled={loading}
            onClick={() => loginAs("player")}
            className="bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
          >
            🧑 Entrar como Jugador Demo
          </button>
          
          <button 
            disabled={loading}
            onClick={() => loginAs("coach")}
            className="bg-justo-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-600 transition-colors"
          >
            👨‍🏫 Entrar como DT Demo
          </button>
          
          <button 
            disabled={loading}
            onClick={() => loginAs("club")}
            className="bg-justo-green text-white font-bold py-3 px-4 rounded-xl hover:bg-justo-dark-green transition-colors"
          >
            🏟️ Entrar como Club Demo
          </button>
        </div>
      </div>
    </div>
  );
}
