"use client"

import { useState } from "react"
import { ServicesDataTable } from "@/components/services-data-table"

interface Service {
  id: number
  name: string
  status: "Active" | "Completed" | "On Hold" | "Cancelled"
  startDate: string
  endDate?: string
  description: string
  price: number
  progress: number
}

interface ClientServicesProps {
  clientId: number
}

export function ClientServices({ clientId }: ClientServicesProps) {
  const [services, setServices] = useState<Service[]>([
    {
      id: 1,
      name: "Landing Page Development",
      status: "Active",
      startDate: "2024-01-01",
      description: "Modern, responsive landing page with contact forms and analytics integration",
      price: 5000,
      progress: 75
    },
    {
      id: 2,
      name: "SEO Optimization",
      status: "Active",
      startDate: "2024-01-15",
      description: "Complete SEO audit and optimization for better search engine rankings",
      price: 3000,
      progress: 40
    },
    {
      id: 3,
      name: "Booking System Integration",
      status: "Completed",
      startDate: "2023-12-01",
      endDate: "2023-12-20",
      description: "Custom booking system with payment processing and calendar integration",
      price: 8000,
      progress: 100
    },
    {
      id: 4,
      name: "Social Media Management",
      status: "On Hold",
      startDate: "2024-01-10",
      description: "Monthly social media content creation and management",
      price: 2000,
      progress: 20
    }
  ])

  const handleAddService = (newService: Service) => {
    setServices([newService, ...services])
  }

  return (
    <ServicesDataTable 
      data={services} 
      onAddService={handleAddService}
    />
  )
}
