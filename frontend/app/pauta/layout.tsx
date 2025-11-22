import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "Pauta.ai - A Nova Era do Jornalismo Digital",
    description: "A primeira IA focada na descoberta de notícias para redações brasileiras.",
}

export default function PautaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
