import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Justo Talent | Donde el talento encuentra oportunidades",
  description: "La plataforma que conecta deportistas, entrenadores y clubes en el deporte amateur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-poppins bg-justo-black text-justo-white">
        <AuthProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
