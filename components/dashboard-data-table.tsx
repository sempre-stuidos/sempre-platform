"use client"

import * as React from "react"
import { SimpleTasksTable } from "@/components/simple-tasks-table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconFilter, IconChevronDown, IconPlus } from "@tabler/icons-react"

interface TaskData {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  dueDate: string;
  assignee: string;
  projectName?: string;
}

interface Project {
  id: number;
  name: string;
}

interface DashboardDataTableProps {
  allTasks: TaskData[];
  highPriorityTasks: TaskData[];
  tasksDueThisWeek: TaskData[];
  completedTasks: TaskData[];
  taskCounts: {
    highPriority: number;
    dueThisWeek: number;
    completed: number;
  };
  projectsList: Project[];
}

export function DashboardDataTable({
  allTasks,
  highPriorityTasks,
  tasksDueThisWeek,
  completedTasks,
  taskCounts,
  projectsList,
}: DashboardDataTableProps) {
  const [selectedTab, setSelectedTab] = React.useState("all-tasks")
  const [selectedProject, setSelectedProject] = React.useState<string>("all")

  const getDataForTab = (tab: string) => {
    let tasks: TaskData[] = []
    
    switch (tab) {
      case "all-tasks":
        tasks = allTasks
        break
      case "high-priority":
        tasks = highPriorityTasks
        break
      case "due-this-week":
        tasks = tasksDueThisWeek
        break
      case "completed":
        tasks = completedTasks
        break
      default:
        tasks = allTasks
    }
    
    // Filter by project if a specific project is selected
    if (selectedProject !== "all") {
      tasks = tasks.filter(task => task.projectName === selectedProject)
    }
    
    return tasks
  }

  return (
    <Tabs
      value={selectedTab}
      onValueChange={setSelectedTab}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={selectedTab} onValueChange={setSelectedTab}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-tasks">All Tasks</SelectItem>
            <SelectItem value="high-priority">High Priority</SelectItem>
            <SelectItem value="due-this-week">Due This Week</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="high-priority">
            High Priority <Badge variant="secondary">{taskCounts.highPriority}</Badge>
          </TabsTrigger>
          <TabsTrigger value="due-this-week">
            Due This Week <Badge variant="secondary">{taskCounts.dueThisWeek}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed <Badge variant="secondary">{taskCounts.completed}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconFilter />
                <span className="hidden lg:inline">Filter by Project</span>
                <span className="lg:hidden">Project</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setSelectedProject("all")}>
                All Projects
              </DropdownMenuItem>
              {projectsList.map((project) => (
                <DropdownMenuItem 
                  key={project.id} 
                  onClick={() => setSelectedProject(project.name)}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Task</span>
          </Button>
        </div>
      </div>
      
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <SimpleTasksTable data={getDataForTab(selectedTab)} />
      </div>
    </Tabs>
  )
}

