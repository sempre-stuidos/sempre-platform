export function ServicesSection() {
  const technologies = [
    { name: "Next.js", tagline: "React Framework" },
    { name: "Webflow", tagline: "No-Code Design" },
    { name: "Shopify", tagline: "E-commerce Platform" },
    { name: "Vue.js", tagline: "Progressive Framework" },
    { name: "CMS", tagline: "Content Management" },
    { name: "Automation", tagline: "Workflow Solutions" },
    { name: "Accessibility", tagline: "Inclusive Design" },
    { name: "Responsive", tagline: "Mobile-First Design" },
  ]

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-full">
        {/* Technology Stack Marquee - Full Width */}
        <div className="mb-16 -mx-6 md:-mx-8 overflow-hidden">
          <div className="flex animate-marquee gap-8">
            {[...technologies, ...technologies].map((tech, index) => (
              <div key={index} className="flex flex-col items-center justify-center gap-1 text-center min-w-[200px] flex-shrink-0">
                <div className="text-2xl font-bold text-muted-foreground md:text-3xl">{tech.name}</div>
                {tech.tagline && <div className="text-xs text-muted-foreground">{tech.tagline}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Services Description */}
        <div className="mx-auto max-w-5xl">
          <blockquote className="text-3xl font-light leading-relaxed text-foreground md:text-4xl lg:text-5xl">
            "At Sempre Studios, we leverage cutting-edge technologies to deliver exceptional digital solutions. 
            From small startups to enterprise businesses, we provide efficient, scalable, and innovative services 
            that drive growth and success in the digital landscape."
          </blockquote>
        </div>
      </div>
    </section>
  )
}
