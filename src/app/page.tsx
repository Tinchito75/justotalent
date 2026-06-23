import Link from "next/link";

export default function Home() {
  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24"
      style={{
        background: "linear-gradient(rgba(17, 17, 17, 0.75), rgba(17, 17, 17, 0.9)), url('https://zfgxckuloavorrjruiob.supabase.co/storage/v1/object/public/fotos/fondo.png') no-repeat center center fixed",
        backgroundSize: "cover"
      }}
    >
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center font-poppins flex flex-col gap-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Donde el talento encuentra <span className="text-justo-green">oportunidades.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
          La plataforma definitiva para conectar deportistas, entrenadores y clubes en el deporte amateur.
        </p>
        <div className="flex gap-4 mt-8 justify-center">
          <Link 
            href="/opportunities" 
            className="bg-justo-green text-justo-white px-8 py-4 rounded-full font-semibold hover:bg-justo-dark-green transition-colors"
          >
            Buscar oportunidades
          </Link>
        </div>
      </div>

      {/* Stats Counter Section */}
      <div className="w-full max-w-4xl mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-t border-[#333] pt-12">
        <div>
          <h3 className="text-4xl font-bold text-justo-white">+1.000</h3>
          <p className="text-gray-400 mt-2">Deportistas</p>
        </div>
        <div>
          <h3 className="text-4xl font-bold text-justo-white">+80</h3>
          <p className="text-gray-400 mt-2">Clubes y entrenadores</p>
        </div>
        <div>
          <h3 className="text-4xl font-bold text-justo-white">+500</h3>
          <p className="text-gray-400 mt-2">Oportunidades publicadas</p>
        </div>
      </div>
    </main>
  );
}
