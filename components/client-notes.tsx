"use client"

import { IconPlus, IconEdit, IconTrash, IconUser, IconCalendar, IconLock } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"

interface Note {
  id: number
  content: string
  author: string
  createdAt: string
  isInternal: boolean
  tags: string[]
}

interface ClientNotesProps {
  clientId: number
}

export function ClientNotes({ clientId }: ClientNotesProps) {
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingNote, setEditingNote] = useState<number | null>(null)
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      content: "Initial client meeting went very well. They're interested in a complete digital transformation including website redesign, SEO, and social media management. Budget seems flexible, priority client.",
      author: "Sarah Johnson",
      createdAt: "2024-01-15T10:30:00Z",
      isInternal: true,
      tags: ["meeting", "budget", "priority"]
    },
    {
      id: 2,
      content: "Client mentioned they're having issues with their current booking system - frequent crashes and poor user experience. This could be a great opportunity for our booking system integration service.",
      author: "Mike Chen",
      createdAt: "2024-01-14T14:20:00Z",
      isInternal: true,
      tags: ["technical", "opportunity", "booking"]
    },
    {
      id: 3,
      content: "Follow-up call scheduled for next Tuesday at 2 PM. Need to prepare proposal for landing page development and SEO package. Client specifically mentioned wanting to increase online conversions.",
      author: "Emily Davis",
      createdAt: "2024-01-13T16:45:00Z",
      isInternal: true,
      tags: ["follow-up", "proposal", "conversions"]
    },
    {
      id: 4,
      content: "Client sent over their brand guidelines and style preferences. They prefer modern, clean designs with blue and white color scheme. Also provided access to their current website for analysis.",
      author: "Alex Rodriguez",
      createdAt: "2024-01-12T09:15:00Z",
      isInternal: true,
      tags: ["brand", "design", "assets"]
    }
  ])

  const [newNote, setNewNote] = useState({
    content: "",
    isInternal: true,
    tags: ""
  })

  const handleAddNote = () => {
    if (newNote.content.trim()) {
      const note: Note = {
        id: notes.length + 1,
        content: newNote.content,
        author: "Current User", // In a real app, this would be the logged-in user
        createdAt: new Date().toISOString(),
        isInternal: newNote.isInternal,
        tags: newNote.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
      }
      setNotes([note, ...notes])
      setNewNote({ content: "", isInternal: true, tags: "" })
      setIsAddingNote(false)
    }
  }

  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id))
  }

  const handleEditNote = (id: number) => {
    const note = notes.find(n => n.id === id)
    if (note) {
      setNewNote({
        content: note.content,
        isInternal: note.isInternal,
        tags: note.tags.join(", ")
      })
      setEditingNote(id)
      setIsAddingNote(true)
    }
  }

  const handleUpdateNote = () => {
    if (editingNote && newNote.content.trim()) {
      setNotes(notes.map(note => 
        note.id === editingNote 
          ? {
              ...note,
              content: newNote.content,
              isInternal: newNote.isInternal,
              tags: newNote.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
            }
          : note
      ))
      setNewNote({ content: "", isInternal: true, tags: "" })
      setEditingNote(null)
      setIsAddingNote(false)
    }
  }

  const handleCancel = () => {
    setNewNote({ content: "", isInternal: true, tags: "" })
    setEditingNote(null)
    setIsAddingNote(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Add Note Section */}
      {isAddingNote && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingNote ? "Edit Note" : "Add New Note"}
            </CardTitle>
            <CardDescription>
              {editingNote ? "Update the note content" : "Add internal notes about this client"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="noteContent">Note Content</Label>
              <Textarea
                id="noteContent"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Write your note here..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noteTags">Tags (comma-separated)</Label>
              <Input
                id="noteTags"
                value={newNote.tags}
                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                placeholder="e.g., meeting, budget, follow-up"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isInternal"
                checked={newNote.isInternal}
                onChange={(e) => setNewNote({ ...newNote, isInternal: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isInternal" className="flex items-center gap-2">
                <IconLock className="h-4 w-4" />
                Internal note (not client-facing)
              </Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingNote ? handleUpdateNote : handleAddNote}>
                {editingNote ? "Update Note" : "Add Note"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Notes</CardTitle>
              <CardDescription>Internal notes and communication history</CardDescription>
            </div>
            {!isAddingNote && (
              <Button onClick={() => setIsAddingNote(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(note.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{note.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(note.createdAt)}
                        </span>
                        {note.isInternal && (
                          <Badge variant="secondary" className="text-xs">
                            <IconLock className="h-3 w-3 mr-1" />
                            Internal
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{note.content}</p>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note.id)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No notes added yet. Click &quot;Add Note&quot; to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
