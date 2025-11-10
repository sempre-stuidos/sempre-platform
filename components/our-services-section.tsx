import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

export function OurServicesSection() {
  const services = [
    {
      id: 1,
      title: "Web Design",
      description: "Make the appearance of website pages so that they look so beautiful and pleasing to the eye.",
      hasHighlight: false
    },
    {
      id: 2,
      title: "UI/UX Design", 
      description: "Defines the experience that users will have when interacting with the company, its services, and its products.",
      hasHighlight: true
    },
    {
      id: 3,
      title: "Brand Design",
      description: "Help design all branding according to the business realm. Designers design designs that accurately reflect the products being marketed.",
      hasHighlight: false
    },
    {
      id: 4,
      title: "Graphic Design",
      description: "A graphic designer creates work for publishers, print and electronic media, such as brochures and advertisements.",
      hasHighlight: false
    }
  ]

  return (
    <section className="bg-background py-16 px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-16 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              OUR SERVICES
            </h2>
            <p className="text-lg text-muted-foreground">
              This is part of our service that can give you satisfaction.
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8">
            View more
          </Button>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Side - Interface Mockup */}
          <div className="relative">
            {/* Main Interface Screen */}
            <div className="relative z-10 rounded-lg bg-card shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6">
                {/* Navigation Bar */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-white/80">
                    <span className="font-bold text-white">U</span>
                    <span>Search</span>
                    <span>Communities</span>
                    <span>Quick Move-ins</span>
                    <span>Open Houses</span>
                    <span>About</span>
                    <span>Warranty</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">Find Your Place</h3>
                    <p className="text-white/70">Building what&apos;s next in the heart of Utah.</p>
                  </div>

                  {/* Search Interface */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-white/60 uppercase tracking-wide">ROAM</label>
                      <div className="bg-white/10 rounded-lg p-3 text-white/80">Centerville</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-white/60 uppercase tracking-wide">Apartments</label>
                      <div className="bg-white/10 rounded-lg p-3 text-white/80">Community</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-white/60 uppercase tracking-wide">City</label>
                      <div className="bg-white/10 rounded-lg p-3 text-white/80">Type</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-white/60 uppercase tracking-wide">Search</label>
                      <div className="bg-primary rounded-lg p-3 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Layer 1 */}
            <div className="absolute -top-4 -right-4 z-0 w-full h-full rounded-lg bg-gradient-to-br from-chart-1/20 to-chart-2/20 transform rotate-3"></div>
            
            {/* Background Layer 2 */}
            <div className="absolute -top-2 -right-2 z-5 w-full h-full rounded-lg bg-gradient-to-br from-chart-3/30 to-primary/20 transform rotate-1"></div>
          </div>

          {/* Right Side - Services List */}
          <div className="space-y-8">
            {services.map((service, index) => (
              <div key={service.id} className="group">
                <div className="flex items-start justify-between py-4 border-b border-border/50 hover:border-border transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm text-muted-foreground font-mono">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${
                      service.hasHighlight 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                    }`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
