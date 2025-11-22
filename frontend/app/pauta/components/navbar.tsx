"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "./ui/button"

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-4"
    >
      <div className="flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-black/60 px-6 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-black/30">
        <Link href="/" className="text-xl font-bold tracking-tighter text-white">
          Pauta<span className="text-emerald-500">.ai</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <Link href="#features" className="hover:text-white transition-colors">
            Funcionalidades
          </Link>
          <Link href="#pricing" className="hover:text-white transition-colors">
            Preços
          </Link>
          <Link href="#faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
        </nav>

        <Button className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-medium h-9 text-sm">
          Agendar Demo
        </Button>
      </div>
    </motion.header>
  )
}
