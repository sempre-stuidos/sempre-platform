import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PresentationPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Presentation</h2>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Presentation Tools</CardTitle>
            <CardDescription>
              Create and manage presentations for your agency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is where you can create, edit, and manage presentations for your agency.
              More features will be added here in the future.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
