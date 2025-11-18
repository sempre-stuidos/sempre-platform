import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById } from '@/lib/organizations';
import { getTutorials } from '@/lib/tutorials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  IconPlus,
  IconEdit,
  IconCalendar,
  IconArchive,
  IconMenu2,
  IconTrash,
  IconBook,
} from '@tabler/icons-react';

// Map icon names to actual icon components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  IconPlus,
  IconEdit,
  IconCalendar,
  IconArchive,
  IconMenu2,
  IconTrash,
  IconBook,
};

interface HowToPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function HowToPage({ params }: HowToPageProps) {
  const { orgId } = await params;
  const cookieStore = await cookies();
  
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabaseServer.auth.getUser();
  const organization = await getOrganizationById(orgId, supabaseServer);
  
  // Fetch tutorials from database
  const { tutorials, error: tutorialsError } = await getTutorials(supabaseServer);

  // Log for debugging
  if (tutorialsError) {
    console.error('Tutorials fetch error:', tutorialsError.message);
  }
  console.log('Tutorials fetched:', tutorials.length);

  // Group tutorials by category
  const eventsTutorials = tutorials.filter(t => t.category === 'Events');
  const menuTutorials = tutorials.filter(t => t.category === 'Menu');

  // Check if there's an error (likely table doesn't exist)
  const isTableError = tutorialsError && (
    tutorialsError.message.includes('relation') ||
    tutorialsError.message.includes('does not exist') ||
    tutorialsError.message.includes('permission denied') ||
    tutorialsError.message.includes('42P01') // PostgreSQL error code for "relation does not exist"
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Step-by-step tutorials to help you manage your restaurant dashboard.
            </p>
          </div>

          {/* Events Tutorials Section */}
          {eventsTutorials.length > 0 && (
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-2">Events</h2>
                <p className="text-muted-foreground text-sm">
                  Learn how to create, edit, and manage events for your restaurant.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {eventsTutorials.map((tutorial) => {
                  const IconComponent = iconMap[tutorial.icon] || IconBook;
                  return (
                    <Link
                      key={tutorial.id}
                      href={`/client/${orgId}/how-to/${tutorial.id}`}
                      className="block"
                    >
                      <Card className="h-full transition-all hover:shadow-md cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardDescription>Events</CardDescription>
                              <CardTitle className="mt-1">{tutorial.title}</CardTitle>
                            </div>
                            <CardAction>
                              <div className="rounded-lg bg-primary/10 p-2">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                            </CardAction>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {tutorial.description}
                          </p>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {tutorial.estimated_time}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tutorial.content.steps.length} steps
                          </span>
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Menu Tutorials Section */}
          {menuTutorials.length > 0 && (
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-2">Menu</h2>
                <p className="text-muted-foreground text-sm">
                  Learn how to manage your menu items, categories, and pricing.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {menuTutorials.map((tutorial) => {
                  const IconComponent = iconMap[tutorial.icon] || IconBook;
                  return (
                    <Link
                      key={tutorial.id}
                      href={`/client/${orgId}/how-to/${tutorial.id}`}
                      className="block"
                    >
                      <Card className="h-full transition-all hover:shadow-md cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardDescription>Menu</CardDescription>
                              <CardTitle className="mt-1">{tutorial.title}</CardTitle>
                            </div>
                            <CardAction>
                              <div className="rounded-lg bg-primary/10 p-2">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                            </CardAction>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {tutorial.description}
                          </p>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {tutorial.estimated_time}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tutorial.content.steps.length} steps
                          </span>
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error State - Table doesn't exist */}
          {isTableError && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-8 text-center">
              <IconBook className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-yellow-900">Database Migration Required</h2>
              <p className="text-yellow-800 mb-4">
                The tutorials table doesn&apos;t exist yet. Please run the database migrations first.
              </p>
              <p className="text-sm text-yellow-700">
                Run: <code className="bg-yellow-100 px-2 py-1 rounded">supabase migration up</code>
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isTableError && tutorials.length === 0 && (
            <div className="rounded-md border p-8 text-center">
              <IconBook className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tutorials available at this time.</p>
              {tutorialsError && (
                <p className="text-sm text-muted-foreground mt-2">
                  Error: {tutorialsError.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

