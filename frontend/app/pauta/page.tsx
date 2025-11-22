import { Navbar } from "./components/navbar"
import { Hero } from "./components/hero"
import { Features } from "./components/features"
import { Pricing } from "./components/pricing"
import { FAQ } from "./components/faq"
import { Footer } from "./components/footer"

export default function Page() {
  return (
    <main className="bg-black min-h-screen text-white selection:bg-emerald-500/30">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  )
}
