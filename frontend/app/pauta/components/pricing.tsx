"use client"

import { motion } from "framer-motion"
import { Button } from "./ui/button"
import { Check } from "lucide-react"

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-black relative">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Planos para cada tamanho de redação</h2>
          <p className="text-white/60 text-lg">Escolha o poder de processamento que você precisa.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {/* Small Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/10 bg-white/5 p-8"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Redação Ágil</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-sm text-white/60">R$</span>
              <span className="text-4xl font-bold text-white">1.490</span>
              <span className="text-white/60">/mês</span>
            </div>
            <ul className="space-y-4 mb-8 text-white/70">
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> 20 fontes RSS
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> 50 pautas/dia
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> 1 Usuário
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full rounded-full bg-transparent border-white/20 hover:bg-white/10 text-white"
            >
              Começar Agora
            </Button>
          </motion.div>

          {/* Pro Plan - Highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-3xl border border-emerald-500/30 bg-white/5 p-8 py-12 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              MAIS POPULAR
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Publisher Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-sm text-white/60">R$</span>
              <span className="text-4xl font-bold text-white">3.990</span>
              <span className="text-white/60">/mês</span>
            </div>
            <ul className="space-y-4 mb-8 text-white/80">
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-400" /> Fontes ilimitadas
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-400" /> Multi-usuário
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-400" /> Pautas ilimitadas
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-emerald-400" /> Suporte Prioritário
              </li>
            </ul>
            <Button className="w-full rounded-full bg-emerald-500 text-black hover:bg-emerald-400 font-medium">
              Assinar Pro
            </Button>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-8"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-2xl font-bold text-white">Sob Consulta</span>
            </div>
            <ul className="space-y-4 mb-8 text-white/70">
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> API Dedicada
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> Servidor Privado (On-premise)
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> Treinamento Personalizado
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> SLA Garantido
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full rounded-full bg-transparent border-white/20 hover:bg-white/10 text-white"
            >
              Falar com Vendas
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
