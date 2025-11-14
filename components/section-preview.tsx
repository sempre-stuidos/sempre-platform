"use client"

import * as React from "react"

interface SectionPreviewProps {
  component: string
  content: Record<string, any>
}

export function SectionPreview({ component, content }: SectionPreviewProps) {
  const renderComponent = () => {
    switch (component) {
      case 'InfoBar':
        return (
          <div className="bg-primary text-primary-foreground text-sm py-3">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
              <div className="flex gap-8">
                <span>{content.hours || 'Hours: 5PM - 11PM Daily'}</span>
                <span>{content.phone || '+1 (555) 123-4567'}</span>
              </div>
              <span>{content.tagline || 'Fine Dining Experience'}</span>
            </div>
          </div>
        )

      case 'HeroWelcome':
      case 'HeroSection':
        return (
          <section className="relative h-64 flex items-center justify-center overflow-hidden bg-gradient-to-b from-secondary to-background">
            {content.imageUrl && (
              <div className="absolute inset-0 opacity-10">
                <img 
                  src={content.imageUrl}
                  alt="Hero background"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="relative z-10 text-center px-4">
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4 text-balance">
                {content.title || 'Culinary Excellence'}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                {content.subtitle || 'Experience an unforgettable evening of refined cuisine and impeccable service'}
              </p>
              {content.ctaLabel && (
                <button className="bg-primary text-primary-foreground px-6 py-2 text-base hover:opacity-90 transition">
                  {content.ctaLabel}
                </button>
              )}
            </div>
          </section>
        )

      case 'PromoCard':
        return (
          <div className="bg-background rounded-lg overflow-hidden shadow-lg">
            {content.imageUrl && (
              <img 
                src={content.imageUrl}
                alt={content.title || 'Promo'}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              {content.eyebrow && (
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                  {content.eyebrow}
                </p>
              )}
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                {content.title || 'Delicious Breakfast Menu'}
              </h3>
              {content.hours && (
                <p className="text-muted-foreground mb-4">{content.hours}</p>
              )}
              {content.ctaLabel && (
                <button className="text-primary font-semibold hover:text-primary/80 transition">
                  {content.ctaLabel} →
                </button>
              )}
            </div>
          </div>
        )

      case 'WhyWeStand':
        return (
          <section className="py-12 bg-background">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4 text-center">
                Why People Love Us
              </h2>
              <div className="h-1 w-16 bg-primary mx-auto mb-8"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {(content.reasons || []).map((reason: any, idx: number) => (
                  <div key={idx} className="text-center">
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-serif font-bold text-primary">{idx + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{reason.title || 'Title'}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{reason.description || 'Description'}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'Specialties':
        return (
          <section className="py-12 bg-secondary/20">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-8 text-center">
                Our Specialties
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(content.specialties || []).map((item: any, idx: number) => (
                  <div key={idx} className="bg-background rounded-lg overflow-hidden shadow-lg">
                    {item.image && (
                      <img 
                        src={item.image}
                        alt={item.title || 'Specialty'}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-serif font-bold text-foreground mb-2">{item.title || 'Title'}</h3>
                      <p className="text-muted-foreground mb-4 text-sm">{item.description || 'Description'}</p>
                      <button className="text-primary font-semibold hover:text-primary/80 transition text-sm">
                        Learn More →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      default:
        return (
          <div className="p-4 border rounded-lg">
            <p className="text-muted-foreground text-sm">
              Preview for {component} component not yet implemented.
            </p>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        )
    }
  }

  return (
    <div className="w-full">
      {renderComponent()}
    </div>
  )
}

