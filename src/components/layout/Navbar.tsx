"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="w-full flex items-center justify-between p-4 md:px-8 border-b border-[#333] bg-justo-black sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl font-bold font-poppins tracking-tight">
            Justo<span className="text-justo-green">Talent</span>
          </span>
        </Link>
      </div>
      
      <div className="hidden md:flex items-center gap-6 text-sm text-gray-300 font-medium">
        <Link href="/" className="hover:text-justo-white transition-colors">Inicio</Link>
        <Link href="/opportunities" className="hover:text-justo-white transition-colors text-justo-green font-semibold">Buscador de Oportunidades</Link>
      </div>

      <div className="flex items-center gap-4">
        {!loading && (
          user ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-sm font-semibold hover:text-justo-green transition-colors">Mi Perfil</Link>
              <button 
                onClick={logout}
                className="text-sm text-gray-400 hover:text-justo-white transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <>
              <Link 
                href="/admin-test"
                className="bg-justo-green text-justo-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-justo-dark-green transition-colors"
              >
                Ingresar / Probar
              </Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}
