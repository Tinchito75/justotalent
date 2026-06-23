"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { supabase } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user) {
        // Al registrarse, enviamos al onboarding para completar datos
        router.push("/onboarding");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] p-8 rounded-2xl border border-[#333]">
        <h1 className="text-3xl font-bold font-poppins mb-2 text-center text-justo-green">Crear Cuenta</h1>
        <p className="text-gray-400 text-center mb-8">Únete a la red deportiva más grande</p>

        {errorMsg && (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-500/30">
            {errorMsg === "User already registered" ? "Este correo ya está registrado." : errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#222] border border-[#444] rounded-xl p-3 text-white focus:outline-none focus:border-justo-green transition-colors"
              placeholder="tu@correo.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">Contraseña (Mínimo 6 caracteres)</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#222] border border-[#444] rounded-xl p-3 text-white focus:outline-none focus:border-justo-green transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-justo-green text-justo-white py-3.5 rounded-xl font-bold hover:bg-justo-dark-green transition-colors disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-justo-green font-semibold hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
