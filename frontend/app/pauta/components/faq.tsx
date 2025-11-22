"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { motion } from "framer-motion"

export function FAQ() {
  return (
    <section id="faq" className="py-24 relative bg-[#050505]">
      <div className="container max-w-3xl mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12 tracking-tight"
        >
          Perguntas Frequentes
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              {
                question: "A IA vai substituir meus jornalistas?",
                answer:
                  "Não. O Pauta.ai é uma ferramenta de produtividade. A responsabilidade editorial é 100% humana. Nós aceleramos a descoberta e o rascunho inicial, permitindo que seus jornalistas foquem em análise, entrevistas e checagem.",
              },
              {
                question: "O conteúdo é livre de plágio?",
                answer:
                  "Sim. Usamos RAG (Retrieval Augmented Generation) para resumir e citar a origem, garantindo total rastreabilidade. Cada afirmação gerada pela IA é acompanhada de um link para a fonte original do RSS.",
              },
              {
                question: "Funciona em Português?",
                answer:
                  "Sim. Nossa IA é nativa para o contexto brasileiro e jornalismo local, entendendo nuances regionais e termos específicos do nosso mercado.",
              },
            ].map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-white/10 rounded-lg px-6 bg-white/5 data-[state=open]:bg-white/10 transition-colors"
              >
                <AccordionTrigger className="text-lg font-medium text-white hover:no-underline hover:text-emerald-400 transition-colors">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/70 text-base leading-relaxed pb-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
