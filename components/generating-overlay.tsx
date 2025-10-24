"use client"

import { motion, AnimatePresence } from "framer-motion"
import { IconLoader2, IconCheck, IconX } from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"

export interface GenerationProgress {
  currentStep: string
  progress: number
  steps: Array<{
    name: string
    progress: number
    status: 'pending' | 'in-progress' | 'completed' | 'error'
  }>
}

interface GeneratingOverlayProps {
  isOpen: boolean
  progress: GenerationProgress
  onClose?: () => void
}

export function GeneratingOverlay({ isOpen, progress, onClose }: GeneratingOverlayProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <IconCheck className="h-4 w-4 text-green-500" />
      case 'in-progress':
        return <IconLoader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <IconX className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'in-progress':
        return 'text-blue-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Card className="w-full max-w-md mx-4">
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                  >
                    <IconLoader2 className="h-6 w-6 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generating Project
                  </h3>
                  <p className="text-sm text-gray-600">
                    AI is creating your project data...
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{Math.round(progress.progress)}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                </div>

                {/* Current Step */}
                <div className="text-center">
                  <motion.p
                    key={progress.currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-medium text-gray-900"
                  >
                    {progress.currentStep}
                  </motion.p>
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  {progress.steps.map((step, index) => (
                    <motion.div
                      key={step.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex-shrink-0">
                        {getStepIcon(step.status)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${getStepColor(step.status)}`}>
                          {step.name}
                        </p>
                        {step.status === 'in-progress' && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 0.5 }}
                            className="h-1 bg-blue-200 rounded-full mt-1"
                          >
                            <motion.div
                              className="h-full bg-blue-500 rounded-full"
                              animate={{ width: `${step.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Cancel Button */}
                {onClose && (
                  <div className="text-center">
                    <button
                      onClick={onClose}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancel Generation
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

