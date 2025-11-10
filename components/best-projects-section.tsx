import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function BestProjectsSection() {
  const projects = [
    {
      id: 1,
      title: "Lakote Real Estate",
      location: "Jakarta, Indonesia",
      image: "/api/placeholder/400/300",
      description: "Modern real estate platform with advanced property search and management features."
    },
    {
      id: 2,
      title: "Musikalis Music Platform",
      location: "Kuala Lumpur, Malaysia", 
      image: "/api/placeholder/400/300",
      description: "Comprehensive music streaming platform with social features and artist tools."
    },
    {
      id: 3,
      title: "Bankot Financial Web",
      location: "Sydney, Australia",
      image: "/api/placeholder/400/300", 
      description: "Secure financial management platform with investment tracking and analytics."
    }
  ]

  return (
    <section className="bg-background py-16 px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-16 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              BEST PROJECT
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore more of our best projects.
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8">
            View more
          </Button>
        </div>

        {/* Project Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="group">
              <div className="overflow-hidden rounded-lg bg-card shadow-lg transition-all duration-300 group-hover:shadow-xl">
                {/* Project Mockup/Image */}
                <div className="aspect-[4/3] bg-muted p-8">
                  <div className="h-full w-full rounded-lg bg-background p-6 shadow-inner">
                    {/* Mock UI Header */}
                    <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                      <div className="text-lg font-bold text-foreground">{project.title.split(' ')[0]}</div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Sign in</Button>
                        <Button size="sm">Sign Up</Button>
                      </div>
                    </div>
                    
                    {/* Mock Content */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-foreground">
                        {project.title} Platform
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                      
                      {/* Mock Stats */}
                      <div className="flex gap-4">
                        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                          Active Users 120K
                        </div>
                        <div className="rounded-full bg-chart-1/10 px-3 py-1 text-xs text-chart-1">
                          Success Rate 97%
                        </div>
                      </div>
                      
                      {/* Mock Chart/Visual */}
                      <div className="h-16 w-full rounded bg-gradient-to-r from-primary/20 to-chart-1/20"></div>
                    </div>
                  </div>
                </div>
                
                {/* Project Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">{project.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
