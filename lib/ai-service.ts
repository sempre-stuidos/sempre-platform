import { ProjectCreationOptions } from '../components/project-creation-type-modal'

export interface GenerationStep {
  name: string
  progress: number
  status: 'pending' | 'in-progress' | 'completed' | 'error'
}

export interface GenerationProgress {
  currentStep: string
  progress: number
  steps: GenerationStep[]
}

export interface AIGenerationParams {
  proposalContent: string
  proposalTitle: string
  clientName?: string
  creationOptions: ProjectCreationOptions
  onProgress?: (progress: GenerationProgress) => void
}

export interface GeneratedProjectData {
  name: string
  description: string
  deliverables?: string[]
  timeline?: Array<{ milestone: string; date: string; status: "completed" | "in-progress" | "pending" }>
  tasks?: Array<{ id: number; title: string; status: "completed" | "in-progress" | "pending"; deliverable: string; priority: string; dueDate: string }>
  budget?: number
  priority?: 'High' | 'Medium' | 'Low'
  startDate?: string
  dueDate?: string
}

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.aimlapi.com/v1'
const AI_API_KEY = process.env.AI_API_KEY || 'd75d97c23cc14897920e34eafef280ea'
const AI_DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || 'gpt-4o'

export async function generateProjectData(params: AIGenerationParams): Promise<GeneratedProjectData> {
  const { proposalContent, proposalTitle, clientName, creationOptions, onProgress } = params
  
  // Initialize progress tracking
  const steps: GenerationStep[] = [
    { name: 'Basic Info', progress: 0, status: 'pending' },
    { name: 'Deliverables', progress: 0, status: 'pending' },
    { name: 'Timeline', progress: 0, status: 'pending' },
    { name: 'Tasks', progress: 0, status: 'pending' }
  ]

  // Filter steps based on selected options
  const activeSteps = steps.filter((_, index) => {
    const optionKeys = ['basic', 'deliverables', 'timeline', 'tasks'] as const
    return creationOptions[optionKeys[index]]
  })

  // Calculate progress increments
  const progressIncrement = 100 / activeSteps.length
  let currentProgress = 0

  const updateProgress = (stepIndex: number, status: GenerationStep['status']) => {
    if (stepIndex < activeSteps.length) {
      activeSteps[stepIndex].status = status
      if (status === 'completed') {
        activeSteps[stepIndex].progress = 100
        currentProgress = Math.min(100, (stepIndex + 1) * progressIncrement)
      } else if (status === 'in-progress') {
        activeSteps[stepIndex].progress = 50
      }
    }

    if (onProgress) {
      onProgress({
        currentStep: activeSteps[stepIndex]?.name || 'Completed',
        progress: currentProgress,
        steps: activeSteps
      })
    }
  }

  try {
    const generatedData: GeneratedProjectData = {
      name: proposalTitle,
      description: proposalContent
    }

    // Step 1: Generate Basic Info
    if (creationOptions.basic) {
      updateProgress(0, 'in-progress')
      const basicInfo = await generateBasicInfo(proposalContent, proposalTitle, clientName)
      Object.assign(generatedData, basicInfo)
      updateProgress(0, 'completed')
    }

    // Step 2: Generate Deliverables
    if (creationOptions.deliverables) {
      updateProgress(1, 'in-progress')
      const deliverables = await generateDeliverables(proposalContent)
      generatedData.deliverables = deliverables
      updateProgress(1, 'completed')
    }

    // Step 3: Generate Timeline
    if (creationOptions.timeline) {
      updateProgress(2, 'in-progress')
      const timeline = await generateTimeline(proposalContent)
      generatedData.timeline = timeline.map(t => ({ ...t, status: t.status as "completed" | "in-progress" | "pending" }))
      updateProgress(2, 'completed')
    }

    // Step 4: Generate Tasks
    if (creationOptions.tasks) {
      updateProgress(3, 'in-progress')
      const tasks = await generateTasks(proposalContent)
      generatedData.tasks = tasks.map(t => ({ ...t, status: t.status as "completed" | "in-progress" | "pending" }))
      updateProgress(3, 'completed')
    }

    return generatedData
  } catch (error) {
    console.error('Error generating project data:', error)
    throw new Error('Failed to generate project data')
  }
}

async function generateBasicInfo(content: string, title: string, clientName?: string): Promise<Partial<GeneratedProjectData>> {
  const prompt = `Based on this project proposal, generate basic project information:

Title: ${title}
Client: ${clientName || 'Not specified'}
Content: ${content}

Please generate:
1. A refined project name (if needed)
2. A concise project description (2-3 sentences)
3. Estimated budget range (in USD)
4. Project priority (High/Medium/Low)
5. Suggested start date (YYYY-MM-DD format)
6. Suggested due date (YYYY-MM-DD format)

Return as JSON:
{
  "name": "refined project name",
  "description": "concise description",
  "budget": number,
  "priority": "High|Medium|Low",
  "startDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD"
}`

  const response = await callAI(prompt)
  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse basic info JSON:', response)
    throw new Error('AI returned invalid JSON format for basic info')
  }
}

async function generateDeliverables(content: string): Promise<string[]> {
  const prompt = `Based on this project proposal, generate 3-5 specific deliverables:

${content}

Return as JSON array of strings:
["deliverable 1", "deliverable 2", "deliverable 3"]`

  const response = await callAI(prompt)
  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse deliverables JSON:', response)
    throw new Error('AI returned invalid JSON format for deliverables')
  }
}

async function generateTimeline(content: string): Promise<Array<{ milestone: string; date: string; status: string }>> {
  const prompt = `Based on this project proposal, generate a project timeline with 4-6 milestones:

${content}

Return as JSON array:
[
  {
    "milestone": "milestone name",
    "date": "YYYY-MM-DD",
    "status": "pending"
  }
]`

  const response = await callAI(prompt)
  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse timeline JSON:', response)
    throw new Error('AI returned invalid JSON format for timeline')
  }
}

async function generateTasks(content: string): Promise<Array<{ id: number; title: string; status: "completed" | "in-progress" | "pending"; deliverable: string; priority: string; dueDate: string }>> {
  const prompt = `Based on this project proposal, generate 4-6 initial project tasks:

${content}

Return as JSON array:
[
  {
    "id": 0,
    "title": "task title",
    "status": "pending",
    "deliverable": "deliverable description",
    "priority": "High|Medium|Low",
    "dueDate": "YYYY-MM-DD"
  }
]`

  const response = await callAI(prompt)
  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse tasks JSON:', response)
    throw new Error('AI returned invalid JSON format for tasks')
  }
}

async function callAI(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a project management assistant. Generate structured, professional project data based on proposal content. Always return valid JSON without markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    let content = data.choices[0].message.content
    
    // Clean up markdown code blocks if present
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/, '').replace(/\s*```$/, '')
    } else if (content.includes('```')) {
      content = content.replace(/```\s*/, '').replace(/\s*```$/, '')
    }
    
    return content.trim()
  } catch (error) {
    console.error('AI API call failed:', error)
    throw error
  }
}
