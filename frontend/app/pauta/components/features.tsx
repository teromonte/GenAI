"use client"

import { motion } from "framer-motion"
import { Layers, EyeOff, RefreshCw, Rss, FileText, ShieldCheck } from "lucide-react"

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container px-4 mx-auto">
        {/* Problem Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">
            O Jornalismo em Tempo Real, <span className="text-white/40">sem Burnout.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Layers,
                title: "Sobrecarga de Fontes",
                desc: "Monitorar dezenas de sites e feeds RSS consome o tempo precioso de apuração.",
              },
              {
                icon: EyeOff,
                title: "Furos Perdidos",
                desc: "Histórias importantes e ângulos locais passam despercebidos no ruído.",
              },
              {
                icon: RefreshCw,
                title: "Trabalho Repetitivo",
                desc: "Jornalistas perdem horas formatando notas simples em vez de focar em análises.",
              },
            ].map((item, index) => (
              <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center mb-4 text-white">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                <p className="text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Solution Section - Bento Grid */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Sua Redação, <br className="md:hidden" />
              <span className="text-emerald-400">Potencializada por RAG.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-12 gap-6 max-w-6xl mx-auto">
            {/* Feature A - Large */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:col-span-8 group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] p-8 md:p-12 hover:border-white/20 transition-colors"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -z-10" />

              <div className="flex flex-col h-full justify-between relative z-10">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                    <Rss className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Monitoramento Inteligente</h3>
                  <p className="text-lg text-white/60 max-w-md">
                    Conecte fontes oficiais e a IA cruza dados para encontrar o que é novo. Filtre por relevância e
                    impacto.
                  </p>
                </div>

                {/* UI Simulation */}
                <div className="w-full h-48 bg-white/5 rounded-xl border border-white/10 p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent z-10" />
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="h-2 w-24 bg-white/20 rounded-full" />
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full" />
                    <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature B - Tall */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-4 group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] p-8 hover:border-white/20 transition-colors"
            >
              <div className="mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Rascunhos Automáticos</h3>
                <p className="text-white/60">
                  Defina o estilo (Nota Rápida, Serviço) e receba textos estruturados prontos para edição.
                </p>
              </div>
              <div className="mt-auto pt-8">
                <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/5">
                  <div className="h-2 w-full bg-white/20 rounded" />
                  <div className="h-2 w-full bg-white/10 rounded" />
                  <div className="h-2 w-2/3 bg-white/10 rounded" />
                </div>
              </div>
            </motion.div>

            {/* Feature C - Wide */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-12 group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 hover:border-white/20 transition-colors"
            >
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Sem Alucinações</h3>
                <p className="text-lg text-white/60">
                  Cada parágrafo vem com link direto para a fonte original do RSS. Garantimos 100% de rastreabilidade
                  para sua segurança editorial.
                </p>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-white/5 rounded-xl border border-white/10 p-6 relative">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-1 bg-purple-500 h-12 rounded-full" />
                    <div>
                      <div className="h-4 w-48 bg-white/20 rounded mb-2" />
                      <div className="h-3 w-full bg-white/10 rounded mb-1" />
                      <div className="h-3 w-32 bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="text-xs text-white/40 flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                    <span>Fonte: g1.globo.com</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span>Verificado</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
