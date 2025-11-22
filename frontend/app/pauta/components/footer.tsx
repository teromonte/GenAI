import Link from "next/link"

export function Footer() {
  return (
    <footer className="py-12 border-t border-white/10 bg-black text-center">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-white/40 text-sm">Copyright © 2025 Pauta.ai. Todos os direitos reservados.</p>

        <div className="flex gap-6 text-sm text-white/40">
          <Link href="#" className="hover:text-white transition-colors">
            Termos de Uso
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Privacidade
          </Link>
        </div>
      </div>
    </footer>
  )
}
