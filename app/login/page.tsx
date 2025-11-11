import Image from "next/image"
import { Suspense } from "react"

import { LoginForm } from "@/components/login-form"
import { HeroGeometric } from "@/components/hero-geometric"

export default function LoginPage() {
  return (
    <div className="relative min-h-screen">
      <HeroGeometric 
        badge="Sempre Studios"
        title1="Welcome Back"
        title2="Sign In to Continue"
        description="Access your agency dashboard and manage your projects with ease."
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
          <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
