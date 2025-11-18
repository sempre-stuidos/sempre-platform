import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById } from '@/lib/organizations';
import { getTutorialById, getTutorials } from '@/lib/tutorials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { SetTutorialBreadcrumb } from '@/components/set-tutorial-breadcrumb';

interface TutorialDetailPageProps {
  params: Promise<{
    orgId: string;
    tutorialId: string;
  }>;
}

export default async function TutorialDetailPage({ params }: TutorialDetailPageProps) {
  const { orgId, tutorialId } = await params;
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
  
  // Fetch tutorial and all tutorials for navigation
  const [tutorial, tutorialsResult] = await Promise.all([
    getTutorialById(tutorialId, supabaseServer),
    getTutorials(supabaseServer),
  ]);

  const allTutorials = tutorialsResult.tutorials;

  if (!tutorial) {
    notFound();
  }

  // Find previous and next tutorials
  const currentIndex = allTutorials.findIndex(t => t.id === tutorialId);
  const previousTutorial = currentIndex > 0 ? allTutorials[currentIndex - 1] : null;
  const nextTutorial = currentIndex < allTutorials.length - 1 ? allTutorials[currentIndex + 1] : null;

  return (
    <>
      <SetTutorialBreadcrumb tutorialTitle={tutorial.title} />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            {/* Description */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-muted-foreground text-lg">{tutorial.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-sm">
                    {tutorial.estimated_time}
                  </Badge>
                </div>
              </div>
              <Button>
                Take Tour
              </Button>
            </div>

          {/* Tutorial Steps */}
          <div className="space-y-4 mb-8">
            {tutorial.content.steps.map((step, index) => (
              <Card key={step.stepNumber} className="relative">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        {step.stepNumber}
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="mb-2">{step.title}</CardTitle>
                      <CardDescription className="mb-3">{step.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="ml-14">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-foreground whitespace-pre-line">
                        {step.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex-1">
              {previousTutorial && (
                <Link href={`/client/${orgId}/how-to/${previousTutorial.id}`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <IconChevronLeft className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Previous</div>
                      <div className="font-medium">{previousTutorial.title}</div>
                    </div>
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              {nextTutorial && (
                <Link href={`/client/${orgId}/how-to/${nextTutorial.id}`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Next</div>
                      <div className="font-medium">{nextTutorial.title}</div>
                    </div>
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

