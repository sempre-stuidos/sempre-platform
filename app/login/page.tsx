import { GalleryVerticalEnd } from "lucide-react"

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
          <a href="#" className="flex items-center gap-2 self-center font-medium text-white">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Sempre Studios
          </a>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
