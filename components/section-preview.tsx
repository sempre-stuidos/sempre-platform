"use client"

import * as React from "react"

interface SectionPreviewProps {
  component: string
  content: Record<string, unknown>
}

export function SectionPreview({ component, content }: SectionPreviewProps) {
  // Helper function to safely get string value
  const getStringValue = (value: unknown, defaultValue: string): string => {
    return typeof value === 'string' ? value : defaultValue
  }

  const renderComponent = () => {
    switch (component) {
      case 'InfoBar':
        return (
          <div className="bg-primary text-primary-foreground text-sm py-3">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
              <div className="flex gap-8">
                <span>{getStringValue(content.hours, 'Hours: 5PM - 11PM Daily')}</span>
                <span>{getStringValue(content.phone, '+1 (555) 123-4567')}</span>
              </div>
              <span>{getStringValue(content.tagline, 'Fine Dining Experience')}</span>
            </div>
          </div>
        )

      case 'HeroWelcome':
      case 'HeroSection':
        return (
          <section className="relative h-64 flex items-center justify-center overflow-hidden bg-gradient-to-b from-secondary to-background">
            {typeof content.imageUrl === 'string' && content.imageUrl && (
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
                {getStringValue(content.title, 'Culinary Excellence')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                {getStringValue(content.subtitle, 'Experience an unforgettable evening of refined cuisine and impeccable service')}
              </p>
              {typeof content.ctaLabel === 'string' && content.ctaLabel && (
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
            {typeof content.imageUrl === 'string' && content.imageUrl && (
              <img 
                src={content.imageUrl}
                alt={getStringValue(content.title, 'Promo')}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              {typeof content.eyebrow === 'string' && content.eyebrow && (
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                  {content.eyebrow}
                </p>
              )}
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                {getStringValue(content.title, 'Delicious Breakfast Menu')}
              </h3>
              {typeof content.hours === 'string' && content.hours && (
                <p className="text-muted-foreground mb-4">{content.hours}</p>
              )}
              {typeof content.ctaLabel === 'string' && content.ctaLabel && (
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
                {(Array.isArray(content.reasons) ? content.reasons : []).map((reason: Record<string, unknown>, idx: number) => (
                  <div key={idx} className="text-center">
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-serif font-bold text-primary">{idx + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{getStringValue(reason.title, 'Title')}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{getStringValue(reason.description, 'Description')}</p>
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
                {(Array.isArray(content.specialties) ? content.specialties : []).map((item: Record<string, unknown>, idx: number) => (
                  <div key={idx} className="bg-background rounded-lg overflow-hidden shadow-lg">
                    {typeof item.image === 'string' && item.image && (
                      <img 
                        src={item.image}
                        alt={getStringValue(item.title, 'Specialty')}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-serif font-bold text-foreground mb-2">{getStringValue(item.title, 'Title')}</h3>
                      <p className="text-muted-foreground mb-4 text-sm">{getStringValue(item.description, 'Description')}</p>
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

      case 'GalleryTeaser':
        return (
          <section className="py-12 bg-background">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4 text-center">
                Gallery
              </h2>
              <div className="h-1 w-16 bg-primary mx-auto mb-8"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {(Array.isArray(content.images) ? content.images : []).map((img: unknown, idx: number) => (
                  <div key={idx} className="h-48 overflow-hidden rounded-lg shadow-lg">
                    <img 
                      src={typeof img === 'string' ? img : "/placeholder.svg"}
                      alt={`Gallery image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {typeof content.ctaLabel === 'string' && content.ctaLabel && (
                <div className="text-center">
                  <button className="bg-primary text-primary-foreground px-6 py-2 text-sm hover:opacity-90 transition">
                    {content.ctaLabel}
                  </button>
                </div>
              )}
            </div>
          </section>
        )

      case 'CTABanner':
        return (
          <section className="py-12 bg-primary text-primary-foreground text-center">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                {getStringValue(content.title, 'Ready to Dine with Us?')}
              </h2>
              <p className="text-lg md:text-xl mb-6 opacity-95">
                {getStringValue(content.description, 'Reserve your table now and prepare for an unforgettable culinary journey')}
              </p>
              {typeof content.ctaLabel === 'string' && content.ctaLabel && (
                <button className="bg-primary-foreground text-primary px-8 py-3 text-base font-semibold hover:opacity-90 transition">
                  {content.ctaLabel}
                </button>
              )}
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

