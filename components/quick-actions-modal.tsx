"use client"

import { IconNote, IconPlus, IconFolder } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function QuickActionsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden sm:flex">
          Quick Actions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Actions</DialogTitle>
          <DialogDescription>
            Choose an action to quickly create new content
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 justify-start"
            onClick={() => {
              // Handle add note action
              console.log("Add note clicked")
            }}
          >
            <IconNote className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Add Note</div>
              <div className="text-sm text-muted-foreground">
                Create a new note in Knowledge Base
              </div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 justify-start"
            onClick={() => {
              // Handle create todo action
              console.log("Create todo clicked")
            }}
          >
            <IconPlus className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Create Todo</div>
              <div className="text-sm text-muted-foreground">
                Add a new task to your todo list
              </div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 justify-start"
            onClick={() => {
              // Handle new project action
              console.log("New project clicked")
            }}
          >
            <IconFolder className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">New Project</div>
              <div className="text-sm text-muted-foreground">
                Start a new project workspace
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
