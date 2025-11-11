import Image from "next/image"

import { RegisterForm } from "@/components/register-form"
import { HeroGeometric } from "@/components/hero-geometric"

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen">
      <HeroGeometric 
        badge="Sempre Studios"
        title1="Join Us Today"
        title2="Create Your Account"
        description="Start your journey with our creative agency platform."
        className="absolute inset-0"
      />
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="#" className="flex items-center gap-3 self-center text-white">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white flex size-12 items-center justify-center rounded-md">
              <Image 
                src="/se-logo.png" 
                alt="Sempre Studios Logo" 
                width={40} 
                height={40} 
                className="size-10"
              />
            </div>
            <span className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-orbitron)' }}>Sempre Studios</span>
          </a>
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}


