import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { HeroGeometric } from "./hero-geometric"

export function Hero() {
  return (
    <div className="relative min-h-screen">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <HeroGeometric className="absolute inset-0" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="text-2xl font-bold text-white">DIGIMON</div>

        <div className="flex items-center gap-8">
          <Link href="#" className="flex items-center gap-1 text-white hover:text-white/80">
            Home <ChevronDown className="h-4 w-4" />
          </Link>
          <Link href="#" className="flex items-center gap-1 text-white hover:text-white/80">
            About <ChevronDown className="h-4 w-4" />
          </Link>
          <Link href="#" className="flex items-center gap-1 text-white hover:text-white/80">
            Services <ChevronDown className="h-4 w-4" />
          </Link>
          <Link href="#" className="text-white hover:text-white/80">
            Advisor
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-white hover:text-white/80">
            Sign in
          </Link>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center px-8 text-center"
        style={{ minHeight: "calc(100vh - 88px)" }}
      >
        <h1 className="mb-6 max-w-6xl text-6xl font-bold leading-tight text-white md:text-7xl lg:text-8xl">
          WE BUILD AND SCALE DIGITAL PRODUCT
        </h1>

        <p className="mb-12 max-w-3xl text-lg text-muted-foreground md:text-xl">
          Founding successful companies by combining ideas with business expertise, capital and technical execution.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="px-8">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-white bg-transparent text-white hover:bg-white/10 px-8"
          >
            How it work
          </Button>
        </div>
      </div>
    </div>
  )
}
