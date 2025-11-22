"use client"

import { motion } from "framer-motion"
import { Button } from "./ui/button"
import { Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-32 pb-16 px-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl -z-10" />

      <div className="container max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Nova Era do Jornalismo Digital
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl"
        >
          Transforme o Caos de Informação em <span className="text-gradient-emerald">Pautas Publicáveis.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          A primeira IA focada na descoberta de notícias para redações brasileiras. Monitoramos seus feeds RSS 24/7 e
          geramos rascunhos verificáveis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button
            size="lg"
            className="h-12 rounded-full bg-white px-8 text-base text-black hover:bg-white/90 w-full sm:w-auto"
          >
            Agendar Demonstração
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-white/10 bg-transparent px-8 text-base text-white hover:bg-white/5 w-full sm:w-auto"
          >
            Ver em Ação
          </Button>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, rotateX: 20, scale: 0.9 }}
          animate={{ opacity: 1, rotateX: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="mt-20 relative mx-auto max-w-5xl perspective-1000"
          style={{ perspective: "1000px" }}
        >
          <div className="relative rounded-xl border border-white/10 bg-black/40 p-2 backdrop-blur-sm shadow-2xl transform-gpu rotate-x-12 transition-transform duration-1000 hover:rotate-x-0">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20" />

            {/* Mockup Content */}
            <div className="overflow-hidden rounded-lg border border-white/5 bg-[#0A0A0A] aspect-[16/9] relative">
              {/* Header */}
              <div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="h-6 w-64 rounded-md bg-white/5" />
              </div>

              {/* Body */}
              <div className="p-6 grid grid-cols-12 gap-6 h-full">
                <div className="col-span-3 border-r border-white/5 pr-6 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-12 rounded bg-white/5 w-full animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <div className="col-span-9 space-y-6">
                  <div className="flex gap-4">
                    <div className="h-32 w-full rounded bg-emerald-500/5 border border-emerald-500/10 p-4">
                      <div className="h-6 w-3/4 bg-emerald-500/20 rounded mb-3" />
                      <div className="h-4 w-1/2 bg-emerald-500/10 rounded" />
                    </div>
                    <div className="h-32 w-full rounded bg-white/5 border border-white/5" />
                    <div className="h-32 w-full rounded bg-white/5 border border-white/5" />
                  </div>
                  <div className="h-64 w-full rounded bg-white/5 border border-white/5 p-4">
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-white/5 rounded" />
                      <div className="h-4 w-5/6 bg-white/5 rounded" />
                      <div className="h-4 w-4/6 bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
