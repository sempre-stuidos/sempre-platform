"use client"

import { motion } from "framer-motion"

export function AboutSection() {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  }

  return (
    <section className="bg-background py-16 px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          custom={0}
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl mb-4">
            WHO WE ARE
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sempre Studios is a leading digital agency dedicated to transforming innovative ideas into exceptional digital experiences.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="mx-auto max-w-5xl">
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8"
          >
            <div className="text-3xl font-light leading-relaxed text-foreground md:text-4xl lg:text-5xl">
              <p className="mb-6">
                At Sempre Studios, we are passionate about creating digital solutions that drive real business results. 
                Our team of expert designers, developers, and strategists work collaboratively to transform your vision 
                into powerful digital experiences that engage, convert, and grow your business.
              </p>
              
              <p className="mb-6">
                We believe in the power of technology to solve complex challenges and create meaningful connections. 
                From concept to launch, we partner with you every step of the way, ensuring that every solution we deliver 
                aligns with your business goals and exceeds your expectations.
              </p>
              
              <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-primary">
                Our goal is simple: to help you succeed in the digital landscape through innovative, 
                scalable, and user-centered solutions that make a lasting impact.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <motion.div
          custom={2}
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 flex justify-center"
        >
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
            <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
            <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
