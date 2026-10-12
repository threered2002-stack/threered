import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/providers/auth-provider"
import { OrgProvider } from "@/providers/org-provider"
import { ToastProvider } from "@/providers/toast-provider"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Sistema PADRE — Gestión Integral",
    template: "%s | Sistema PADRE",
  },
  description:
    "Sistema de gestión integral multi-rubro. Administrá tu vinoteca, stock, ventas, clientes, compras y finanzas desde una sola plataforma.",
  keywords: ["gestión", "vinoteca", "stock", "ventas", "POS", "inventario"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn("h-full", inter.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans antialiased bg-neutral-950 text-neutral-50">
        <AuthProvider>
          <OrgProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </OrgProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
